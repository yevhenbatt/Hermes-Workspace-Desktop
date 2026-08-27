import { StorageLocation } from '../types/workspace';

export interface HostAdapter {
  isDesktop: boolean;
  invokeIpc<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

class TauriHostAdapter implements HostAdapter {
  public isDesktop =
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  public async invokeIpc<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (!this.isDesktop) {
      throw new Error('Tauri IPC environment not detected');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(cmd, args);
  }
}

export const hostAdapter: HostAdapter = new TauriHostAdapter();
