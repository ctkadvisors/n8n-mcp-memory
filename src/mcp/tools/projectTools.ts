import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { n8nServiceV2 } from '../../services/n8nServiceV2.js';
import { formatError } from '../../utils/errorHandling.js';

// Define schemas for project-related operations
const createProjectSchema = {
  name: z.string(),
};

const updateProjectSchema = {
  projectId: z.string(),
  name: z.string(),
};

const projectIdSchema = {
  projectId: z.string(),
};

/**
 * Register project-related tools with the MCP server
 * @param server The MCP server
 */
export function registerProjectTools(server: McpServer): void {
  // POST /projects - Create a project
  server.tool(
    'createProject',
    'Creates a new project in n8n. Requires a name parameter.',
    createProjectSchema,
    async (args) => {
      try {
        const { name } = args;
        const result = await n8nServiceV2.createProject({ name });
        return {
          content: [
            {
              type: 'text',
              text: `Project "${name}" created successfully with ID: ${result.id}`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error creating project:', error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: `Error creating project: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // PUT /projects/{id} - Update a project
  server.tool(
    'updateProject',
    'Updates an existing project in n8n. Requires projectId and name parameters.',
    updateProjectSchema,
    async (args) => {
      try {
        const { projectId, name } = args;
        await n8nServiceV2.updateProject(projectId, { name });
        return {
          content: [
            {
              type: 'text',
              text: `Project ${projectId} updated successfully`,
            },
          ],
        };
      } catch (error) {
        console.error('Error updating project:', error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: `Error updating project: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // DELETE /projects/{id} - Delete a project
  server.tool(
    'deleteProject',
    'Deletes a project from n8n. Requires projectId parameter.',
    projectIdSchema,
    async (args) => {
      try {
        const { projectId } = args;
        await n8nServiceV2.deleteProject(projectId);
        return {
          content: [
            {
              type: 'text',
              text: `Project ${projectId} deleted successfully`,
            },
          ],
        };
      } catch (error) {
        console.error('Error deleting project:', error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: `Error deleting project: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
