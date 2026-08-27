import React, { useState } from 'react';
import styles from './HermesCopilotDrawer.module.css';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  reasoningTrace?: string;
  timestamp: string;
}

export interface HermesCopilotDrawerProps {
  onSendMessage?: (message: string, model: string) => Promise<void>;
  layout?: 'docked' | 'focus';
  onToggleFocus?: () => void;
}

export const HermesCopilotDrawer: React.FC<HermesCopilotDrawerProps> = ({
  onSendMessage,
  layout = 'docked',
  onToggleFocus,
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('hermes-3-llama-3.1-70b');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      content: 'Привет! Я Hermes C-Level Agent. Чем я могу помочь проекту?',
      reasoningTrace: 'Инициализация контекста Hermes Workspace...',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    if (onSendMessage) await onSendMessage(currentInput, selectedModel);
  };

  return (
    <div className={`${styles.drawerContainer} ${layout === 'focus' ? styles.focus : ''}`}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Hermes Co-Pilot</span>
        <div className={styles.headerActions}>
          <select className={styles.modelSelect} value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            <option value="gateway-agent">Gateway Agent (soon)</option>
          </select>
          {onToggleFocus && <button className={styles.focusButton} onClick={onToggleFocus}>
            {layout === 'focus' ? 'Свернуть' : 'Развернуть'}
          </button>}
        </div>
      </div>

      {!onSendMessage && <p className={styles.integrationNotice}>
        Agent Task API ещё не подключён. Это реальный Gateway-контекст, но отправка команд пока отключена.
      </p>}

      <div className={styles.chatHistory}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageBubble} ${
              msg.sender === 'user' ? styles.userMessage : styles.assistantMessage
            }`}
          >
            {msg.reasoningTrace && (
              <div className={styles.reasoningBlock}>{msg.reasoningTrace}</div>
            )}
            <div>{msg.content}</div>
          </div>
        ))}
      </div>

      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          placeholder="Спросить Hermes Agent или отдать команду..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className={styles.sendButton} onClick={handleSend} disabled={!onSendMessage}>
          Отправить
        </button>
      </div>
    </div>
  );
};
