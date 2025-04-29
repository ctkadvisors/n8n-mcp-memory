/**
 * Types for n8n API
 */

// Workflow types
export interface WorkflowSettings {
  saveExecutionProgress?: boolean;
  saveManualExecutions?: boolean;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  executionTimeout?: number;
  errorWorkflow?: string;
  timezone?: string;
  executionOrder?: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters?: Record<string, any>;
  typeVersion?: number;
  credentials?: Record<string, any>;
  disabled?: boolean;
  [key: string]: any;
}

export interface WorkflowConnections {
  [key: string]: Array<{
    node: string;
    type: string;
    index: number;
  }>;
}

export interface Workflow {
  id?: string;
  name: string;
  active?: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  settings: WorkflowSettings;
  staticData?: Record<string, any> | string | null;
  tags?: Tag[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowListResponse {
  data: Workflow[];
  nextCursor?: string;
}

// Tag types
export interface Tag {
  id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TagResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagListResponse {
  data: Tag[];
  nextCursor?: string;
}

// Legacy Project type (used in Workflow)
export interface LegacyProject {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// Error types
export interface ApiError {
  status: number;
  message: string;
  error?: any;
}

// Request parameter types
export interface WorkflowListParams {
  active?: boolean;
  tags?: string;
  name?: string;
  projectId?: string;
  excludePinnedData?: boolean;
  limit?: number;
  cursor?: string;
}

export interface WorkflowTagsUpdateParams {
  tagIds: { id: string }[];
}

export interface WorkflowTransferParams {
  destinationProjectId: string;
}

// Execution types
export interface Execution {
  id: number;
  data?: Record<string, any>;
  finished: boolean;
  mode: 'cli' | 'error' | 'integrated' | 'internal' | 'manual' | 'retry' | 'trigger' | 'webhook';
  retryOf?: number | null;
  retrySuccessId?: number | null;
  startedAt: string;
  stoppedAt?: string;
  workflowId: number;
  waitTill?: string | null;
  customData?: Record<string, any>;
}

export interface ExecutionListResponse {
  data: Execution[];
  nextCursor?: string;
}

export interface ExecutionListParams {
  status?: 'error' | 'success' | 'waiting';
  workflowId?: string;
  projectId?: string;
  includeData?: boolean;
  limit?: number;
  cursor?: string;
}

export interface WorkflowExecuteParams {
  workflowData?: Workflow;
  runData?: Record<string, any>;
  startNodes?: string[];
  destinationNode?: string;
  pinData?: Record<string, any>;
}

// Credential types
export interface Credential {
  id?: string;
  name: string;
  type: string;
  data?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CredentialResponse {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialSchema {
  [key: string]: any;
}

export interface CredentialTransferParams {
  destinationProjectId: string;
}

// User types
export interface User {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPending?: boolean;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
}

export interface UserListResponse {
  data: User[];
  nextCursor?: string;
}

export interface UserListParams {
  limit?: number;
  cursor?: string;
  includeRole?: boolean;
  projectId?: string;
}

export interface CreateUserParams {
  email: string;
  role: 'global:admin' | 'global:member';
}

export interface CreateUserResponse {
  user: {
    id: string;
    email: string;
    inviteAcceptUrl: string;
    emailSent: boolean;
  };
  error?: string;
}

export interface ChangeRoleParams {
  newRoleName: 'global:admin' | 'global:member';
}

// Project types
export interface Project {
  id?: string;
  name: string;
  type?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  type: string;
}

export interface ProjectListResponse {
  data: Project[];
  nextCursor?: string;
}

export interface ProjectListParams {
  limit?: number;
  cursor?: string;
}

// Variable types
export interface Variable {
  id?: string;
  key: string;
  value: string;
  type?: string;
}

export interface VariableListResponse {
  data: Variable[];
  nextCursor?: string;
}

export interface VariableListParams {
  limit?: number;
  cursor?: string;
}

// Source Control types
export interface PullOptions {
  force?: boolean;
  variables?: Record<string, string>;
}

export interface ImportResult {
  variables?: {
    added?: string[];
    changed?: string[];
  };
  credentials?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  workflows?: Array<{
    id: string;
    name: string;
  }>;
  tags?: {
    tags?: Array<{
      id: string;
      name: string;
    }>;
    mappings?: Array<{
      workflowId: string;
      tagId: string;
    }>;
  };
}

// Audit types
export interface AuditOptions {
  additionalOptions?: {
    daysAbandonedWorkflow?: number;
    categories?: Array<'credentials' | 'database' | 'nodes' | 'filesystem' | 'instance'>;
  };
}

export interface AuditReport {
  [key: string]: any;
}
