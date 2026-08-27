import { hostAdapter } from '../adapters/hostAdapter';

const STORE_COMMANDS = {
  store: 'store_gateway_access_token',
  load: 'load_gateway_access_token',
  clear: 'clear_gateway_access_token',
} as const;

/**
 * Gateway access tokens are persisted only by the native Desktop host. The
 * browser/Vite preview deliberately keeps them in memory only.
 */
export const gatewaySessionStore = {
  isAvailable: () => hostAdapter.isDesktop,

  async store(accessToken: string): Promise<void> {
    if (!hostAdapter.isDesktop) return;
    await hostAdapter.invokeIpc<void>(STORE_COMMANDS.store, { accessToken });
  },

  async load(): Promise<string | null> {
    if (!hostAdapter.isDesktop) return null;
    return hostAdapter.invokeIpc<string | null>(STORE_COMMANDS.load);
  },

  async clear(): Promise<void> {
    if (!hostAdapter.isDesktop) return;
    await hostAdapter.invokeIpc<void>(STORE_COMMANDS.clear);
  },
};
