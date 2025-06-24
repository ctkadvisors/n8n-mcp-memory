import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { n8nServiceV2 } from '../../services/n8nServiceV2.js';

/**
 * Register project-related resources with the MCP server
 * @param server The MCP server
 */
export function registerProjectResources(server: McpServer): void {
  // GET /projects - List all projects
  server.resource(
    'n8nProjects',
    'n8n://projects',
    {
      name: 'n8n Projects',
      description: 'Lists all projects in your n8n instance.',
    },
    async (uri) => {
      try {
        // Parse query parameters from the URL
        const url = new URL(uri.href);
        const params: any = {
          limit: url.searchParams.get('limit')
            ? parseInt(url.searchParams.get('limit') as string, 10)
            : undefined,
          cursor: url.searchParams.get('cursor') || undefined,
        };

        const projects = await n8nServiceV2.getProjects(params);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error('Error fetching n8n projects:', error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n projects: ${
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
