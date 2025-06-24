import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTagResources } from '../tagResources.js';
import { n8nService } from '../../../services/n8nService.js';

// Mock the n8nService
jest.mock('../../../services/n8nService.js', () => ({
  n8nService: {
    getTags: jest.fn(),
  },
}));

// Mock data
const mockTags = {
  data: [
    {
      id: 'tag1',
      name: 'Test Tag',
    },
  ],
};

describe('tagResources', () => {
  let server: McpServer;
  let resourceHandlers: Map<string, any>;
  let resourceTemplates: Map<string, any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the n8nService methods
    (n8nService.getTags as jest.Mock).mockResolvedValue(mockTags);

    // Create a mock server
    server = {
      resource: jest.fn((name, uriOrTemplate, handler) => {
        if (!resourceHandlers) resourceHandlers = new Map();
        if (!resourceTemplates) resourceTemplates = new Map();

        resourceHandlers.set(name, handler);

        if (typeof uriOrTemplate === 'string') {
          resourceTemplates.set(name, uriOrTemplate);
        } else {
          resourceTemplates.set(name, uriOrTemplate.template);
        }

        return { name };
      }),
    } as unknown as McpServer;

    // Register the resources
    registerTagResources(server);
  });

  test('should register tag resources', () => {
    expect(server.resource).toHaveBeenCalledTimes(1);
    expect(resourceHandlers.has('n8nTags')).toBe(true);
    expect(resourceTemplates.get('n8nTags')).toBe('n8n://tags');
  });

  test('n8nTags resource should return tags', async () => {
    const handler = resourceHandlers.get('n8nTags');
    const uri = { href: 'n8n://tags' };

    const result = await handler(uri);

    expect(n8nService.getTags).toHaveBeenCalled();
    expect(result).toEqual({
      contents: [
        {
          uri: 'n8n://tags',
          text: JSON.stringify(mockTags, null, 2),
        },
      ],
    });
  });

  test('should handle errors in n8nTags resource', async () => {
    const handler = resourceHandlers.get('n8nTags');
    const uri = { href: 'n8n://tags' };
    const error = new Error('API error');

    (n8nService.getTags as jest.Mock).mockRejectedValue(error);

    const result = await handler(uri);

    expect(result).toEqual({
      contents: [
        {
          uri: 'n8n://tags',
          text: 'Error fetching n8n tags: API error',
        },
      ],
      isError: true,
    });
  });
});
