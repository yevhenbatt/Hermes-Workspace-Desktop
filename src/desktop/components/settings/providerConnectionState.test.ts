import { describe, expect, it } from 'vitest';
import type { ProviderConnection } from '../../gateway/providerConnectionClient';
import { initialProviderConnectionState, providerConnectionReducer } from './providerConnectionState';

const connection: ProviderConnection = { id: 'first', ownerUserId: 'owner', displayName: 'Personal Codex', provider: 'codex', status: 'pending', access: 'owner', canUse: false };
const loaded = providerConnectionReducer(initialProviderConnectionState, { type: 'loaded', connections: [connection, { ...connection, id: 'second' }] });

describe('provider connection state', () => {
  it('starts with an empty loading state', () => {
    expect(initialProviderConnectionState).toMatchObject({ connections: [], isLoading: true, error: null });
  });
  it('keeps pending connections pending after creation', () => {
    const state = providerConnectionReducer(loaded, { type: 'created', connection });
    expect(state.connections).toHaveLength(2);
    expect(state.connections[0].status).toBe('pending');
    expect(state.notice).toContain('Complete OAuth');
  });
  it('does not optimistically activate on request start or failure', () => {
    const started = providerConnectionReducer(loaded, { type: 'start', action: 'verify:first' });
    const failed = providerConnectionReducer(started, { type: 'failed', message: 'Unavailable' });
    expect(failed.connections).toEqual(loaded.connections);
    expect(failed.error).toBe('Unavailable');
    expect(providerConnectionReducer(failed, { type: 'finish' }).pendingAction).toBeNull();
  });
  it('applies verified status only to the selected connection', () => {
    const state = providerConnectionReducer(loaded, { type: 'verified', result: { id: 'first', status: 'active', authenticated: true, verificationMethod: 'codex_login_status', changed: true } });
    expect(state.connections[0]).toMatchObject({ status: 'active', canUse: true });
    expect(state.connections[1]).toEqual(loaded.connections[1]);
    const pending = providerConnectionReducer(state, { type: 'verified', result: { id: 'first', status: 'pending', authenticated: false, verificationMethod: 'codex_login_status', changed: true } });
    expect(pending.connections[0]).toMatchObject({ status: 'pending', canUse: false });
  });
  it('revokes only the selected connection', () => {
    const state = providerConnectionReducer(loaded, { type: 'revoked', id: 'first' });
    expect(state.connections[0]).toMatchObject({ status: 'revoked', canUse: false });
    expect(state.connections[1]).toEqual(loaded.connections[1]);
  });
  it('clears metadata when the session changes', () => {
    expect(providerConnectionReducer(loaded, { type: 'reset' })).toEqual(initialProviderConnectionState);
  });
});
