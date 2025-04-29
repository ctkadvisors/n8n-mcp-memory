import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { n8nServiceV2 } from "../../services/n8nServiceV2.js";

/**
 * Register variable-related resources with the MCP server
 * @param server The MCP server
 */
export function registerVariableResources(server: McpServer): void {
  // GET /variables - List all variables
  server.resource(
    "n8nVariables",
    "n8n://variables",
    {
      name: "n8n Variables",
      description: "Lists all variables in your n8n instance.",
    },
    async (uri) => {
      try {
        // Parse query parameters from the URL
        const url = new URL(uri.href);
        const params: any = {
          limit: url.searchParams.get("limit")
            ? parseInt(url.searchParams.get("limit") as string, 10)
            : undefined,
          cursor: url.searchParams.get("cursor") || undefined,
        };

        const variables = await n8nServiceV2.getVariables(params);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(variables, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Error fetching n8n variables:", error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n variables: ${
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
