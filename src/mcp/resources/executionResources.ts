import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { n8nServiceV2 } from "../../services/n8nServiceV2.js";

/**
 * Register execution-related resources with the MCP server
 * @param server The MCP server
 */
export function registerExecutionResources(server: McpServer): void {
  // GET /executions - List all executions
  server.resource(
    "n8nExecutions",
    "n8n://executions",
    {
      name: "n8n Executions",
      description: "Lists all workflow executions in your n8n instance.",
    },
    async (uri) => {
      try {
        // Parse query parameters from the URL
        const url = new URL(uri.href);
        const params: any = {
          workflowId: url.searchParams.get("workflowId") || undefined,
          projectId: url.searchParams.get("projectId") || undefined,
          includeData: url.searchParams.get("includeData") === "true",
          limit: url.searchParams.get("limit")
            ? parseInt(url.searchParams.get("limit") as string, 10)
            : undefined,
          cursor: url.searchParams.get("cursor") || undefined,
        };

        // Handle status parameter with type checking
        const status = url.searchParams.get("status");
        if (
          status === "error" ||
          status === "success" ||
          status === "waiting"
        ) {
          params.status = status;
        }

        const executions = await n8nServiceV2.getExecutions(params);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(executions, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Error fetching n8n executions:", error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n executions: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // GET /executions/{id} - Get an execution by ID
  server.resource(
    "n8nExecution",
    new ResourceTemplate("n8n://executions/{executionId}", { list: undefined }),
    {
      name: "n8n Execution Details",
      description: "Gets details of a specific workflow execution by ID.",
    },
    async (uri, params) => {
      try {
        // Ensure executionId is a number
        const executionId = params.executionId;
        const id = Array.isArray(executionId)
          ? parseInt(executionId[0], 10)
          : parseInt(executionId, 10);

        // Parse query parameters from the URL
        const url = new URL(uri.href);
        const includeData = url.searchParams.get("includeData") === "true";

        const execution = await n8nServiceV2.getExecution(id, includeData);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(execution, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(
          `Error fetching n8n execution ${params.executionId}:`,
          error
        );
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n execution ${params.executionId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
