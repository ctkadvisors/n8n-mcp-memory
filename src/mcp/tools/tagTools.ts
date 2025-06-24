import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { n8nService } from '../../services/n8nService.js';

// Define schemas for tag-related operations
const createTagSchema = {
  name: z.string(),
};

const updateTagSchema = {
  tagId: z.string(),
  name: z.string(),
};

const tagIdSchema = {
  tagId: z.string(),
};

/**
 * Register tag-related tools with the MCP server
 * @param server The MCP server
 */
export function registerTagTools(server: McpServer): void {
  // POST /tags - Create a tag
  server.tool(
    'createTag',
    'Creates a new tag in n8n. Requires a name parameter.',
    createTagSchema,
    async (args) => {
      try {
        const { name } = args;
        const result = await n8nService.createTag({ name });
        return {
          content: [
            {
              type: 'text',
              text: `Tag "${name}" created successfully with ID: ${result.id}`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error creating tag:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error creating tag: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // PUT /tags/{id} - Update a tag
  server.tool(
    'updateTag',
    'Updates an existing tag in n8n. Requires tagId and name parameters.',
    updateTagSchema,
    async (args) => {
      try {
        const { tagId, name } = args;
        const result = await n8nService.updateTag(tagId, { name });
        return {
          content: [
            {
              type: 'text',
              text: `Tag ${tagId} updated successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error updating tag:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error updating tag: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // DELETE /tags/{id} - Delete a tag
  server.tool(
    'deleteTag',
    'Deletes a tag from n8n. Requires tagId parameter.',
    tagIdSchema,
    async (args) => {
      try {
        const { tagId } = args;
        const result = await n8nService.deleteTag(tagId);
        return {
          content: [
            {
              type: 'text',
              text: `Tag ${tagId} deleted successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error deleting tag:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting tag: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
