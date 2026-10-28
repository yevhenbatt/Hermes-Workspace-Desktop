import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgentTaskClient, parseAgentTask } from './agentTaskClient';

const id = '6a5fb5be-ebaf-4aa9-af04-645b335510e6';
const workspaceId = 'ae372a21-22ce-4e78-ade0-7016fd7f5bc4';
const task = { id, status: 'queued', output: null, error: null };
const input = { organizationId: id, workspaceId, providerConnectionId: id, input: 'Hello' };
const fetchMock = vi.fn<typeof fetch>();
const client = createAgentTaskClient('http://127.0.0.1:3000/api/v1', 'test-token');
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('Agent Task Gateway client', () => {
  it('submits the selected context and provider only to Gateway', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ success: true, data: task }));
    expect(await client.create(input)).toEqual(task);
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:3000/api/v1/agent/tasks');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(input);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ authorization: 'Bearer test-token' });
  });
  it('rejects invalid context without sending', async () => {
    await expect(client.create({ ...input, workspaceId: '../bad' })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('propagates server errors without retrying task creation', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: 'Forbidden' }, { status: 403 }));
    await expect(client.create(input)).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('retrieves only the requested task', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ data: task }));
    expect(await client.get(id)).toEqual(task);
    expect(fetchMock.mock.calls[0][0]).toBe(`http://127.0.0.1:3000/api/v1/agent/tasks/${id}`);
  });
  it('rejects mismatched IDs and malformed results', () => {
    expect(() => parseAgentTask(task, workspaceId)).toThrow();
    expect(() => parseAgentTask({ ...task, status: 'unknown' })).toThrow();
    expect(() => parseAgentTask({ ...task, output: {} })).toThrow();
    expect(() => parseAgentTask({ ...task, remoteAvailable: 'false' })).toThrow();
    expect(parseAgentTask({ ...task, remoteAvailable: false }).remoteAvailable).toBe(false);
  });
});
