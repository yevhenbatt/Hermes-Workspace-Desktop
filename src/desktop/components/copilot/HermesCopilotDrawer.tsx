import { useState } from 'react';
import { useAgentTask } from './useAgentTask';
import styles from './HermesCopilotDrawer.module.css';

export interface HermesCopilotDrawerProps {
  task: ReturnType<typeof useAgentTask>;
  hasWorkspace: boolean;
  layout?: 'docked' | 'focus';
  onToggleFocus?: () => void;
}

export const HermesCopilotDrawer = ({ task, hasWorkspace, layout = 'docked', onToggleFocus }: HermesCopilotDrawerProps) => {
  const [input, setInput] = useState('');
  const handleSend = async () => {
    if (!input.trim() || input.length > 12000) return;
    const submitted = await task.send(input);
    if (submitted) setInput('');
  };
  return (
    <div className={`${styles.drawerContainer} ${layout === 'focus' ? styles.focus : ''}`}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Hermes</span>
        <div className={styles.headerActions}>
          {onToggleFocus && <button className={styles.focusButton} onClick={onToggleFocus}>{layout === 'focus' ? 'Minimize' : 'Expand'}</button>}
        </div>
      </div>
      <div className={styles.integrationNotice}>
        Each message starts a separate task. This is not yet a persistent conversation. Tasks may use agent tools and your selected subscription.
      </div>
      <label className={styles.providerLabel}>
        Provider connection
        <select className={styles.modelSelect} value={task.selectedConnectionId} disabled={task.busy} onChange={(event) => task.setSelectedConnectionId(event.target.value)}>
          <option value="">Select connection</option>
          {task.connections.map((connection) => <option key={connection.id} value={connection.id}>{connection.displayName} ({connection.provider})</option>)}
        </select>
      </label>
      {!hasWorkspace && <p className={styles.integrationNotice}>Select an organization and workspace before sending a task.</p>}
      {task.error && <p className={styles.integrationNotice} role="alert">{task.error}</p>}
      <div className={styles.chatHistory}>
        {task.messages.map((message) => <div key={message.id}>
          <div className={`${styles.messageBubble} ${styles.userMessage}`}>{message.input}</div>
          {message.task && <div className={`${styles.messageBubble} ${styles.assistantMessage}`}>
            <div>Task: {message.task.status} · {message.task.id}</div>
            {message.task.remoteAvailable === false && <div role="status">Executor unavailable. This status may be outdated.</div>}
            {message.task.output && <div className={styles.taskText}>{message.task.output}</div>}
            {message.task.error && <div role="alert" className={styles.taskText}>{message.task.error}</div>}
          </div>}
          {message.error && <p className={styles.integrationNotice} role="alert">{message.error}</p>}
        </div>)}
      </div>
      <div className={styles.inputArea}>
        <textarea className={styles.textarea} placeholder="Send a task..." value={input} maxLength={12000} onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} />
        <button className={styles.sendButton} onClick={() => void handleSend()} disabled={task.busy || !hasWorkspace || !task.selectedConnectionId || !input.trim()}>{task.busy ? 'Running…' : 'Send'}</button>
      </div>
    </div>
  );
};
