import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canManageProviderConnection, createProviderConnectionClient, parseProviderConnection, parseProviderVerification, type ProviderConnection } from './providerConnectionClient';

const id = '6a5fb5be-ebaf-4aa9-af04-645b335510e6';
const userId = 'a11eed4b-b570-407d-8634-004f81bff19b';
const connection: ProviderConnection = { id, ownerUserId: userId, displayName: 'Personal Codex', provider: 'codex', status: 'pending', access: 'owner', canUse: false };
const verification = { id, status: 'active', authenticated: true, verificationMethod: 'codex_login_status', changed: true };
const fetchMock = vi.fn<typeof fetch>();
const client = createProviderConnectionClient('http://127.0.0.1:3000/api/v1', 'test-jwt');
const respond = (data: unknown) => fetchMock.mockResolvedValueOnce(Response.json({ success: true, data }));

beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('provider connection client', () => {
  it('loads metadata only through Gateway using the Workspace JWT', async () => {
    respond([{ ...connection, token: 'must-not-be-retained', profilePath: '/private' }]);
    expect(await client.list()).toEqual([connection]);
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3000/api/v1/provider-connections', expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ authorization: 'Bearer test-jwt' }) }));
  });

  it('creates only Codex metadata without authentication claims', async () => {
    respond(connection);
    expect(await client.create('  Personal Codex  ')).toEqual(connection);
    const options = fetchMock.mock.calls[0][1];
    expect(JSON.parse(String(options?.body))).toEqual({ provider: 'codex', displayName: 'Personal Codex' });
  });

  it.each(['x', ' '.repeat(3), 'x'.repeat(121)])('rejects invalid names before fetching', async (name) => {
    await expect(client.create(name)).rejects.toThrow('connection name');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('verifies without sending caller authentication claims', async () => {
    respond(verification);
    expect(await client.verify(id)).toEqual(verification);
    expect(fetchMock.mock.calls[0][0]).toBe(`http://127.0.0.1:3000/api/v1/provider-connections/${id}/verify`);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it.each([401, 403, 404, 503])('preserves HTTP %i errors', async (status) => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: 'Request rejected' }, { status }));
    await expect(client.verify(id)).rejects.toMatchObject({ status, message: 'Request rejected' });
  });

  it('revokes only the selected ID', async () => {
    respond({ id, revoked: true });
    expect(await client.revoke(id)).toBe(id);
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('does not accept an unconfirmed revocation', async () => {
    respond({ id, revoked: false });
    await expect(client.revoke(id)).rejects.toThrow('invalid');
  });

  it('rejects path traversal before starting a request', async () => {
    await expect(client.verify('../other')).rejects.toThrow('invalid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects duplicate connection IDs', async () => {
    respond([connection, connection]);
    await expect(client.list()).rejects.toThrow('invalid');
  });

  it('passes cancellation to fetch and propagates network failures', async () => {
    const controller = new AbortController();
    fetchMock.mockRejectedValueOnce(new TypeError('Network unavailable'));
    await expect(client.list(controller.signal)).rejects.toThrow('Network unavailable');
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });
});

describe('provider metadata validation and permissions', () => {
  it('allows management only for the actual owner of a non-revoked connection', () => {
    expect(canManageProviderConnection(connection, userId)).toBe(true);
    expect(canManageProviderConnection(connection, id)).toBe(false);
    expect(canManageProviderConnection({ ...connection, access: 'granted' }, userId)).toBe(false);
    expect(canManageProviderConnection({ ...connection, status: 'revoked' }, userId)).toBe(false);
  });

  it.each([null, [], {}, { ...connection, canUse: 'true' }, { ...connection, provider: 'unknown' }, { ...connection, id: 'bad' }])('rejects malformed metadata', (value) => {
    expect(() => parseProviderConnection(value)).toThrow('invalid');
  });

  it.each([{ ...verification, id: userId }, { ...verification, authenticated: false }, { ...verification, status: 'revoked' }, { ...verification, verificationMethod: 'caller_claim' }])('rejects inconsistent verification responses', (value) => {
    expect(() => parseProviderVerification(value, id)).toThrow('invalid');
  });
});
