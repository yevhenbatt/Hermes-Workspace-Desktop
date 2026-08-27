import React, { useState } from 'react';
import styles from './OrgChartViewer.module.css';
import { AgentRole } from '../../types/workspace';

export const OrgChartViewer: React.FC = () => {
  const [roles, setRoles] = useState<AgentRole[]>([
    {
      id: 'role-1',
      name: 'Hermes C-Level Agent',
      title: 'Chief AI Architect & Planner',
      runtime: 'hermes',
      monthlyBudgetUsd: 500,
      currentSpendUsd: 120,
      status: 'active',
    },
    {
      id: 'role-2',
      name: 'Dev Agent (Claude Code)',
      title: 'Lead Software Engineer',
      supervisorId: 'role-1',
      runtime: 'claude_code',
      monthlyBudgetUsd: 300,
      currentSpendUsd: 85,
      status: 'active',
    },
    {
      id: 'role-3',
      name: 'QA & Auditor Agent',
      title: 'Code Reviewer & Evals Tester',
      supervisorId: 'role-1',
      runtime: 'codex',
      monthlyBudgetUsd: 200,
      currentSpendUsd: 40,
      status: 'active',
    },
  ]);

  const toggleStatus = (id: string) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === 'active' ? 'paused' : 'active' }
          : r
      )
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Org Chart for Agents & Humans</h1>
          <p className={styles.subtitle}>
            Иерархия компании, роли, бюджетные лимиты (Cost Control) и Bring Your Own Agent
          </p>
        </div>
        <button className={`${styles.button} ${styles.buttonPrimary}`}>
          + Нанять Агента (BYOA)
        </button>
      </div>

      <div className={styles.grid}>
        {roles.map((role) => {
          const spendPercent = Math.min(
            100,
            (role.currentSpendUsd / role.monthlyBudgetUsd) * 100
          );

          return (
            <div key={role.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.roleTitle}>{role.title}</div>
                  <div className={styles.agentName}>{role.name}</div>
                </div>
                <span
                  className={
                    role.status === 'active'
                      ? styles.statusActive
                      : styles.statusPaused
                  }
                >
                  {role.status.toUpperCase()}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span>Рантайм:</span>
                <strong>{role.runtime}</strong>
              </div>

              <div>
                <div className={styles.infoRow}>
                  <span>Месячный бюджет:</span>
                  <strong>
                    ${role.currentSpendUsd} / ${role.monthlyBudgetUsd}
                  </strong>
                </div>
                <div className={styles.budgetMeter}>
                  <div
                    className={styles.budgetFill}
                    style={{ width: `${spendPercent}%` }}
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.button}
                  onClick={() => toggleStatus(role.id)}
                >
                  {role.status === 'active' ? 'Пауза' : 'Возобновить'}
                </button>
                <button className={styles.button}>Настройки прав</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
