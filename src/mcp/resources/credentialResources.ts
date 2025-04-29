import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { n8nServiceV2 } from "../../services/n8nServiceV2.js";

/**
 * Register credential-related resources with the MCP server
 * @param server The MCP server
 */
export function registerCredentialResources(server: McpServer): void {
  // GET /credentials/schema/{credentialTypeName} - Get credential schema
  server.resource(
    "n8nCredentialSchema",
    new ResourceTemplate("n8n://credentials/schema/{credentialTypeName}", {
      list: undefined,
    }),
    {
      name: "n8n Credential Schema",
      description: "Gets the schema for a specific credential type.",
    },
    async (uri, params) => {
      try {
        const credentialTypeName = params.credentialTypeName;
        const typeName = Array.isArray(credentialTypeName)
          ? credentialTypeName[0]
          : credentialTypeName;

        const schema = await n8nServiceV2.getCredentialSchema(typeName);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(schema, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`Error fetching credential schema:`, error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching credential schema: ${
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
