import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { n8nService } from '../../services/n8nService.js';

/**
 * Register tag-related resources with the MCP server
 * @param server The MCP server
 */
export function registerTagResources(server: McpServer): void {
  // GET /tags - List all tags
  server.resource(
    'n8nTags',
    'n8n://tags',
    {
      name: 'n8n Tags',
      description: 'Lists all tags in your n8n instance.',
    },
    async (uri) => {
      try {
        const tags = await n8nService.getTags();
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(tags, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error('Error fetching n8n tags:', error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n tags: ${
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
