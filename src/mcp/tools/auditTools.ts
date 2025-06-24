import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { n8nService } from '../../services/n8nService.js';

// Define schemas for audit operations
const auditSchema = {
  daysAbandonedWorkflow: z.number().optional(),
  categories: z
    .array(z.enum(['credentials', 'database', 'nodes', 'filesystem', 'instance']))
    .optional(),
};

/**
 * Register audit-related tools with the MCP server
 * @param server The MCP server
 */
export function registerAuditTools(server: McpServer): void {
  // POST /audit - Generate a security audit
  server.tool(
    'generateAudit',
    'Generates a security audit for n8n. Optional parameters: daysAbandonedWorkflow and categories array.',
    auditSchema,
    async (args) => {
      try {
        const { daysAbandonedWorkflow, categories } = args;
        const result = await n8nService.generateAudit({
          additionalOptions: {
            daysAbandonedWorkflow,
            categories,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: 'Security audit generated successfully',
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error generating security audit:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error generating security audit: ${
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
