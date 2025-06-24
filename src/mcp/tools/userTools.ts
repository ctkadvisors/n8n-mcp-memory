import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { n8nServiceV2 } from '../../services/n8nServiceV2.js';

// Define schemas for user-related operations
const createUsersSchema = {
  users: z.array(
    z.object({
      email: z.string().email(),
      role: z.enum(['global:admin', 'global:member']),
    })
  ),
};

const userIdSchema = {
  userIdOrEmail: z.string(),
};

const changeRoleSchema = {
  userIdOrEmail: z.string(),
  newRoleName: z.enum(['global:admin', 'global:member']),
};

/**
 * Register user-related tools with the MCP server
 * @param server The MCP server
 */
export function registerUserTools(server: McpServer): void {
  // POST /users - Create users
  server.tool(
    'createUsers',
    'Creates new users in n8n. Requires an array of user objects with email and role properties.',
    createUsersSchema,
    async (args) => {
      try {
        const { users } = args;
        const result = await n8nServiceV2.createUsers(users);
        return {
          content: [
            {
              type: 'text',
              text: `${result.length} user(s) created successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error creating users:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error creating users: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // DELETE /users/{id} - Delete a user
  server.tool(
    'deleteUser',
    'Deletes a user from n8n. Requires userIdOrEmail parameter.',
    userIdSchema,
    async (args) => {
      try {
        const { userIdOrEmail } = args;
        await n8nServiceV2.deleteUser(userIdOrEmail);
        return {
          content: [
            {
              type: 'text',
              text: `User ${userIdOrEmail} deleted successfully`,
            },
          ],
        };
      } catch (error) {
        console.error('Error deleting user:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting user: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // PATCH /users/{id}/role - Change a user's role
  server.tool(
    'changeUserRole',
    "Changes a user's role in n8n. Requires userIdOrEmail and newRoleName parameters.",
    changeRoleSchema,
    async (args) => {
      try {
        const { userIdOrEmail, newRoleName } = args;
        await n8nServiceV2.changeUserRole(userIdOrEmail, { newRoleName });
        return {
          content: [
            {
              type: 'text',
              text: `Role for user ${userIdOrEmail} changed to ${newRoleName} successfully`,
            },
          ],
        };
      } catch (error) {
        console.error('Error changing user role:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error changing user role: ${
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
