import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { GatewayRequestError } from '../../gateway/gatewayClient';
import { canManageProviderConnection, createProviderConnectionClient, type ProviderConnection } from '../../gateway/providerConnectionClient';
import { initialProviderConnectionState, providerConnectionReducer, type ProviderConnectionEvent } from './providerConnectionState';

export const useProviderConnections = (gatewayUrl: string, accessToken: string, userId: string) => {
  const client = useMemo(() => createProviderConnectionClient(gatewayUrl, accessToken), [gatewayUrl, accessToken]);
  const [state, dispatch] = useReducer(providerConnectionReducer, initialProviderConnectionState);
  const sessionVersion = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const busy = useRef(false);

  const perform = useCallback(async (action: string, operation: (signal: AbortSignal) => Promise<ProviderConnectionEvent>): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    const version = sessionVersion.current;
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    dispatch({ type: 'start', action });
    try {
      const event = await operation(controller.signal);
      if (version !== sessionVersion.current) return false;
      dispatch(event);
      return true;
    } catch (error) {
      if (version === sessionVersion.current) {
        const message = error instanceof GatewayRequestError && error.status === 401
          ? 'Your Workspace session has expired. Sign in again.'
          : controller.signal.aborted ? 'The request timed out. Refresh the list before trying again.'
          : error instanceof GatewayRequestError ? error.message
          : error instanceof TypeError ? 'Cannot reach Workspace Gateway. Check your connection and try refreshing.'
          : error instanceof Error ? error.message : 'The provider connection request failed.';
        dispatch({ type: 'failed', message });
      }
      return false;
    } finally {
      clearTimeout(timeout);
      if (version === sessionVersion.current) {
        busy.current = false;
        activeRequest.current = null;
        dispatch({ type: 'finish' });
      }
    }
  }, []);

  const refresh = useCallback(async () => perform('refresh', async (signal) => ({ type: 'loaded', connections: await client.list(signal) })), [client, perform]);

  useEffect(() => {
    sessionVersion.current += 1;
    activeRequest.current?.abort();
    busy.current = false;
    dispatch({ type: 'reset' });
    void refresh();
    return () => { sessionVersion.current += 1; activeRequest.current?.abort(); };
  }, [refresh, userId]);

  const create = async (displayName: string) => perform('create', async (signal) => ({ type: 'created', connection: await client.create(displayName, signal) }));
  const verify = async (connection: ProviderConnection) => {
    if (!canManageProviderConnection(connection, userId) || connection.provider !== 'codex') return false;
    return perform(`verify:${connection.id}`, async (signal) => ({ type: 'verified', result: await client.verify(connection.id, signal) }));
  };
  const revoke = async (connection: ProviderConnection) => {
    if (!canManageProviderConnection(connection, userId)) return false;
    return perform(`revoke:${connection.id}`, async (signal) => ({ type: 'revoked', id: await client.revoke(connection.id, signal) }));
  };

  return { ...state, refresh, create, verify, revoke };
};
