import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { n8nServiceV2 } from "../../services/n8nServiceV2.js";

// Define schemas for credential-related operations
const createCredentialSchema = {
  name: z.string(),
  type: z.string(),
  data: z.record(z.any()),
};

const credentialIdSchema = {
  credentialId: z.string(),
};

const transferCredentialSchema = {
  credentialId: z.string(),
  destinationProjectId: z.string(),
};

/**
 * Register credential-related tools with the MCP server
 * @param server The MCP server
 */
export function registerCredentialTools(server: McpServer): void {
  // POST /credentials - Create a credential
  server.tool(
    "createCredential",
    "Creates a new credential in n8n. Requires name, type, and data parameters.",
    createCredentialSchema,
    async (args) => {
      try {
        const { name, type, data } = args;
        const result = await n8nServiceV2.createCredential({
          name,
          type,
          data,
        });
        return {
          content: [
            {
              type: "text",
              text: `Credential "${name}" created successfully with ID: ${result.id}`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error creating credential:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error creating credential: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // DELETE /credentials/{id} - Delete a credential
  server.tool(
    "deleteCredential",
    "Deletes a credential from n8n. Requires credentialId parameter.",
    credentialIdSchema,
    async (args) => {
      try {
        const { credentialId } = args;
        const result = await n8nServiceV2.deleteCredential(credentialId);
        return {
          content: [
            {
              type: "text",
              text: `Credential "${result.name}" deleted successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error deleting credential:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error deleting credential: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // PUT /credentials/{id}/transfer - Transfer a credential
  server.tool(
    "transferCredential",
    "Transfers a credential to another project. Requires credentialId and destinationProjectId parameters.",
    transferCredentialSchema,
    async (args) => {
      try {
        const { credentialId, destinationProjectId } = args;
        await n8nServiceV2.transferCredential(credentialId, {
          destinationProjectId,
        });
        return {
          content: [
            {
              type: "text",
              text: `Credential ${credentialId} transferred to project ${destinationProjectId} successfully`,
            },
          ],
        };
      } catch (error) {
        console.error(`Error transferring credential:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error transferring credential: ${
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
