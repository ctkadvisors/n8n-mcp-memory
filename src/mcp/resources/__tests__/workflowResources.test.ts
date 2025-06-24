import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerWorkflowResources } from '../workflowResources.js';
import { n8nService } from '../../../services/n8nService.js';

// Mock the n8nService
jest.mock('../../../services/n8nService.js', () => ({
  n8nService: {
    getWorkflows: jest.fn(),
    getWorkflow: jest.fn(),
    getWorkflowTags: jest.fn(),
  },
}));

// Mock data
const mockWorkflows = {
  data: [
    {
      id: 'workflow1',
      name: 'Test Workflow',
      nodes: [],
      connections: {},
      settings: {},
    },
  ],
};

const mockWorkflow = {
  id: 'workflow1',
  name: 'Test Workflow',
  nodes: [],
  connections: {},
  settings: {},
};

const mockTags = [
  {
    id: 'tag1',
    name: 'Test Tag',
  },
];

describe('workflowResources', () => {
  let server: McpServer;
  let resourceHandlers: Map<string, any>;
  let resourceTemplates: Map<string, any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the n8nService methods
    (n8nService.getWorkflows as jest.Mock).mockResolvedValue(mockWorkflows);
    (n8nService.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);
    (n8nService.getWorkflowTags as jest.Mock).mockResolvedValue(mockTags);

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
    registerWorkflowResources(server);
  });

  test('should register workflow resources', () => {
    expect(server.resource).toHaveBeenCalledTimes(3);
    expect(resourceHandlers.has('n8nWorkflows')).toBe(true);
    expect(resourceHandlers.has('n8nWorkflow')).toBe(true);
    expect(resourceHandlers.has('n8nWorkflowTags')).toBe(true);

    expect(resourceTemplates.get('n8nWorkflows')).toBe('n8n://workflows');
    expect(resourceTemplates.get('n8nWorkflow')).toBe('n8n://workflows/{workflowId}');
    expect(resourceTemplates.get('n8nWorkflowTags')).toBe('n8n://workflows/{workflowId}/tags');
  });

  test('n8nWorkflows resource should return workflows', async () => {
    const handler = resourceHandlers.get('n8nWorkflows');
    const uri = { href: 'n8n://workflows' };

    const result = await handler(uri);

    expect(n8nService.getWorkflows).toHaveBeenCalled();
    expect(result).toEqual({
      contents: [
        {
          uri: 'n8n://workflows',
          text: JSON.stringify(mockWorkflows, null, 2),
        },
      ],
    });
  });

  test('n8nWorkflow resource should return a specific workflow', async () => {
    const handler = resourceHandlers.get('n8nWorkflow');
    const uri = { href: 'n8n://workflows/workflow1' };
    const params = { workflowId: 'workflow1' };

    const result = await handler(uri, params);

    expect(n8nService.getWorkflow).toHaveBeenCalledWith('workflow1');
    expect(result).toEqual({
      contents: [
        {
          uri: 'n8n://workflows/workflow1',
          text: JSON.stringify(mockWorkflow, null, 2),
        },
      ],
    });
  });

  test('n8nWorkflowTags resource should return workflow tags', async () => {
    const handler = resourceHandlers.get('n8nWorkflowTags');
    const uri = { href: 'n8n://workflows/workflow1/tags' };
    const params = { workflowId: 'workflow1' };

    const result = await handler(uri, params);

    expect(n8nService.getWorkflowTags).toHaveBeenCalledWith('workflow1');
    expect(result).toEqual({
      contents: [
        {
          uri: 'n8n://workflows/workflow1/tags',
          text: JSON.stringify(mockTags, null, 2),
        },
      ],
    });
  });

  test('should handle errors in n8nWorkflows resource', async () => {
    const handler = resourceHandlers.get('n8nWorkflows');
    const uri = { href: 'n8n://workflows' };
    const error = new Error('API error');

    (n8nService.getWorkflows as jest.Mock).mockRejectedValue(error);

    const result = await handler(uri);

    expect(result).toEqual({
      contents: [
        {
          uri: 'n8n://workflows',
          text: 'Error fetching n8n workflows: API error',
        },
      ],
      isError: true,
    });
  });

  test('should handle errors in n8nWorkflow resource', async () => {
    const handler = resourceHandlers.get('n8nWorkflow');
    const uri = { href: 'n8n://workflows/workflow1' };
    const params = { workflowId: 'workflow1' };
    const error = new Error('API error');

    (n8nService.getWorkflow as jest.Mock).mockRejectedValue(error);

    const result = await handler(uri, params);

    expect(result).toEqual({
      contents: [
        {
          uri: 'n8n://workflows/workflow1',
          text: 'Error fetching n8n workflow workflow1: API error',
        },
      ],
      isError: true,
    });
  });

  test('should handle errors in n8nWorkflowTags resource', async () => {
    const handler = resourceHandlers.get('n8nWorkflowTags');
    const uri = { href: 'n8n://workflows/workflow1/tags' };
    const params = { workflowId: 'workflow1' };
    const error = new Error('API error');

    (n8nService.getWorkflowTags as jest.Mock).mockRejectedValue(error);

    const result = await handler(uri, params);

    expect(result).toEqual({
      contents: [
        {
          uri: 'n8n://workflows/workflow1/tags',
          text: 'Error fetching tags for workflow workflow1: API error',
        },
      ],
      isError: true,
    });
  });
});
