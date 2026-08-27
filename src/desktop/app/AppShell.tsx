import React, { useEffect, useState } from 'react';
import styles from './AppShell.module.css';
import { HermesCopilotDrawer } from '../components/copilot/HermesCopilotDrawer';
import { OrgChartViewer } from '../components/org/OrgChartViewer';
import { KnowledgeExplorer } from '../components/knowledge/KnowledgeExplorer';
import { N8nWorkflowDesigner } from '../components/n8n/N8nWorkflowDesigner';
import { LlmProviderManager } from '../components/settings/LlmProviderManager';
import { LocalMaterialsPanel } from '../components/materials/LocalMaterialsPanel';
import { GatewayLogin, GatewaySession } from './GatewayLogin';
import { getDesktopBootstrap } from '../gateway/gatewayClient';
import { gatewaySessionStore } from '../gateway/gatewaySessionStore';

type NavigationTab = 'org' | 'knowledge' | 'materials' | 'n8n' | 'settings';

const tabLabels: Record<NavigationTab, string> = {
  org: 'Организация и агенты',
  knowledge: 'Знания и материалы',
  materials: 'Локальные материалы',
  n8n: 'Автоматизации',
  settings: 'Настройки',
};

export const AppShell: React.FC = () => {
  const [session, setSession] = useState<GatewaySession | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('org');
  const [isHermesFocus, setIsHermesFocus] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const accessToken = await gatewaySessionStore.load();
        const gatewayUrl = localStorage.getItem('hermes.gatewayUrl');
        if (!accessToken || !gatewayUrl) return;
        const bootstrap = await getDesktopBootstrap(gatewayUrl, accessToken);
        setSession({ gatewayUrl, accessToken, bootstrap });
      } catch {
        // An expired/revoked token must not remain in the system keychain.
        await gatewaySessionStore.clear();
      } finally {
        setIsRestoringSession(false);
      }
    };

    void restoreSession();
  }, []);

  const authenticate = async (newSession: GatewaySession) => {
    await gatewaySessionStore.store(newSession.accessToken);
    setSession(newSession);
  };

  const logout = () => {
    void gatewaySessionStore.clear();
    setSession(null);
  };

  if (isRestoringSession) return <div className={styles.loadingScreen}>Проверяем сохранённую сессию Hermes…</div>;
  if (!session) return <GatewayLogin onAuthenticated={authenticate} />;

  const selectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsHermesFocus(false);
  };

  const contextPanel = (
    <aside className={styles.contextPanel} aria-label="Gateway context">
      <p className={styles.contextEyebrow}>КОНТЕКСТ GATEWAY</p>
      <h2>{session.bootstrap.user.username}</h2>
      <dl className={styles.contextList}>
        <div><dt>Организаций</dt><dd>{session.bootstrap.organizationCount}</dd></div>
        <div><dt>Workspace</dt><dd>{session.bootstrap.context.workspaceId ? 'Выбран' : 'Не выбран'}</dd></div>
        <div><dt>Проект</dt><dd>{session.bootstrap.context.projectId ? 'Выбран' : 'Не выбран'}</dd></div>
      </dl>
      <p className={styles.contextHint}>Права и область работы определяет Gateway, а не интерфейс клиента.</p>
    </aside>
  );

  if (isHermesFocus) {
    return (
      <div className={styles.appContainer}>
        <nav className={styles.leftNav}>
          <button className={`${styles.navIcon} ${styles.navActive}`} onClick={() => setIsHermesFocus(false)} title="Вернуться к рабочему разделу">🤖</button>
        </nav>
        <main className={styles.focusContent}>
          <HermesCopilotDrawer layout="focus" onToggleFocus={() => setIsHermesFocus(false)} />
        </main>
        {contextPanel}
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <nav className={styles.leftNav}>
        <button
          className={`${styles.navIcon} ${activeTab === 'materials' ? styles.navActive : ''}`}
          onClick={() => selectTab('materials')}
          title="Локальные материалы"
        >
          📁
        </button>
        <button
          className={`${styles.navIcon} ${activeTab === 'org' ? styles.navActive : ''}`}
          onClick={() => selectTab('org')}
          title="Org Chart & Agents"
        >
          🏢
        </button>
        <button
          className={`${styles.navIcon} ${activeTab === 'knowledge' ? styles.navActive : ''}`}
          onClick={() => selectTab('knowledge')}
          title="Knowledge & Skills"
        >
          📚
        </button>
        <button
          className={`${styles.navIcon} ${activeTab === 'n8n' ? styles.navActive : ''}`}
          onClick={() => selectTab('n8n')}
          title="n8n Workflows"
        >
          ⚡
        </button>
        <button
          className={`${styles.navIcon} ${activeTab === 'settings' ? styles.navActive : ''}`}
          onClick={() => selectTab('settings')}
          title="LLM Settings & OAuth"
        >
          ⚙️
        </button>
        <button
          className={styles.navIcon}
          onClick={() => setIsHermesFocus(true)}
          title="Развернуть Hermes"
          style={{ marginTop: 'auto', marginBottom: '16px' }}
        >
          🤖
        </button>
      </nav>

      <main className={styles.mainContent}>
        <header className={styles.sessionHeader}>
          <span>{tabLabels[activeTab]}</span>
          <button onClick={logout}>Выйти</button>
        </header>
        {activeTab === 'org' && <OrgChartViewer />}
        {activeTab === 'knowledge' && <KnowledgeExplorer />}
        {activeTab === 'materials' && <LocalMaterialsPanel gatewayUrl={session.gatewayUrl} accessToken={session.accessToken} />}
        {activeTab === 'n8n' && <N8nWorkflowDesigner />}
        {activeTab === 'settings' && <LlmProviderManager />}
      </main>

      <HermesCopilotDrawer onToggleFocus={() => setIsHermesFocus(true)} />
    </div>
  );
};
