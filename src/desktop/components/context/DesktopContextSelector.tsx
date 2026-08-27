import React, { useEffect, useMemo, useState } from 'react';
import { DesktopBootstrap, DesktopContext, GatewayRequestError, saveDesktopContext } from '../../gateway/gatewayClient';
import styles from './DesktopContextSelector.module.css';

interface DesktopContextSelectorProps { bootstrap: DesktopBootstrap; gatewayUrl: string; accessToken: string; onSaved: (context: DesktopContext) => void; }
const asValue = (value: string | null) => value ?? '';

export const DesktopContextSelector: React.FC<DesktopContextSelectorProps> = ({ bootstrap, gatewayUrl, accessToken, onSaved }) => {
  const [organizationId, setOrganizationId] = useState(asValue(bootstrap.context.organizationId));
  const [workspaceId, setWorkspaceId] = useState(asValue(bootstrap.context.workspaceId));
  const [projectId, setProjectId] = useState(asValue(bootstrap.context.projectId));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { setOrganizationId(asValue(bootstrap.context.organizationId)); setWorkspaceId(asValue(bootstrap.context.workspaceId)); setProjectId(asValue(bootstrap.context.projectId)); }, [bootstrap.context.organizationId, bootstrap.context.workspaceId, bootstrap.context.projectId]);
  const organization = useMemo(() => bootstrap.organizations.find((item) => item.id === organizationId), [bootstrap.organizations, organizationId]);
  const workspace = useMemo(() => organization?.workspaces.find((item) => item.id === workspaceId), [organization, workspaceId]);
  const hasChanges = organizationId !== asValue(bootstrap.context.organizationId) || workspaceId !== asValue(bootstrap.context.workspaceId) || projectId !== asValue(bootstrap.context.projectId);
  const selectOrganization = (value: string) => { setOrganizationId(value); setWorkspaceId(''); setProjectId(''); setError(null); };
  const selectWorkspace = (value: string) => { setWorkspaceId(value); setProjectId(''); setError(null); };
  const save = async () => { if (!organizationId) return; setError(null); setIsSaving(true); try { const context = await saveDesktopContext(gatewayUrl, accessToken, { organizationId, workspaceId: workspaceId || null, projectId: projectId || null }); onSaved(context); } catch (reason) { setError(reason instanceof GatewayRequestError ? reason.message : 'Не удалось сохранить контекст.'); } finally { setIsSaving(false); } };
  if (bootstrap.organizations.length === 0) return <p className={styles.empty}>Gateway не предоставил доступных организаций.</p>;
  return <section className={styles.selector} aria-label="Контекст Workspace"><div className={styles.fields}>
    <label>Организация<select value={organizationId} onChange={(event) => selectOrganization(event.target.value)} disabled={isSaving}>{bootstrap.organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Workspace<select value={workspaceId} onChange={(event) => selectWorkspace(event.target.value)} disabled={!organization || isSaving}><option value="">Не выбран</option>{organization?.workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Проект<select value={projectId} onChange={(event) => { setProjectId(event.target.value); setError(null); }} disabled={!workspace || isSaving}><option value="">Не выбран</option>{workspace?.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  </div><div className={styles.actions}><button type="button" onClick={() => void save()} disabled={!organizationId || !hasChanges || isSaving}>{isSaving ? 'Сохранение…' : 'Применить'}</button>{error && <p role="alert">{error}</p>}</div></section>;
};
