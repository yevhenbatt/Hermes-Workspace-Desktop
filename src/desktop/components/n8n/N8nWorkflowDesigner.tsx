import React, { useState } from 'react';
import styles from './N8nWorkflowDesigner.module.css';
import { N8nNode, N8nWorkflow } from '../../types/workspace';

export const N8nWorkflowDesigner: React.FC = () => {
  const [workflow, setWorkflow] = useState<N8nWorkflow>({
    id: 'wf-1',
    workspaceId: 'ws-default',
    name: 'Автоматическая Индексация & RAG Pipeline',
    active: true,
    nodes: [
      {
        id: 'node-1',
        name: 'Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        position: { x: 100, y: 150 },
        parameters: { path: 'obsidian-update' },
      },
      {
        id: 'node-2',
        name: 'Graphify Indexer',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 380, y: 150 },
        parameters: { url: 'http://localhost:8000/index' },
      },
      {
        id: 'node-3',
        name: 'Hermes AI Reviewer',
        type: 'n8n-nodes-base.hermesAgent',
        position: { x: 660, y: 150 },
        parameters: { prompt: 'Проверить качество вынесенных уроков' },
      },
    ],
  });

  const [isAiDesigning, setIsAiDesigning] = useState(false);

  const handleAiAutoDesign = () => {
    setIsAiDesigning(true);
    setTimeout(() => {
      const newAiNode: N8nNode = {
        id: `node-${Date.now()}`,
        name: 'AI Swarm Notification (Discord)',
        type: 'n8n-nodes-base.discord',
        position: { x: 940, y: 150 },
        parameters: { channel: 'alerts' },
      };

      setWorkflow((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newAiNode],
      }));
      setIsAiDesigning(false);
    }, 1200);
  };

  const handleAddNode = () => {
    const newNode: N8nNode = {
      id: `node-${Date.now()}`,
      name: 'Новый Шаг Воркфлоу',
      type: 'n8n-nodes-base.customAction',
      position: { x: 200, y: 300 },
      parameters: {},
    };

    setWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.titleGroup}>
          <span className={styles.title}>{workflow.name}</span>
          <span className={styles.statusBadge}>
            {workflow.active ? 'Активен (Live)' : 'Пауза'}
          </span>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleAiAutoDesign}
            disabled={isAiDesigning}
          >
            {isAiDesigning ? 'Hermes Проектирует Ноды...' : '✨ AI Спроектировать Ноды'}
          </button>
          <button className={styles.button} onClick={handleAddNode}>
            + Добавить Ноду
          </button>
        </div>
      </div>

      <div className={styles.canvasArea}>
        <div className={styles.nodeList}>
          {workflow.nodes.map((node) => (
            <div
              key={node.id}
              className={`${styles.nodeCard} ${
                node.type.includes('hermes') ? styles.nodeCardAi : ''
              }`}
            >
              <div className={styles.nodeHeader}>
                <span className={styles.nodeName}>{node.name}</span>
              </div>
              <div className={styles.nodeType}>{node.type}</div>
              <div className={styles.nodeAction}>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteNode(node.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
