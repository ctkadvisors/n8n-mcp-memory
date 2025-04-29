import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { n8nServiceV2 } from "../../services/n8nServiceV2.js";

/**
 * Register workflow-related resources with the MCP server
 * @param server The MCP server
 */
export function registerWorkflowResources(server: McpServer): void {
  // GET /workflows - List all workflows
  server.resource(
    "n8nWorkflows",
    "n8n://workflows",
    {
      name: "n8n Workflows",
      description: "Lists all workflows in your n8n instance.",
    },
    async (uri) => {
      try {
        const workflows = await n8nServiceV2.getWorkflows();
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(workflows, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Error fetching n8n workflows:", error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n workflows: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // GET /workflows/{id} - Get a workflow by ID
  server.resource(
    "n8nWorkflow",
    new ResourceTemplate("n8n://workflows/{workflowId}", { list: undefined }),
    {
      name: "n8n Workflow Details",
      description: "Gets details of a specific workflow by ID.",
    },
    async (uri, { workflowId }) => {
      try {
        // Ensure workflowId is a string
        const id = Array.isArray(workflowId) ? workflowId[0] : workflowId;
        const workflow = await n8nServiceV2.getWorkflow(id);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(workflow, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`Error fetching n8n workflow ${workflowId}:`, error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n workflow ${workflowId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // GET /workflows/{id}/tags - Get workflow tags
  server.resource(
    "n8nWorkflowTags",
    new ResourceTemplate("n8n://workflows/{workflowId}/tags", {
      list: undefined,
    }),
    {
      name: "n8n Workflow Tags",
      description: "Gets tags associated with a specific workflow.",
    },
    async (uri, { workflowId }) => {
      try {
        // Ensure workflowId is a string
        const id = Array.isArray(workflowId) ? workflowId[0] : workflowId;
        const tags = await n8nServiceV2.getWorkflowTags(id);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(tags, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`Error fetching tags for workflow ${workflowId}:`, error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching tags for workflow ${workflowId}: ${
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
