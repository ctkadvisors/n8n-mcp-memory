import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { n8nServiceV2 } from "../../services/n8nServiceV2.js";

/**
 * Register user-related resources with the MCP server
 * @param server The MCP server
 */
export function registerUserResources(server: McpServer): void {
  // GET /users - List all users
  server.resource(
    "n8nUsers",
    "n8n://users",
    {
      name: "n8n Users",
      description: "Lists all users in your n8n instance.",
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
          projectId: url.searchParams.get("projectId") || undefined,
          includeRole: url.searchParams.get("includeRole") === "true",
        };

        const users = await n8nServiceV2.getUsers(params);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(users, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Error fetching n8n users:", error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n users: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // GET /users/{id} - Get a user by ID or email
  server.resource(
    "n8nUser",
    new ResourceTemplate("n8n://users/{userIdOrEmail}", { list: undefined }),
    {
      name: "n8n User Details",
      description: "Gets details of a specific user by ID or email.",
    },
    async (uri, params) => {
      try {
        const userIdOrEmail = params.userIdOrEmail;
        const id = Array.isArray(userIdOrEmail)
          ? userIdOrEmail[0]
          : userIdOrEmail;

        // Parse query parameters from the URL
        const url = new URL(uri.href);
        const includeRole = url.searchParams.get("includeRole") === "true";

        const user = await n8nServiceV2.getUser(id, includeRole);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(user, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`Error fetching n8n user:`, error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n user: ${
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
