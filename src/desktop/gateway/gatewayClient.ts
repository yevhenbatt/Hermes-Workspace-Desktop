export interface GatewayLoginData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DesktopBootstrap {
  user: { id: string; username: string; isPlatformAdmin: boolean };
  context: { organizationId: string | null; workspaceId: string | null; projectId: string | null; persisted: boolean };
  organizationCount: number;
  capabilities: Record<string, boolean>;
}

export type LocalMaterialSourceType = 'obsidian_vault' | 'directory' | 'file';
export type LocalMaterialMode = 'local_only' | 'shared_synced' | 'selective_attachment';

export interface LocalMaterialSource {
  id: string;
  displayName: string;
  sourceType: LocalMaterialSourceType;
  mode: LocalMaterialMode;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GatewayEnvelope<T> { success: boolean; data: T; }

export class GatewayRequestError extends Error {
  public constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'GatewayRequestError';
  }
}

function baseUrl(value: string): string {
  const url = value.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) throw new Error('Адрес Gateway должен начинаться с http:// или https://');
  return url.endsWith('/api/v1') ? url : `${url}/api/v1`;
}

async function request<T>(gatewayUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl(gatewayUrl)}${path}`, {
    ...options,
    headers: { accept: 'application/json', ...options.headers },
  });
  const body = (await response.json().catch(() => null)) as GatewayEnvelope<T> | { message?: string } | null;
  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `Gateway returned HTTP ${response.status}`;
    throw new GatewayRequestError(response.status, message);
  }
  if (!body || !('data' in body)) throw new Error('Gateway returned an unexpected response');
  return body.data;
}

export function loginToGateway(gatewayUrl: string, username: string, password: string): Promise<GatewayLoginData> {
  return request<GatewayLoginData>(gatewayUrl, '/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }),
  });
}

export function getDesktopBootstrap(gatewayUrl: string, accessToken: string): Promise<DesktopBootstrap> {
  return request<DesktopBootstrap>(gatewayUrl, '/desktop/bootstrap', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
}

function authorizedHeaders(accessToken: string): HeadersInit {
  return { authorization: `Bearer ${accessToken}` };
}

export function listLocalMaterialSources(gatewayUrl: string, accessToken: string): Promise<LocalMaterialSource[]> {
  return request<LocalMaterialSource[]>(gatewayUrl, '/local-materials/sources', {
    headers: authorizedHeaders(accessToken),
  });
}

export function createLocalMaterialSource(
  gatewayUrl: string,
  accessToken: string,
  payload: Pick<LocalMaterialSource, 'displayName' | 'sourceType' | 'mode'>,
): Promise<LocalMaterialSource> {
  return request<LocalMaterialSource>(gatewayUrl, '/local-materials/sources', {
    method: 'POST',
    headers: { ...authorizedHeaders(accessToken), 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function revokeLocalMaterialSource(
  gatewayUrl: string,
  accessToken: string,
  sourceId: string,
): Promise<{ id: string; revoked: boolean }> {
  return request<{ id: string; revoked: boolean }>(gatewayUrl, `/local-materials/sources/${encodeURIComponent(sourceId)}`, {
    method: 'DELETE',
    headers: authorizedHeaders(accessToken),
  });
}
