import { requestGateway } from './gatewayClient';

export type AgentTaskStatus = 'queued' | 'running' | 'waiting_for_approval' | 'stopping' | 'completed' | 'failed' | 'cancelled';

export interface AgentTask {
  id: string;
  status: AgentTaskStatus;
  output: string | null;
  error: string | null;
  remoteAvailable?: boolean;
}

export interface CreateAgentTask {
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  providerConnectionId: string;
  input: string;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const statuses: AgentTaskStatus[] = ['queued', 'running', 'waiting_for_approval', 'stopping', 'completed', 'failed', 'cancelled'];

export const parseAgentTask = (value: unknown, expectedId?: string): AgentTask => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Gateway returned invalid task data.');
  const task = value as Record<string, unknown>;
  if (typeof task.id !== 'string' || !uuidPattern.test(task.id) || (expectedId && task.id !== expectedId) ||
      typeof task.status !== 'string' || !statuses.includes(task.status as AgentTaskStatus) ||
      (task.output !== null && typeof task.output !== 'string') || (task.error !== null && typeof task.error !== 'string') ||
      (task.remoteAvailable !== undefined && typeof task.remoteAvailable !== 'boolean')) {
    throw new Error('Gateway returned invalid task data.');
  }
  return { id: task.id, status: task.status as AgentTaskStatus, output: task.output as string | null, error: task.error as string | null,
    ...(typeof task.remoteAvailable === 'boolean' ? { remoteAvailable: task.remoteAvailable } : {}) };
};

export const createAgentTaskClient = (gatewayUrl: string, accessToken: string) => ({
  create: async (task: CreateAgentTask, signal?: AbortSignal): Promise<AgentTask> => {
    if (!uuidPattern.test(task.organizationId) || !uuidPattern.test(task.providerConnectionId) ||
        (task.workspaceId && !uuidPattern.test(task.workspaceId)) || (task.projectId && !uuidPattern.test(task.projectId)) ||
        !task.input.trim() || task.input.length > 12000) throw new Error('Invalid task context or input.');
    const response = await requestGateway<unknown>(gatewayUrl, '/agent/tasks', {
      method: 'POST', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' }, body: JSON.stringify(task),
    });
    return parseAgentTask(response);
  },
  get: async (id: string, signal?: AbortSignal): Promise<AgentTask> => {
    if (!uuidPattern.test(id)) throw new Error('Invalid task ID.');
    const response = await requestGateway<unknown>(gatewayUrl, `/agent/tasks/${encodeURIComponent(id)}`, {
      headers: { authorization: `Bearer ${accessToken}` }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    });
    return parseAgentTask(response, id);
  },
});
