import { useEffect, useRef, useState, type FormEvent } from 'react';
import { canManageProviderConnection, type ProviderConnection } from '../../gateway/providerConnectionClient';
import { useProviderConnections } from './useProviderConnections';
import styles from './LlmProviderManager.module.css';

interface LlmProviderManagerProps {
  gatewayUrl: string;
  accessToken: string;
  userId: string;
}

export const LlmProviderManager = ({ gatewayUrl, accessToken, userId }: LlmProviderManagerProps) => {
  const state = useProviderConnections(gatewayUrl, accessToken, userId);
  const [displayName, setDisplayName] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<ProviderConnection | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isBusy = state.pendingAction !== null;

  useEffect(() => {
    if (revokeTarget) dialogRef.current?.showModal();
  }, [revokeTarget]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await state.create(displayName)) setDisplayName('');
  };

  const handleRevoke = async () => {
    if (revokeTarget && await state.revoke(revokeTarget)) setRevokeTarget(null);
  };

  return (
    <section className={styles.container} aria-busy={isBusy}>
      <h1 className={styles.title}>Provider connections</h1>
      <p className={styles.subtitle}>Manage subscriptions through Workspace Gateway. Provider credentials stay on the server.</p>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Add a Codex connection</h2>
        <p className={styles.subtitle}>OAuth sign-in from this app is not available yet. Complete ChatGPT sign-in on the server, then check the login here. Creating a connection does not sign you in.</p>
        <form className={styles.inputGroup} onSubmit={handleCreate}>
          <label className={styles.inputLabel} htmlFor="provider-connection-name">Connection name</label>
          <input id="provider-connection-name" className={styles.input} value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={3} maxLength={120} required disabled={isBusy} placeholder="Personal Codex" />
          <button className={styles.button} type="submit" disabled={isBusy || displayName.trim().length < 3}>{state.pendingAction === 'create' ? 'Creating…' : 'Create connection'}</button>
        </form>
      </div>
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
      {state.notice && <p className={styles.notice} role="status">{state.notice}</p>}
      <div className={styles.cardHeader}>
        <h2 className={styles.sectionTitle}>Available connections</h2>
        <button className={styles.button} disabled={isBusy} onClick={() => void state.refresh()}>Refresh</button>
      </div>
      {state.isLoading && <p role="status">Loading connections…</p>}
      {!state.isLoading && !state.error && state.connections.length === 0 && <p>No provider connections yet.</p>}
      <div className={styles.providerGrid}>
        {state.connections.map((connection) => {
          const canManage = canManageProviderConnection(connection, userId);
          return (
            <article className={styles.card} key={connection.id}>
              <div className={styles.cardHeader}>
                <h3 className={styles.providerName}>{connection.displayName}</h3>
                <span className={`${styles.statusBadge} ${connection.status === 'active' ? styles.statusConnected : styles.statusDisconnected}`}>{connection.status}</span>
              </div>
              <p>{connection.provider} · {connection.access === 'owner' ? 'Owned by you' : 'Shared with you'}</p>
              <code className={styles.identifier}>{connection.id}</code>
              <p className={styles.subtitle}>{connection.canUse ? 'Available for authorized tasks.' : 'Not available for tasks.'}</p>
              {canManage && <div className={styles.actions}>
                {connection.provider === 'codex' && <button className={styles.button} disabled={isBusy} onClick={() => void state.verify(connection)}>{state.pendingAction === `verify:${connection.id}` ? 'Checking…' : 'Check OAuth login'}</button>}
                <button className={`${styles.button} ${styles.danger}`} disabled={isBusy} onClick={() => setRevokeTarget(connection)}>Revoke</button>
              </div>}
              {connection.access === 'granted' && <p className={styles.subtitle}>Only the owner can verify or revoke this connection.</p>}
            </article>
          );
        })}
      </div>
      {revokeTarget && <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="revoke-title" onCancel={(event) => { if (isBusy) event.preventDefault(); else setRevokeTarget(null); }}>
        <h2 id="revoke-title">Revoke {revokeTarget.displayName}?</h2>
        <p>This stops future use through Gateway and revokes shared grants. It does not delete the OAuth login on the server or stop existing tasks.</p>
        {state.error && <p className={styles.error} role="alert">{state.error}</p>}
        <div className={styles.actions}>
          <button className={styles.button} autoFocus disabled={isBusy} onClick={() => setRevokeTarget(null)}>Cancel</button>
          <button className={`${styles.button} ${styles.danger}`} disabled={isBusy} onClick={() => void handleRevoke()}>{isBusy ? 'Revoking…' : 'Confirm revoke'}</button>
        </div>
      </dialog>}
    </section>
  );
};
