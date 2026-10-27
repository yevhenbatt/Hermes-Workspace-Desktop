import type { ProviderConnection, ProviderConnectionVerification } from '../../gateway/providerConnectionClient';

export interface ProviderConnectionState {
  connections: ProviderConnection[];
  isLoading: boolean;
  pendingAction: string | null;
  error: string | null;
  notice: string | null;
}

export type ProviderConnectionEvent =
  | { type: 'reset' }
  | { type: 'start'; action: string }
  | { type: 'loaded'; connections: ProviderConnection[] }
  | { type: 'created'; connection: ProviderConnection }
  | { type: 'verified'; result: ProviderConnectionVerification }
  | { type: 'revoked'; id: string }
  | { type: 'failed'; message: string }
  | { type: 'finish' };

export const initialProviderConnectionState: ProviderConnectionState = {
  connections: [], isLoading: true, pendingAction: null, error: null, notice: null,
};

export const providerConnectionReducer = (state: ProviderConnectionState, event: ProviderConnectionEvent): ProviderConnectionState => {
  switch (event.type) {
    case 'reset': return { ...initialProviderConnectionState, connections: [] };
    case 'start': return { ...state, pendingAction: event.action, error: null, notice: null };
    case 'loaded': return { ...state, connections: event.connections, isLoading: false };
    case 'created': return { ...state, connections: [event.connection, ...state.connections.filter(({ id }) => id !== event.connection.id)], notice: 'Connection created. Complete OAuth sign-in on the server, then check the login here.' };
    case 'verified': return {
      ...state,
      connections: state.connections.map((connection) => connection.id === event.result.id ? {
        ...connection, status: event.result.status, canUse: event.result.authenticated && connection.access === 'owner',
      } : connection),
      notice: event.result.authenticated ? 'OAuth login verified. Model access is checked when a task runs.' : 'No ChatGPT OAuth login was found. The connection remains pending.',
    };
    case 'revoked': return { ...state, connections: state.connections.map((connection) => connection.id === event.id ? { ...connection, status: 'revoked', canUse: false } : connection), notice: 'Connection revoked. The OAuth login remains on the server.' };
    case 'failed': return { ...state, isLoading: false, error: event.message };
    case 'finish': return { ...state, pendingAction: null };
  }
};
