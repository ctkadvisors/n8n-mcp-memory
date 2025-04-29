import { N8nClient } from "../api/n8nClient.js";
import {
  Workflow,
  WorkflowListParams,
  WorkflowListResponse,
  Tag,
  TagResponse,
  TagListResponse,
  WorkflowTagsUpdateParams,
  WorkflowTransferParams,
  Execution,
  ExecutionListParams,
  ExecutionListResponse,
  WorkflowExecuteParams,
  Credential,
  CredentialResponse,
  CredentialSchema,
  CredentialTransferParams,
  User,
  UserListResponse,
  UserListParams,
  CreateUserParams,
  CreateUserResponse,
  ChangeRoleParams,
  Project,
  ProjectResponse,
  ProjectListResponse,
  ProjectListParams,
  Variable,
  VariableListResponse,
  VariableListParams,
  PullOptions,
  ImportResult,
  AuditOptions,
  AuditReport,
} from "../types/n8n.js";
import env from "../utils/env.js";

/**
 * Service for interacting with the n8n API
 */
export class N8nServiceV2 {
  private client: N8nClient;

  /**
   * Create a new n8n service
   * @param apiUrl The n8n API URL
   * @param apiKey The n8n API key
   */
  constructor(apiUrl: string, apiKey: string) {
    this.client = new N8nClient(apiUrl, apiKey);
  }

  // ==================== WORKFLOW METHODS ====================

  /**
   * Get all workflows
   * @param params Optional parameters for filtering workflows
   * @returns A list of workflows
   */
  async getWorkflows(
    params?: WorkflowListParams
  ): Promise<WorkflowListResponse> {
    try {
      return await this.client.getWorkflows(params);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      throw error;
    }
  }

  /**
   * Get a workflow by ID
   * @param id The workflow ID
   * @param excludePinnedData Whether to exclude pinned data
   * @returns The workflow
   */
  async getWorkflow(
    id: string,
    excludePinnedData?: boolean
  ): Promise<Workflow> {
    try {
      return await this.client.getWorkflow(id, excludePinnedData);
    } catch (error) {
      console.error(`Error fetching workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a workflow
   * @param workflow The workflow to create
   * @returns The created workflow
   */
  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    try {
      return await this.client.createWorkflow(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      throw error;
    }
  }

  /**
   * Update a workflow
   * @param id The workflow ID
   * @param workflow The updated workflow data
   * @returns The updated workflow
   */
  async updateWorkflow(id: string, workflow: Workflow): Promise<Workflow> {
    try {
      return await this.client.updateWorkflow(id, workflow);
    } catch (error) {
      console.error(`Error updating workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a workflow
   * @param id The workflow ID
   * @returns The deleted workflow
   */
  async deleteWorkflow(id: string): Promise<Workflow> {
    try {
      return await this.client.deleteWorkflow(id);
    } catch (error) {
      console.error(`Error deleting workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Activate a workflow
   * @param id The workflow ID
   * @returns The activated workflow
   */
  async activateWorkflow(id: string): Promise<Workflow> {
    try {
      return await this.client.activateWorkflow(id);
    } catch (error) {
      console.error(`Error activating workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a workflow
   * @param id The workflow ID
   * @returns The deactivated workflow
   */
  async deactivateWorkflow(id: string): Promise<Workflow> {
    try {
      return await this.client.deactivateWorkflow(id);
    } catch (error) {
      console.error(`Error deactivating workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Transfer a workflow to another project
   * @param id The workflow ID
   * @param destinationProjectId The destination project ID
   * @returns The transfer result
   */
  async transferWorkflow(
    id: string,
    destinationProjectId: string
  ): Promise<any> {
    try {
      const params: WorkflowTransferParams = { destinationProjectId };
      return await this.client.transferWorkflow(id, params);
    } catch (error) {
      console.error(`Error transferring workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow tags
   * @param id The workflow ID
   * @returns The workflow tags
   */
  async getWorkflowTags(id: string): Promise<Tag[]> {
    try {
      return await this.client.getWorkflowTags(id);
    } catch (error) {
      console.error(`Error fetching tags for workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update workflow tags
   * @param id The workflow ID
   * @param tagIds The tag IDs
   * @returns The updated workflow tags
   */
  async updateWorkflowTags(
    id: string,
    tagIds: { id: string }[]
  ): Promise<Tag[]> {
    try {
      // The API expects the tagIds array directly, not wrapped in an object
      console.log(
        `Updating tags for workflow ${id} with tagIds:`,
        JSON.stringify(tagIds)
      );
      return await this.client.updateWorkflowTags(id, tagIds);
    } catch (error) {
      console.error(`Error updating tags for workflow ${id}:`, error);
      throw error;
    }
  }

  // ==================== CREDENTIAL METHODS ====================

  /**
   * Create a credential
   * @param credential The credential to create
   * @returns The created credential
   */
  async createCredential(credential: Credential): Promise<CredentialResponse> {
    try {
      return await this.client.createCredential(credential);
    } catch (error) {
      console.error("Error creating credential:", error);
      throw error;
    }
  }

  /**
   * Delete a credential
   * @param id The credential ID
   * @returns The deleted credential
   */
  async deleteCredential(id: string): Promise<CredentialResponse> {
    try {
      return await this.client.deleteCredential(id);
    } catch (error) {
      console.error(`Error deleting credential ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get credential schema
   * @param credentialTypeName The credential type name
   * @returns The credential schema
   */
  async getCredentialSchema(
    credentialTypeName: string
  ): Promise<CredentialSchema> {
    try {
      return await this.client.getCredentialSchema(credentialTypeName);
    } catch (error) {
      console.error(
        `Error getting credential schema for ${credentialTypeName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Transfer a credential to another project
   * @param id The credential ID
   * @param params The transfer parameters
   * @returns Success status
   */
  async transferCredential(
    id: string,
    params: CredentialTransferParams
  ): Promise<void> {
    try {
      return await this.client.transferCredential(id, params);
    } catch (error) {
      console.error(`Error transferring credential ${id}:`, error);
      throw error;
    }
  }

  // ==================== EXECUTION METHODS ====================

  /**
   * Get all executions
   * @param params Optional parameters for filtering executions
   * @returns A list of executions
   */
  async getExecutions(
    params?: ExecutionListParams
  ): Promise<ExecutionListResponse> {
    try {
      return await this.client.getExecutions(params);
    } catch (error) {
      console.error("Error fetching executions:", error);
      throw error;
    }
  }

  /**
   * Get an execution by ID
   * @param id The execution ID
   * @param includeData Whether to include the execution data
   * @returns The execution
   */
  async getExecution(id: number, includeData?: boolean): Promise<Execution> {
    try {
      return await this.client.getExecution(id, includeData);
    } catch (error) {
      console.error(`Error fetching execution ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an execution
   * @param id The execution ID
   * @returns The deleted execution
   */
  async deleteExecution(id: number): Promise<Execution> {
    try {
      return await this.client.deleteExecution(id);
    } catch (error) {
      console.error(`Error deleting execution ${id}:`, error);
      throw error;
    }
  }

  /**
   * Execute a workflow
   * @param id The workflow ID
   * @param params Optional parameters for the execution
   * @returns The execution result
   */
  async executeWorkflow(
    id: string,
    params?: WorkflowExecuteParams
  ): Promise<Execution> {
    try {
      return await this.client.executeWorkflow(id, params);
    } catch (error) {
      console.error(`Error executing workflow ${id}:`, error);
      throw error;
    }
  }

  // ==================== USER METHODS ====================

  /**
   * Get all users
   * @param params Optional parameters for filtering users
   * @returns A list of users
   */
  async getUsers(params?: UserListParams): Promise<UserListResponse> {
    try {
      return await this.client.getUsers(params);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  /**
   * Get a user by ID or email
   * @param idOrEmail The user ID or email
   * @param includeRole Whether to include the user's role
   * @returns The user
   */
  async getUser(idOrEmail: string, includeRole?: boolean): Promise<User> {
    try {
      return await this.client.getUser(idOrEmail, includeRole);
    } catch (error) {
      console.error(`Error fetching user ${idOrEmail}:`, error);
      throw error;
    }
  }

  /**
   * Create users
   * @param users Array of users to create
   * @returns The created users
   */
  async createUsers(users: CreateUserParams[]): Promise<CreateUserResponse[]> {
    try {
      return await this.client.createUsers(users);
    } catch (error) {
      console.error("Error creating users:", error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param idOrEmail The user ID or email
   * @returns Success status
   */
  async deleteUser(idOrEmail: string): Promise<void> {
    try {
      return await this.client.deleteUser(idOrEmail);
    } catch (error) {
      console.error(`Error deleting user ${idOrEmail}:`, error);
      throw error;
    }
  }

  /**
   * Change a user's role
   * @param idOrEmail The user ID or email
   * @param params The role change parameters
   * @returns Success status
   */
  async changeUserRole(
    idOrEmail: string,
    params: ChangeRoleParams
  ): Promise<void> {
    try {
      return await this.client.changeUserRole(idOrEmail, params);
    } catch (error) {
      console.error(`Error changing role for user ${idOrEmail}:`, error);
      throw error;
    }
  }

  // ==================== TAG METHODS ====================

  /**
   * Get all tags
   * @param limit The maximum number of tags to return
   * @param cursor The cursor for pagination
   * @returns A list of tags
   */
  async getTags(limit?: number, cursor?: string): Promise<TagListResponse> {
    try {
      return await this.client.getTags(limit, cursor);
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  }

  /**
   * Get a tag by ID
   * @param id The tag ID
   * @returns The tag
   */
  async getTag(id: string): Promise<TagResponse> {
    try {
      return await this.client.getTag(id);
    } catch (error) {
      console.error(`Error fetching tag ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a tag
   * @param tag The tag to create
   * @returns The created tag
   */
  async createTag(tag: Tag): Promise<TagResponse> {
    try {
      return await this.client.createTag(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  }

  /**
   * Update a tag
   * @param id The tag ID
   * @param tag The updated tag
   * @returns The updated tag
   */
  async updateTag(id: string, tag: Tag): Promise<TagResponse> {
    try {
      return await this.client.updateTag(id, tag);
    } catch (error) {
      console.error(`Error updating tag ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a tag
   * @param id The tag ID
   * @returns The deleted tag
   */
  async deleteTag(id: string): Promise<TagResponse> {
    try {
      return await this.client.deleteTag(id);
    } catch (error) {
      console.error(`Error deleting tag ${id}:`, error);
      throw error;
    }
  }

  // ==================== PROJECT METHODS ====================

  /**
   * Get all projects
   * @param params Optional parameters for filtering projects
   * @returns A list of projects
   */
  async getProjects(params?: ProjectListParams): Promise<ProjectListResponse> {
    try {
      return await this.client.getProjects(params);
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }

  /**
   * Create a project
   * @param project The project to create
   * @returns The created project
   */
  async createProject(project: Project): Promise<ProjectResponse> {
    try {
      return await this.client.createProject(project);
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  /**
   * Update a project
   * @param id The project ID
   * @param project The updated project
   * @returns Success status
   */
  async updateProject(id: string, project: Project): Promise<void> {
    try {
      return await this.client.updateProject(id, project);
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a project
   * @param id The project ID
   * @returns Success status
   */
  async deleteProject(id: string): Promise<void> {
    try {
      return await this.client.deleteProject(id);
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  }

  // ==================== VARIABLE METHODS ====================

  /**
   * Get all variables
   * @param params Optional parameters for filtering variables
   * @returns A list of variables
   */
  async getVariables(
    params?: VariableListParams
  ): Promise<VariableListResponse> {
    try {
      return await this.client.getVariables(params);
    } catch (error) {
      console.error("Error fetching variables:", error);
      throw error;
    }
  }

  /**
   * Create a variable
   * @param variable The variable to create
   * @returns Success status
   */
  async createVariable(variable: Variable): Promise<void> {
    try {
      return await this.client.createVariable(variable);
    } catch (error) {
      console.error("Error creating variable:", error);
      throw error;
    }
  }

  /**
   * Delete a variable
   * @param id The variable ID
   * @returns Success status
   */
  async deleteVariable(id: string): Promise<void> {
    try {
      return await this.client.deleteVariable(id);
    } catch (error) {
      console.error(`Error deleting variable ${id}:`, error);
      throw error;
    }
  }

  // ==================== SOURCE CONTROL METHODS ====================

  /**
   * Pull changes from the remote repository
   * @param options Pull options
   * @returns Import result
   */
  async pullFromSourceControl(options: PullOptions): Promise<ImportResult> {
    try {
      return await this.client.pullFromSourceControl(options);
    } catch (error) {
      console.error("Error pulling from source control:", error);
      throw error;
    }
  }

  // ==================== AUDIT METHODS ====================

  /**
   * Generate a security audit
   * @param options Audit options
   * @returns Audit report
   */
  async generateAudit(options?: AuditOptions): Promise<AuditReport> {
    try {
      return await this.client.generateAudit(options);
    } catch (error) {
      console.error("Error generating audit:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const n8nServiceV2 = new N8nServiceV2(env.N8N_API_URL, env.N8N_API_KEY);
