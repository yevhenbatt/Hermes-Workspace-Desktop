import { useEffect, useMemo, useRef, useState } from 'react';
import type { DesktopContext } from '../../gateway/gatewayClient';
import { createAgentTaskClient, type AgentTask } from '../../gateway/agentTaskClient';
import { createProviderConnectionClient, type ProviderConnection } from '../../gateway/providerConnectionClient';
import { formatAgentTaskError } from './agentTaskError';

export interface TaskMessage {
  id: string;
  input: string;
  task: AgentTask | null;
  error: string | null;
}

const terminal = (task: AgentTask) => ['completed', 'failed', 'cancelled'].includes(task.status);

export const useAgentTask = (gatewayUrl: string, accessToken: string, context: DesktopContext) => {
  const client = useMemo(() => createAgentTaskClient(gatewayUrl, accessToken), [gatewayUrl, accessToken]);
  const providerClient = useMemo(() => createProviderConnectionClient(gatewayUrl, accessToken), [gatewayUrl, accessToken]);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const current = ++generation.current;
    const request = new AbortController();
    controller.current = request;
    inFlight.current = false;
    setBusy(false);
    setMessages([]);
    setError(null);
    setConnections([]);
    setSelectedConnectionId('');
    const load = async () => {
      try {
        const items = await providerClient.list(AbortSignal.any([request.signal, AbortSignal.timeout(15000)]));
        if (generation.current !== current) return;
        const available = items.filter((item) => item.provider === 'codex' && item.status === 'active' && item.canUse);
        setConnections(available);
        if (available.length === 1) setSelectedConnectionId(available[0].id);
      } catch (reason) {
        if (generation.current === current) setError(reason instanceof Error ? reason.message : 'Unable to load provider connections.');
      }
    };
    if (gatewayUrl && accessToken) void load();
    return () => { generation.current += 1; request.abort(); };
  }, [providerClient, gatewayUrl, accessToken, context.organizationId, context.workspaceId, context.projectId]);

  const send = async (input: string): Promise<boolean> => {
    if (inFlight.current || !context.organizationId || !context.workspaceId || !selectedConnectionId || !input.trim()) return false;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const current = generation.current;
    const signal = controller.current?.signal;
    const messageId = crypto.randomUUID();
    let taskId: string | null = null;
    setMessages((items) => [...items, { id: messageId, input, task: null, error: null }]);
    try {
      let task = await client.create({ organizationId: context.organizationId, workspaceId: context.workspaceId,
        ...(context.projectId ? { projectId: context.projectId } : {}), providerConnectionId: selectedConnectionId, input }, signal);
      taskId = task.id;
      if (generation.current !== current) return true;
      const initialTask = task;
      setMessages((items) => items.map((item) => item.id === messageId ? { ...item, task: initialTask } : item));
      for (let attempt = 0; attempt < 120 && !terminal(task); attempt += 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 2000));
        if (generation.current !== current) return true;
        task = await client.get(task.id, signal);
        if (generation.current !== current) return true;
        const nextTask = task;
        setMessages((items) => items.map((item) => item.id === messageId ? { ...item, task: nextTask } : item));
      }
      if (!terminal(task) && generation.current === current) setMessages((items) => items.map((item) => item.id === messageId ? { ...item, error: 'Status polling timed out. The task may still be running; do not resubmit blindly.' } : item));
      return true;
    } catch (reason) {
      if (generation.current === current) {
        const message = formatAgentTaskError(reason, taskId);
        setMessages((items) => items.map((item) => item.id === messageId ? { ...item, error: message } : item));
      }
      return true;
    } finally {
      if (generation.current === current) { inFlight.current = false; setBusy(false); }
    }
  };

  return { connections, selectedConnectionId, setSelectedConnectionId, messages, error, busy, send };
};
