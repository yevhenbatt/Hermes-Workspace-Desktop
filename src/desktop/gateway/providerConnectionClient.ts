import { requestGateway } from './gatewayClient';

export type ProviderConnectionStatus = 'pending' | 'active' | 'revoked';
export type ProviderConnectionProvider = 'codex' | 'claude' | 'gemini';

export interface ProviderConnection {
  id: string;
  ownerUserId: string;
  displayName: string;
  provider: ProviderConnectionProvider;
  status: ProviderConnectionStatus;
  access: 'owner' | 'granted';
  canUse: boolean;
}

export interface ProviderConnectionVerification {
  id: string;
  status: 'pending' | 'active';
  authenticated: boolean;
  verificationMethod: 'codex_login_status';
  changed: boolean;
}

export interface ProviderConnectionClient {
  list: (signal?: AbortSignal) => Promise<ProviderConnection[]>;
  create: (displayName: string, signal?: AbortSignal) => Promise<ProviderConnection>;
  verify: (id: string, signal?: AbortSignal) => Promise<ProviderConnectionVerification>;
  revoke: (id: string, signal?: AbortSignal) => Promise<string>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalidResponse = (): never => { throw new Error('Gateway returned invalid provider connection data.'); };
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalidResponse();
  return value as Record<string, unknown>;
};
const uuid = (value: unknown): string => {
  if (typeof value !== 'string' || !uuidPattern.test(value)) return invalidResponse();
  return value;
};

export const parseProviderConnection = (value: unknown): ProviderConnection => {
  const row = record(value);
  if (typeof row.displayName !== 'string' || !row.displayName.trim() ||
      !['codex', 'claude', 'gemini'].includes(String(row.provider)) ||
      !['pending', 'active', 'revoked'].includes(String(row.status)) ||
      (row.access !== 'owner' && row.access !== 'granted') || typeof row.canUse !== 'boolean') return invalidResponse();
  return {
    id: uuid(row.id), ownerUserId: uuid(row.ownerUserId), displayName: row.displayName,
    provider: row.provider as ProviderConnectionProvider, status: row.status as ProviderConnectionStatus,
    access: row.access, canUse: row.canUse,
  };
};

export const parseProviderVerification = (value: unknown, expectedId: string): ProviderConnectionVerification => {
  const row = record(value);
  if (row.id !== expectedId || (row.status !== 'active' && row.status !== 'pending') ||
      typeof row.authenticated !== 'boolean' || row.authenticated !== (row.status === 'active') ||
      row.verificationMethod !== 'codex_login_status' || typeof row.changed !== 'boolean') return invalidResponse();
  return { id: uuid(row.id), status: row.status, authenticated: row.authenticated, verificationMethod: row.verificationMethod, changed: row.changed };
};

export const canManageProviderConnection = (connection: ProviderConnection, userId: string): boolean => (
  connection.access === 'owner' && connection.ownerUserId === userId && connection.status !== 'revoked'
);

export const createProviderConnectionClient = (gatewayUrl: string, accessToken: string): ProviderConnectionClient => {
  const send = async (path: string, method: string, signal?: AbortSignal, body?: string): Promise<unknown> => requestGateway<unknown>(gatewayUrl, path, {
    method, signal: signal ?? AbortSignal.timeout(15000),
    headers: { authorization: `Bearer ${accessToken}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body } : {}),
  });
  const connectionPath = (id: string) => `/provider-connections/${encodeURIComponent(uuid(id))}`;
  return {
    list: async (signal) => {
      const rows = await send('/provider-connections', 'GET', signal);
      if (!Array.isArray(rows)) return invalidResponse();
      const connections = rows.map(parseProviderConnection);
      if (new Set(connections.map(({ id }) => id)).size !== connections.length) return invalidResponse();
      return connections;
    },
    create: async (displayName, signal) => {
      const name = displayName.trim();
      if (name.length < 3 || name.length > 120) throw new Error('Use a connection name between 3 and 120 characters.');
      const result = parseProviderConnection(await send('/provider-connections', 'POST', signal, JSON.stringify({ provider: 'codex', displayName: name })));
      if (result.access !== 'owner' || result.provider !== 'codex') return invalidResponse();
      return result;
    },
    verify: async (id, signal) => parseProviderVerification(await send(`${connectionPath(id)}/verify`, 'POST', signal), id),
    revoke: async (id, signal) => {
      const result = record(await send(connectionPath(id), 'DELETE', signal));
      if (result.id !== id || result.revoked !== true) return invalidResponse();
      return id;
    },
  };
};
