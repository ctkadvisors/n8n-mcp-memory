import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  Workflow,
  WorkflowListParams,
  WorkflowListResponse,
  Tag,
  TagResponse,
  TagListResponse,
  WorkflowTagsUpdateParams,
  WorkflowTransferParams,
  ApiError,
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

/**
 * Client for interacting with the n8n API
 */
export class N8nClient {
  private client: AxiosInstance;

  /**
   * Create a new n8n API client
   * @param baseURL The base URL of the n8n API
   * @param apiKey The API key for authentication
   */
  constructor(baseURL: string, apiKey: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "X-N8N-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Helper method to handle API requests
   * @param config The axios request configuration
   * @returns The response data
   * @throws ApiError if the request fails
   */
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      // Set default timeout if not specified
      if (!config.timeout) {
        config.timeout = 10000; // 10 seconds default timeout
      }

      // Log the request for debugging
      console.log(
        `N8nClient.request - ${config.method?.toUpperCase()} ${
          config.url
        } (timeout: ${config.timeout}ms)`
      );

      // Make the request
      const response = await this.client(config);

      // Check if response is empty
      if (!response.data && config.method?.toUpperCase() !== "DELETE") {
        console.warn(
          `N8nClient.request - Empty response received for ${config.method?.toUpperCase()} ${
            config.url
          }`
        );

        // For PUT requests (updates), try to get the resource after update
        if (config.method?.toUpperCase() === "PUT" && config.url) {
          console.log(
            `N8nClient.request - Attempting to fetch resource after empty PUT response`
          );

          // Extract ID from URL for GET request
          const urlParts = config.url.split("/");
          const resourceId = urlParts[urlParts.length - 1];
          const resourceType = urlParts[urlParts.length - 2];

          if (resourceId && resourceType) {
            // Wait a moment before fetching
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Make a GET request to fetch the updated resource
            const getResponse = await this.client({
              method: "GET",
              url: `/${resourceType}/${resourceId}`,
              timeout: config.timeout,
            });

            if (getResponse.data) {
              console.log(
                `N8nClient.request - Successfully retrieved resource after empty PUT response`
              );
              return getResponse.data;
            }
          }
        }

        // If we can't recover, throw a more descriptive error
        throw new Error(
          `Empty response received from ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          `N8nClient.request - API Error: ${error.response.status} - ${error.response.statusText}`
        );
        console.error(
          "Response data:",
          JSON.stringify(error.response.data, null, 2)
        );

        const apiError: ApiError = {
          status: error.response.status,
          message: error.response.statusText,
          error: error.response.data,
        };
        throw apiError;
      } else if (axios.isAxiosError(error)) {
        console.error(`N8nClient.request - Network Error: ${error.message}`);
        if (error.request) {
          console.error("Request details:", error.request);
        }
        if (error.config) {
          console.error(
            "Request config:",
            JSON.stringify(
              {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers,
                timeout: error.config.timeout,
              },
              null,
              2
            )
          );
        }

        // For timeout errors, provide a more helpful message
        if (error.code === "ECONNABORTED") {
          throw new Error(
            `Request timeout (${
              config.timeout
            }ms) for ${config.method?.toUpperCase()} ${config.url}`
          );
        }
      } else {
        console.error("N8nClient.request - Unknown error:", error);
      }
      throw error;
    }
  }

  // ==================== WORKFLOW ENDPOINTS ====================

  /**
   * Get all workflows
   * @param params Optional parameters for filtering workflows
   * @returns A list of workflows
   */
  async getWorkflows(
    params?: WorkflowListParams
  ): Promise<WorkflowListResponse> {
    return this.request<WorkflowListResponse>({
      method: "GET",
      url: "/workflows",
      params,
    });
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
    return this.request<Workflow>({
      method: "GET",
      url: `/workflows/${id}`,
      params: { excludePinnedData },
    });
  }

  /**
   * Create a workflow
   * @param workflow The workflow to create
   * @returns The created workflow
   */
  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    // Add detailed logging for debugging
    console.log(
      "N8nClient.createWorkflow - Request payload:",
      JSON.stringify(
        {
          name: workflow.name,
          nodesCount: workflow.nodes?.length || 0,
          nodesTypes: workflow.nodes?.map((n) => n.type) || [],
          connectionsKeys: workflow.connections
            ? Object.keys(workflow.connections)
            : [],
          settingsKeys: workflow.settings ? Object.keys(workflow.settings) : [],
        },
        null,
        2
      )
    );

    try {
      const result = await this.request<Workflow>({
        method: "POST",
        url: "/workflows",
        data: workflow,
      });

      console.log(
        "N8nClient.createWorkflow - Success response:",
        JSON.stringify(
          {
            id: result.id,
            name: result.name,
          },
          null,
          2
        )
      );

      return result;
    } catch (error) {
      console.error("N8nClient.createWorkflow - Error details:", error);

      // Log more details if it's an API error
      if (typeof error === "object" && error !== null && "error" in error) {
        console.error("API Error details:", JSON.stringify(error, null, 2));
      }

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
    // Add detailed logging for debugging
    console.log(
      "N8nClient.updateWorkflow - Request payload:",
      JSON.stringify(
        {
          id,
          name: workflow.name,
          nodesCount: workflow.nodes?.length || 0,
          nodesTypes: workflow.nodes?.map((n) => n.type) || [],
          connectionsKeys: workflow.connections
            ? Object.keys(workflow.connections)
            : [],
          settingsKeys: workflow.settings ? Object.keys(workflow.settings) : [],
        },
        null,
        2
      )
    );

    try {
      // Add a small delay before making the request to ensure the API is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = await this.request<Workflow>({
        method: "PUT",
        url: `/workflows/${id}`,
        data: workflow,
        // Add a longer timeout for update operations
        timeout: 10000,
      });

      console.log(
        "N8nClient.updateWorkflow - Success response:",
        JSON.stringify(
          {
            id: result.id,
            name: result.name,
          },
          null,
          2
        )
      );

      return result;
    } catch (error) {
      console.error("N8nClient.updateWorkflow - Error details:", error);

      // Log more details if it's an API error
      if (typeof error === "object" && error !== null && "error" in error) {
        console.error("API Error details:", JSON.stringify(error, null, 2));
      }

      // If we get an empty response error, try again with a longer delay
      if (error instanceof Error && error.message.includes("Empty response")) {
        console.log(
          "N8nClient.updateWorkflow - Retrying after empty response error"
        );

        // Wait a bit longer before retrying
        await new Promise((resolve) => setTimeout(resolve, 1500));

        return this.request<Workflow>({
          method: "PUT",
          url: `/workflows/${id}`,
          data: workflow,
          // Add an even longer timeout for the retry
          timeout: 15000,
        });
      }

      throw error;
    }
  }

  /**
   * Delete a workflow
   * @param id The workflow ID
   * @returns The deleted workflow
   */
  async deleteWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>({
      method: "DELETE",
      url: `/workflows/${id}`,
    });
  }

  /**
   * Activate a workflow
   * @param id The workflow ID
   * @returns The activated workflow
   */
  async activateWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>({
      method: "POST",
      url: `/workflows/${id}/activate`,
    });
  }

  /**
   * Deactivate a workflow
   * @param id The workflow ID
   * @returns The deactivated workflow
   */
  async deactivateWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>({
      method: "POST",
      url: `/workflows/${id}/deactivate`,
    });
  }

  /**
   * Transfer a workflow to another project
   * @param id The workflow ID
   * @param params The transfer parameters
   * @returns The transfer result
   */
  async transferWorkflow(
    id: string,
    params: WorkflowTransferParams
  ): Promise<any> {
    return this.request<any>({
      method: "PUT",
      url: `/workflows/${id}/transfer`,
      data: params,
    });
  }

  /**
   * Get workflow tags
   * @param id The workflow ID
   * @returns The workflow tags
   */
  async getWorkflowTags(id: string): Promise<Tag[]> {
    return this.request<Tag[]>({
      method: "GET",
      url: `/workflows/${id}/tags`,
    });
  }

  /**
   * Update workflow tags
   * @param id The workflow ID
   * @param tagIds The tag IDs array
   * @returns The updated workflow tags
   */
  async updateWorkflowTags(
    id: string,
    tagIds: { id: string }[]
  ): Promise<Tag[]> {
    // Add detailed logging for debugging
    console.log(
      "N8nClient.updateWorkflowTags - Request payload:",
      JSON.stringify(tagIds, null, 2)
    );

    try {
      const result = await this.request<Tag[]>({
        method: "PUT",
        url: `/workflows/${id}/tags`,
        data: tagIds, // Send the array directly
      });

      console.log(
        "N8nClient.updateWorkflowTags - Success response:",
        JSON.stringify(result, null, 2)
      );

      return result;
    } catch (error) {
      console.error("N8nClient.updateWorkflowTags - Error details:", error);
      throw error;
    }
  }

  // ==================== CREDENTIAL ENDPOINTS ====================

  /**
   * Create a credential
   * @param credential The credential to create
   * @returns The created credential
   */
  async createCredential(credential: Credential): Promise<CredentialResponse> {
    return this.request<CredentialResponse>({
      method: "POST",
      url: "/credentials",
      data: credential,
    });
  }

  /**
   * Delete a credential
   * @param id The credential ID
   * @returns The deleted credential
   */
  async deleteCredential(id: string): Promise<CredentialResponse> {
    return this.request<CredentialResponse>({
      method: "DELETE",
      url: `/credentials/${id}`,
    });
  }

  /**
   * Get credential schema
   * @param credentialTypeName The credential type name
   * @returns The credential schema
   */
  async getCredentialSchema(
    credentialTypeName: string
  ): Promise<CredentialSchema> {
    return this.request<CredentialSchema>({
      method: "GET",
      url: `/credentials/schema/${credentialTypeName}`,
    });
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
    return this.request<void>({
      method: "PUT",
      url: `/credentials/${id}/transfer`,
      data: params,
    });
  }

  // ==================== EXECUTION ENDPOINTS ====================

  /**
   * Get all executions
   * @param params Optional parameters for filtering executions
   * @returns A list of executions
   */
  async getExecutions(
    params?: ExecutionListParams
  ): Promise<ExecutionListResponse> {
    return this.request<ExecutionListResponse>({
      method: "GET",
      url: "/executions",
      params,
    });
  }

  /**
   * Get an execution by ID
   * @param id The execution ID
   * @param includeData Whether to include the execution data
   * @returns The execution
   */
  async getExecution(id: number, includeData?: boolean): Promise<Execution> {
    return this.request<Execution>({
      method: "GET",
      url: `/executions/${id}`,
      params: { includeData },
    });
  }

  /**
   * Delete an execution
   * @param id The execution ID
   * @returns The deleted execution
   */
  async deleteExecution(id: number): Promise<Execution> {
    return this.request<Execution>({
      method: "DELETE",
      url: `/executions/${id}`,
    });
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
    return this.request<Execution>({
      method: "POST",
      url: `/workflows/${id}/execute`,
      data: params,
    });
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Get all users
   * @param params Optional parameters for filtering users
   * @returns A list of users
   */
  async getUsers(params?: UserListParams): Promise<UserListResponse> {
    return this.request<UserListResponse>({
      method: "GET",
      url: "/users",
      params,
    });
  }

  /**
   * Get a user by ID or email
   * @param idOrEmail The user ID or email
   * @param includeRole Whether to include the user's role
   * @returns The user
   */
  async getUser(idOrEmail: string, includeRole?: boolean): Promise<User> {
    return this.request<User>({
      method: "GET",
      url: `/users/${idOrEmail}`,
      params: { includeRole },
    });
  }

  /**
   * Create users
   * @param users Array of users to create
   * @returns The created users
   */
  async createUsers(users: CreateUserParams[]): Promise<CreateUserResponse[]> {
    return this.request<CreateUserResponse[]>({
      method: "POST",
      url: "/users",
      data: users,
    });
  }

  /**
   * Delete a user
   * @param idOrEmail The user ID or email
   * @returns Success status
   */
  async deleteUser(idOrEmail: string): Promise<void> {
    return this.request<void>({
      method: "DELETE",
      url: `/users/${idOrEmail}`,
    });
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
    return this.request<void>({
      method: "PATCH",
      url: `/users/${idOrEmail}/role`,
      data: params,
    });
  }

  // ==================== TAG ENDPOINTS ====================

  /**
   * Get all tags
   * @param limit The maximum number of tags to return
   * @param cursor The cursor for pagination
   * @returns A list of tags
   */
  async getTags(limit?: number, cursor?: string): Promise<TagListResponse> {
    return this.request<TagListResponse>({
      method: "GET",
      url: "/tags",
      params: { limit, cursor },
    });
  }

  /**
   * Get a tag by ID
   * @param id The tag ID
   * @returns The tag
   */
  async getTag(id: string): Promise<TagResponse> {
    return this.request<TagResponse>({
      method: "GET",
      url: `/tags/${id}`,
    });
  }

  /**
   * Create a tag
   * @param tag The tag to create
   * @returns The created tag
   */
  async createTag(tag: Tag): Promise<TagResponse> {
    return this.request<TagResponse>({
      method: "POST",
      url: "/tags",
      data: tag,
    });
  }

  /**
   * Update a tag
   * @param id The tag ID
   * @param tag The updated tag
   * @returns The updated tag
   */
  async updateTag(id: string, tag: Tag): Promise<TagResponse> {
    return this.request<TagResponse>({
      method: "PUT",
      url: `/tags/${id}`,
      data: tag,
    });
  }

  /**
   * Delete a tag
   * @param id The tag ID
   * @returns The deleted tag
   */
  async deleteTag(id: string): Promise<TagResponse> {
    return this.request<TagResponse>({
      method: "DELETE",
      url: `/tags/${id}`,
    });
  }

  // ==================== PROJECT ENDPOINTS ====================

  /**
   * Get all projects
   * @param params Optional parameters for filtering projects
   * @returns A list of projects
   */
  async getProjects(params?: ProjectListParams): Promise<ProjectListResponse> {
    return this.request<ProjectListResponse>({
      method: "GET",
      url: "/projects",
      params,
    });
  }

  /**
   * Create a project
   * @param project The project to create
   * @returns The created project
   */
  async createProject(project: Project): Promise<ProjectResponse> {
    return this.request<ProjectResponse>({
      method: "POST",
      url: "/projects",
      data: project,
    });
  }

  /**
   * Update a project
   * @param id The project ID
   * @param project The updated project
   * @returns Success status
   */
  async updateProject(id: string, project: Project): Promise<void> {
    return this.request<void>({
      method: "PUT",
      url: `/projects/${id}`,
      data: project,
    });
  }

  /**
   * Delete a project
   * @param id The project ID
   * @returns Success status
   */
  async deleteProject(id: string): Promise<void> {
    return this.request<void>({
      method: "DELETE",
      url: `/projects/${id}`,
    });
  }

  // ==================== VARIABLE ENDPOINTS ====================

  /**
   * Get all variables
   * @param params Optional parameters for filtering variables
   * @returns A list of variables
   */
  async getVariables(
    params?: VariableListParams
  ): Promise<VariableListResponse> {
    return this.request<VariableListResponse>({
      method: "GET",
      url: "/variables",
      params,
    });
  }

  /**
   * Create a variable
   * @param variable The variable to create
   * @returns Success status
   */
  async createVariable(variable: Variable): Promise<void> {
    return this.request<void>({
      method: "POST",
      url: "/variables",
      data: variable,
    });
  }

  /**
   * Delete a variable
   * @param id The variable ID
   * @returns Success status
   */
  async deleteVariable(id: string): Promise<void> {
    return this.request<void>({
      method: "DELETE",
      url: `/variables/${id}`,
    });
  }

  // ==================== SOURCE CONTROL ENDPOINTS ====================

  /**
   * Pull changes from the remote repository
   * @param options Pull options
   * @returns Import result
   */
  async pullFromSourceControl(options: PullOptions): Promise<ImportResult> {
    return this.request<ImportResult>({
      method: "POST",
      url: "/source-control/pull",
      data: options,
    });
  }

  // ==================== AUDIT ENDPOINTS ====================

  /**
   * Generate a security audit
   * @param options Audit options
   * @returns Audit report
   */
  async generateAudit(options?: AuditOptions): Promise<AuditReport> {
    return this.request<AuditReport>({
      method: "POST",
      url: "/audit",
      data: options,
    });
  }
}
