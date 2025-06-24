import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { n8nService } from '../../services/n8nService.js';
import { formatError } from '../../utils/errorHandling.js';

// Define schemas for variable-related operations
const createVariableSchema = {
  key: z.string(),
  value: z.string(),
};

const variableIdSchema = {
  variableId: z.string(),
};

/**
 * Register variable-related tools with the MCP server
 * @param server The MCP server
 */
export function registerVariableTools(server: McpServer): void {
  // POST /variables - Create a variable
  server.tool(
    'createVariable',
    'Creates a new variable in n8n. Requires key and value parameters.',
    createVariableSchema,
    async (args) => {
      try {
        const { key, value } = args;
        await n8nService.createVariable({ key, value });
        return {
          content: [
            {
              type: 'text',
              text: `Variable "${key}" created successfully`,
            },
          ],
        };
      } catch (error) {
        console.error('Error creating variable:', error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: `Error creating variable: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // DELETE /variables/{id} - Delete a variable
  server.tool(
    'deleteVariable',
    'Deletes a variable from n8n. Requires variableId parameter.',
    variableIdSchema,
    async (args) => {
      try {
        const { variableId } = args;
        await n8nService.deleteVariable(variableId);
        return {
          content: [
            {
              type: 'text',
              text: `Variable ${variableId} deleted successfully`,
            },
          ],
        };
      } catch (error) {
        console.error('Error deleting variable:', error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: `Error deleting variable: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
