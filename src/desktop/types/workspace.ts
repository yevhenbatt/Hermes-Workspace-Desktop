export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';

export type StorageLocation = 'vps' | 'local_pc';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface AgentRole {
  id: string;
  name: string;
  title: string;
  supervisorId?: string;
  runtime: 'claude_code' | 'codex' | 'cursor' | 'openclaw' | 'hermes' | 'custom_webhook';
  monthlyBudgetUsd: number;
  currentSpendUsd: number;
  status: 'active' | 'paused' | 'stopped';
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedAgentId?: string;
  status: 'todo' | 'in_progress' | 'approval_required' | 'completed' | 'failed';
  requiresHumanApproval: boolean;
  diffSummary?: string;
}

export interface KnowledgeNote {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  storage: StorageLocation;
  localPath?: string;
  tags: string[];
  updatedAt: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  code: string;
  storage: StorageLocation;
  evalScore?: number;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, unknown>;
}

export interface N8nWorkflow {
  id: string;
  workspaceId: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
}

export type LlmProviderType = 'chatgpt' | 'claude' | 'gemini' | 'openrouter' | 'freellmapi' | 'omniroute' | 'ollama' | 'custom_api';

export interface LlmProviderConfig {
  id: string;
  name: string;
  type: LlmProviderType;
  authType: 'oauth' | 'api_key';
  isAuthenticated: boolean;
  baseUrl?: string;
  selectedModel: string;
}
