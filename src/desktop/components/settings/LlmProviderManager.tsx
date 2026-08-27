import React, { useState } from 'react';
import styles from './LlmProviderManager.module.css';
import { LlmProviderConfig } from '../../types/workspace';
import { hostAdapter } from '../../adapters/hostAdapter';

export const LlmProviderManager: React.FC = () => {
  const [providers, setProviders] = useState<LlmProviderConfig[]>([
    {
      id: 'chatgpt',
      name: 'ChatGPT / OpenAI',
      type: 'chatgpt',
      authType: 'oauth',
      isAuthenticated: true,
      selectedModel: 'gpt-4o',
    },
    {
      id: 'claude',
      name: 'Claude / Anthropic',
      type: 'claude',
      authType: 'oauth',
      isAuthenticated: false,
      selectedModel: 'claude-3-5-sonnet',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      type: 'gemini',
      authType: 'oauth',
      isAuthenticated: false,
      selectedModel: 'gemini-1.5-pro',
    },
    {
      id: 'openrouter',
      name: 'OpenRouter.ai',
      type: 'openrouter',
      authType: 'api_key',
      isAuthenticated: false,
      baseUrl: 'https://openrouter.ai/api/v1',
      selectedModel: 'auto',
    },
    {
      id: 'freellmapi',
      name: 'FreeLLMAPI',
      type: 'freellmapi',
      authType: 'api_key',
      isAuthenticated: false,
      selectedModel: 'default',
    },
    {
      id: 'omniroute',
      name: 'OmniRoute Gateway',
      type: 'omniroute',
      authType: 'api_key',
      isAuthenticated: false,
      selectedModel: 'default',
    },
    {
      id: 'ollama',
      name: 'Ollama Local Host',
      type: 'ollama',
      authType: 'api_key',
      isAuthenticated: true,
      baseUrl: 'http://localhost:11434',
      selectedModel: 'llama3:latest',
    },
  ]);

  const [apiKeyInput, setApiKeyInput] = useState<Record<string, string>>({});

  const handleOAuthLogin = async (providerId: string) => {
    try {
      await hostAdapter.invokeIpc('initiate_oauth', { providerId });
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, isAuthenticated: true } : p))
      );
    } catch (err) {
      console.error(`[LlmProviderManager] OAuth Error:`, err);
    }
  };

  const handleSaveApiKey = async (providerId: string) => {
    const key = apiKeyInput[providerId];
    if (!key) return;

    try {
      // The old mock wrote secrets through an unrestricted IPC command. Provider
      // credentials remain disabled until the dedicated OS-keychain slice exists.
      throw new Error('Сохранение ключей будет доступно после подключения системного keychain.');
    } catch (err) {
      console.error(`[LlmProviderManager] Key Save Error:`, err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>LLM Provider & OAuth Settings</h1>
      <p className={styles.subtitle}>
        Единый интерфейс управления моделями для Hermes Agent и SwarmClaw
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>OAuth 2.0 Авторизация</h2>
        <div className={styles.providerGrid}>
          {providers
            .filter((p) => p.authType === 'oauth')
            .map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.providerName}>{p.name}</span>
                  <span
                    className={`${styles.statusBadge} ${
                      p.isAuthenticated ? styles.statusConnected : styles.statusDisconnected
                    }`}
                  >
                    {p.isAuthenticated ? 'Авторизован' : 'Не подключен'}
                  </span>
                </div>
                <button
                  className={styles.button}
                  onClick={() => handleOAuthLogin(p.id)}
                >
                  {p.isAuthenticated ? 'Переподключить OAuth' : 'Войти через OAuth 2.0'}
                </button>
              </div>
            ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>API Key & Custom Endpoints</h2>
        <div className={styles.providerGrid}>
          {providers
            .filter((p) => p.authType === 'api_key')
            .map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.providerName}>{p.name}</span>
                  <span
                    className={`${styles.statusBadge} ${
                      p.isAuthenticated ? styles.statusConnected : styles.statusDisconnected
                    }`}
                  >
                    {p.isAuthenticated ? 'Активен' : 'Требует API Key'}
                  </span>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>API Key / Token</label>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="sk-..."
                    value={apiKeyInput[p.id] || ''}
                    onChange={(e) =>
                      setApiKeyInput({ ...apiKeyInput, [p.id]: e.target.value })
                    }
                  />
                </div>
                <button
                  className={styles.button}
                  onClick={() => handleSaveApiKey(p.id)}
                >
                  Сохранить ключ
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
