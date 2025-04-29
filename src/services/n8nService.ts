import { ApiError } from "../api/generated/core/ApiError.js";
import { OpenAPI } from "../api/generated/core/OpenAPI.js";
import { WorkflowService } from "../api/generated/services/WorkflowService.js";
import { TagsService } from "../api/generated/services/TagsService.js";
import { ExecutionService } from "../api/generated/services/ExecutionService.js";
import env from "../utils/env.js";

// Initialize the OpenAPI configuration
OpenAPI.BASE = env.N8N_API_URL;
OpenAPI.WITH_CREDENTIALS = false;
OpenAPI.HEADERS = {
  "X-N8N-API-KEY": env.N8N_API_KEY,
  "Content-Type": "application/json",
};

/**
 * Service for interacting with the n8n API
 */
export class N8nService {
  /**
   * Get all workflows
   */
  async getWorkflows() {
    try {
      const response = await WorkflowService.getWorkflows();
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`API Error: ${error.status} - ${error.message}`);
      } else {
        console.error("Unknown error:", error);
      }
      throw error;
    }
  }

  /**
   * Get a workflow by ID
   */
  async getWorkflow(id: string | string[]) {
    try {
      // Ensure we're passing a single string ID
      const workflowId = Array.isArray(id) ? id[0] : id;
      const response = await WorkflowService.getWorkflow(workflowId);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`API Error: ${error.status} - ${error.message}`);
      } else {
        console.error("Unknown error:", error);
      }
      throw error;
    }
  }

  /**
   * Get all tags
   */
  async getTags() {
    try {
      const response = await TagsService.getTags();
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`API Error: ${error.status} - ${error.message}`);
      } else {
        console.error("Unknown error:", error);
      }
      throw error;
    }
  }

  /**
   * Get all executions
   */
  async getExecutions() {
    try {
      const response = await ExecutionService.getExecutions();
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`API Error: ${error.status} - ${error.message}`);
      } else {
        console.error("Unknown error:", error);
      }
      throw error;
    }
  }
}

// Export a singleton instance
export const n8nService = new N8nService();
