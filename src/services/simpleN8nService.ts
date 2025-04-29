import axios from "axios";
import env from "../utils/env.js";

// Define interfaces for request/response data
interface WorkflowData {
  name: string;
  nodes: any[];
  connections: any;
  settings: any;
  [key: string]: any;
}

interface TagId {
  id: string;
}

interface TransferData {
  destinationProjectId: string;
}

/**
 * A simple service for interacting with the n8n API
 */
export class SimpleN8nService {
  private apiUrl: string;
  private apiKey: string;
  private headers: Record<string, string>;

  constructor() {
    this.apiUrl = env.N8N_API_URL;
    this.apiKey = env.N8N_API_KEY;
    this.headers = {
      "X-N8N-API-KEY": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  /**
   * Helper method to handle API requests
   */
  private async request<T>(
    method: "get" | "post" | "put" | "delete",
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      const response = await axios({
        method,
        url: `${this.apiUrl}${endpoint}`,
        headers: this.headers,
        data,
        params,
      });
      return response.data;
    } catch (error) {
      console.error(`Error in ${method.toUpperCase()} ${endpoint}:`, error);
      throw error;
    }
  }

  // ==================== WORKFLOW ENDPOINTS ====================

  /**
   * Get all workflows
   * GET /workflows
   */
  async getWorkflows(params?: {
    active?: boolean;
    tags?: string;
    name?: string;
    projectId?: string;
    excludePinnedData?: boolean;
    limit?: number;
    cursor?: string;
  }) {
    return this.request("get", "/workflows", undefined, params);
  }

  /**
   * Get a workflow by ID
   * GET /workflows/{id}
   */
  async getWorkflow(id: string | string[], excludePinnedData?: boolean) {
    // Ensure we're passing a single string ID
    const workflowId = Array.isArray(id) ? id[0] : id;
    return this.request("get", `/workflows/${workflowId}`, undefined, {
      excludePinnedData,
    });
  }

  /**
   * Create a workflow
   * POST /workflows
   */
  async createWorkflow(workflowData: WorkflowData) {
    return this.request<WorkflowData>("post", "/workflows", workflowData);
  }

  /**
   * Update a workflow
   * PUT /workflows/{id}
   */
  async updateWorkflow(id: string, workflowData: WorkflowData) {
    return this.request<WorkflowData>("put", `/workflows/${id}`, workflowData);
  }

  /**
   * Delete a workflow
   * DELETE /workflows/{id}
   */
  async deleteWorkflow(id: string) {
    return this.request("delete", `/workflows/${id}`);
  }

  /**
   * Activate a workflow
   * POST /workflows/{id}/activate
   */
  async activateWorkflow(id: string) {
    return this.request("post", `/workflows/${id}/activate`);
  }

  /**
   * Deactivate a workflow
   * POST /workflows/{id}/deactivate
   */
  async deactivateWorkflow(id: string) {
    return this.request("post", `/workflows/${id}/deactivate`);
  }

  /**
   * Transfer a workflow to another project
   * PUT /workflows/{id}/transfer
   */
  async transferWorkflow(id: string, destinationProjectId: string) {
    const data: TransferData = { destinationProjectId };
    return this.request("put", `/workflows/${id}/transfer`, data);
  }

  /**
   * Get workflow tags
   * GET /workflows/{id}/tags
   */
  async getWorkflowTags(id: string) {
    return this.request("get", `/workflows/${id}/tags`);
  }

  /**
   * Update workflow tags
   * PUT /workflows/{id}/tags
   */
  async updateWorkflowTags(id: string, tagIds: TagId[]) {
    console.log(
      `SimpleN8nService.updateWorkflowTags - Sending tagIds:`,
      JSON.stringify(tagIds)
    );
    // The API expects the tagIds array directly
    return this.request("put", `/workflows/${id}/tags`, tagIds);
  }

  // ==================== TAG ENDPOINTS ====================

  /**
   * Get all tags
   * GET /tags
   */
  async getTags(params?: { limit?: number; cursor?: string }) {
    return this.request("get", "/tags", undefined, params);
  }

  /**
   * Get a tag by ID
   * GET /tags/{id}
   */
  async getTag(id: string) {
    return this.request("get", `/tags/${id}`);
  }

  // ==================== EXECUTION ENDPOINTS ====================

  /**
   * Get all executions
   * GET /executions
   */
  async getExecutions(params?: {
    status?: "error" | "success" | "waiting";
    workflowId?: string;
    projectId?: string;
    includeData?: boolean;
    limit?: number;
    cursor?: string;
  }) {
    return this.request("get", "/executions", undefined, params);
  }

  /**
   * Get an execution by ID
   * GET /executions/{id}
   */
  async getExecution(id: string, includeData?: boolean) {
    return this.request("get", `/executions/${id}`, undefined, { includeData });
  }
}

// Export a singleton instance
export const simpleN8nService = new SimpleN8nService();
