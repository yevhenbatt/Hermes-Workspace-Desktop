import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import styles from './LocalMaterialsPanel.module.css';
import { hostAdapter } from '../../adapters/hostAdapter';
import {
  createLocalMaterialSource,
  listLocalMaterialSources,
  LocalMaterialMode,
  LocalMaterialSource,
  LocalMaterialSourceType,
  revokeLocalMaterialSource,
} from '../../gateway/gatewayClient';

interface LocalMaterialsPanelProps {
  gatewayUrl: string;
  accessToken: string;
}

const sourceTypes: Array<{ value: LocalMaterialSourceType; label: string }> = [
  { value: 'obsidian_vault', label: 'Obsidian Vault' },
  { value: 'directory', label: 'Папка' },
  { value: 'file', label: 'Один файл' },
];

const modes: Array<{ value: LocalMaterialMode; label: string; hint: string }> = [
  { value: 'local_only', label: 'Только на этом ПК', hint: 'Gateway получит только название и режим. Файлы не отправляются.' },
  { value: 'selective_attachment', label: 'Выборочные вложения', hint: 'Позже можно будет явно приложить один материал к конкретной задаче.' },
];

function sourceLabel(source: LocalMaterialSource): string {
  return source.sourceType === 'obsidian_vault'
    ? 'Obsidian Vault'
    : source.sourceType === 'directory'
      ? 'Папка'
      : 'Файл';
}

export const LocalMaterialsPanel: React.FC<LocalMaterialsPanelProps> = ({ gatewayUrl, accessToken }) => {
  const [sources, setSources] = useState<LocalMaterialSource[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [sourceType, setSourceType] = useState<LocalMaterialSourceType>('obsidian_vault');
  const [mode, setMode] = useState<LocalMaterialMode>('local_only');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSources(await listLocalMaterialSources(gatewayUrl, accessToken));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось получить список источников.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, gatewayUrl]);

  useEffect(() => { void loadSources(); }, [loadSources]);

  const registerSource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!hostAdapter.isDesktop) {
      setError('Подключение локальных материалов доступно только в установленном Hermes Desktop.');
      return;
    }
    if (!displayName.trim()) {
      setError('Введите понятное имя источника.');
      return;
    }

    setIsSubmitting(true);
    let created: LocalMaterialSource | null = null;
    try {
      const localPath = await hostAdapter.invokeIpc<string | null>('pick_local_material_source', { sourceType });
      if (!localPath) {
        setMessage('Выбор отменён. Ничего не было зарегистрировано.');
        return;
      }

      created = await createLocalMaterialSource(gatewayUrl, accessToken, {
        displayName: displayName.trim(), sourceType, mode,
      });
      await hostAdapter.invokeIpc<void>('store_local_material_path', {
        sourceId: created.id,
        localPath,
      });

      setSources((current) => [created as LocalMaterialSource, ...current]);
      setDisplayName('');
      setMessage('Источник зарегистрирован. Его путь сохранён только в системном хранилище этого ПК.');
    } catch (registerError) {
      if (created) {
        try {
          await revokeLocalMaterialSource(gatewayUrl, accessToken, created.id);
        } catch {
          // The user receives the original error; they can revoke the metadata later if needed.
        }
      }
      setError(registerError instanceof Error ? registerError.message : 'Не удалось зарегистрировать источник.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const revokeSource = async (source: LocalMaterialSource) => {
    setError(null);
    setMessage(null);
    setIsRevoking(source.id);
    try {
      await revokeLocalMaterialSource(gatewayUrl, accessToken, source.id);
      setSources((current) => current.filter(({ id }) => id !== source.id));
      try {
        await hostAdapter.invokeIpc<void>('clear_local_material_path', { sourceId: source.id });
        setMessage('Регистрация отозвана. Локальные файлы и папки не изменялись.');
      } catch {
        setMessage('Регистрация отозвана. Локальный путь уже недоступен через Gateway, но его запись в системном хранилище не удалось очистить.');
      }
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Не удалось отозвать регистрацию.');
    } finally {
      setIsRevoking(null);
    }
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>LOCAL MATERIALS CONNECTOR</p>
          <h1>Материалы на этом компьютере</h1>
          <p className={styles.description}>Hermes не сканирует диск и не загружает материалы в фоне. Вы сами выбираете источник и последующее действие.</p>
        </div>
      </header>

      <form className={styles.form} onSubmit={registerSource}>
        <label>
          Название источника
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Например, личный Obsidian Vault" maxLength={160} />
        </label>
        <label>
          Что подключить
          <select value={sourceType} onChange={(event) => setSourceType(event.target.value as LocalMaterialSourceType)}>
            {sourceTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          Режим
          <select value={mode} onChange={(event) => setMode(event.target.value as LocalMaterialMode)}>
            {modes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <p className={styles.modeHint}>{modes.find((option) => option.value === mode)?.hint}</p>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохраняем…' : 'Выбрать и зарегистрировать'}</button>
      </form>

      {message && <p className={styles.notice}>{message}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.listHeader}><h2>Зарегистрированные источники</h2><button className={styles.secondaryButton} onClick={() => void loadSources()} disabled={isLoading}>Обновить</button></div>
      {isLoading ? <p className={styles.empty}>Загружаем…</p> : sources.length === 0 ? <p className={styles.empty}>Пока нет зарегистрированных локальных источников.</p> : (
        <div className={styles.sourceList}>
          {sources.map((source) => (
            <article key={source.id} className={styles.sourceCard}>
              <div><h3>{source.displayName}</h3><p>{sourceLabel(source)} · {source.mode === 'local_only' ? 'только на этом ПК' : 'выборочные вложения'}</p><small>Путь не хранится в Gateway и не показан интерфейсу.</small></div>
              <button className={styles.dangerButton} onClick={() => void revokeSource(source)} disabled={isRevoking === source.id}>{isRevoking === source.id ? 'Отзываем…' : 'Отозвать'}</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
