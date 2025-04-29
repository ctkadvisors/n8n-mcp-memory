import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { n8nServiceV2 } from '../../services/n8nServiceV2.js';
import { formatError } from '../../utils/errorHandling.js';

// Define schemas for execution-related operations
const executionIdSchema = {
  executionId: z.number(),
};

const workflowExecuteSchema = {
  workflowId: z.string(),
  // Optional parameters for workflow execution
  params: z
    .object({
      workflowData: z.object({}).passthrough().optional(),
      runData: z.record(z.any()).optional(),
      startNodes: z.array(z.string()).optional(),
      destinationNode: z.string().optional(),
      pinData: z.record(z.any()).optional(),
    })
    .optional(),
};

/**
 * Register execution-related tools with the MCP server
 * @param server The MCP server
 */
export function registerExecutionTools(server: McpServer): void {
  // DELETE /executions/{id} - Delete an execution
  server.tool(
    'deleteExecution',
    'Deletes an execution from n8n. Requires executionId.',
    executionIdSchema,
    async (args) => {
      try {
        const { executionId } = args;
        const result = await n8nServiceV2.deleteExecution(executionId);
        return {
          content: [
            {
              type: 'text',
              text: `Execution ${executionId} deleted successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error deleting execution:', error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: `Error deleting execution: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // POST /workflows/{id}/execute - Execute a workflow
  server.tool(
    'executeWorkflow',
    'Executes a workflow in n8n. Requires workflowId and optional execution parameters.',
    workflowExecuteSchema,
    async (args) => {
      try {
        const { workflowId, params } = args;
        // Convert params to WorkflowExecuteParams
        const executeParams: any = params || {};

        const result = await n8nServiceV2.executeWorkflow(workflowId, executeParams);
        return {
          content: [
            {
              type: 'text',
              text: `Workflow ${workflowId} executed successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error executing workflow:', error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: `Error executing workflow: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
