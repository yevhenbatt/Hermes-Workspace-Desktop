import React, { FormEvent, useState } from 'react';
import { DesktopBootstrap, GatewayRequestError, getDesktopBootstrap, loginToGateway } from '../gateway/gatewayClient';
import styles from './GatewayLogin.module.css';

export interface GatewaySession { gatewayUrl: string; accessToken: string; bootstrap: DesktopBootstrap; }
interface GatewayLoginProps { onAuthenticated: (session: GatewaySession) => void | Promise<void>; }
const defaultGatewayUrl = localStorage.getItem('hermes.gatewayUrl') ?? 'http://127.0.0.1:3000/api/v1';

export const GatewayLogin: React.FC<GatewayLoginProps> = ({ onAuthenticated }) => {
  const [gatewayUrl, setGatewayUrl] = useState(defaultGatewayUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null); setIsSubmitting(true);
    try {
      const login = await loginToGateway(gatewayUrl, username, password);
      const bootstrap = await getDesktopBootstrap(gatewayUrl, login.accessToken);
      localStorage.setItem('hermes.gatewayUrl', gatewayUrl.trim());
      await onAuthenticated({ gatewayUrl: gatewayUrl.trim(), accessToken: login.accessToken, bootstrap });
    } catch (reason) {
      setError(reason instanceof GatewayRequestError && reason.status === 401 ? 'Неверное имя пользователя или пароль.' : reason instanceof Error ? reason.message : 'Не удалось подключиться к Gateway.');
    } finally { setPassword(''); setIsSubmitting(false); }
  };

  return <main className={styles.page}><form className={styles.card} onSubmit={submit}>
    <p className={styles.eyebrow}>HERMES WORKSPACE</p><h1>Войти в рабочее пространство</h1>
    <p className={styles.description}>Клиент подключается только к Workspace Gateway. Доступ к организациям и проектам определяется сервером после входа.</p>
    <label>Адрес Gateway<input value={gatewayUrl} onChange={(event) => setGatewayUrl(event.target.value)} required /></label>
    <label>Имя пользователя<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
    <label>Пароль<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Подключение…' : 'Войти'}</button>
    <p className={styles.notice}>На установленном Desktop токен хранится в Windows Credential Manager до истечения, отзыва или выхода. В браузерном предпросмотре он остаётся только в памяти.</p>
  </form></main>;
};
