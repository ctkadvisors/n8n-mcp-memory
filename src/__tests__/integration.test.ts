import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerN8nIntegration } from '../mcp/n8nIntegration.js';
import { n8nServiceV2 } from '../services/n8nServiceV2.js';
import { z } from 'zod';

// Mock the n8nServiceV2
jest.mock('../services/n8nServiceV2.js', () => ({
  n8nServiceV2: {
    getWorkflows: jest.fn(),
    getWorkflow: jest.fn(),
    getWorkflowTags: jest.fn(),
    getTags: jest.fn(),
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    deleteWorkflow: jest.fn(),
    activateWorkflow: jest.fn(),
    deactivateWorkflow: jest.fn(),
    transferWorkflow: jest.fn(),
    updateWorkflowTags: jest.fn(),
  },
}));

// Mock data
const mockWorkflow = {
  id: 'workflow1',
  name: 'Test Workflow',
  nodes: [],
  connections: {},
  settings: {},
};

const mockWorkflows = {
  data: [mockWorkflow],
  nextCursor: null,
};

const mockTags = [
  {
    id: 'tag1',
    name: 'Test Tag',
  },
];

const mockTagsResponse = {
  data: mockTags,
  nextCursor: null,
};

describe('Integration Test', () => {
  let server: McpServer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the n8nServiceV2 methods
    (n8nServiceV2.getWorkflows as jest.Mock).mockResolvedValue(mockWorkflows);
    (n8nServiceV2.getWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);
    (n8nServiceV2.getWorkflowTags as jest.Mock).mockResolvedValue(mockTags);
    (n8nServiceV2.getTags as jest.Mock).mockResolvedValue(mockTagsResponse);
    (n8nServiceV2.createWorkflow as jest.Mock).mockResolvedValue({ ...mockWorkflow, id: 'new-workflow-id' });
    (n8nServiceV2.updateWorkflow as jest.Mock).mockResolvedValue({ ...mockWorkflow, name: 'Updated Workflow' });
    (n8nServiceV2.deleteWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);
    (n8nServiceV2.activateWorkflow as jest.Mock).mockResolvedValue({ ...mockWorkflow, active: true });
    (n8nServiceV2.deactivateWorkflow as jest.Mock).mockResolvedValue({ ...mockWorkflow, active: false });
    (n8nServiceV2.transferWorkflow as jest.Mock).mockResolvedValue({ success: true });
    (n8nServiceV2.updateWorkflowTags as jest.Mock).mockResolvedValue(mockTags);

    // Create a real server
    server = new McpServer({
      name: 'Test Server',
      version: '1.0.0',
    });

    // Add a simple echo tool
    server.tool('echo', { message: z.string() }, async (args) => ({
      content: [{ type: 'text', text: `Echo: ${args.message}` }],
    }));

    // Register the n8n integration
    registerN8nIntegration(server);
  });

  test('should have registered all resources and tools', async () => {
    // Check resources
    const resources = await server.listResources();
    expect(resources).toContain('n8n://workflows');
    expect(resources).toContain('n8n://tags');

    // Check tools
    const tools = await server.listTools();
    expect(tools).toContain('createWorkflow');
    expect(tools).toContain('updateWorkflow');
    expect(tools).toContain('deleteWorkflow');
    expect(tools).toContain('activateWorkflow');
    expect(tools).toContain('deactivateWorkflow');
    expect(tools).toContain('transferWorkflow');
    expect(tools).toContain('updateWorkflowTags');
  });

  test('should be able to use the echo tool', async () => {
    const result = await server.useTool('echo', { message: 'Hello, world!' });
    expect(result).toEqual({
      content: [{ type: 'text', text: 'Echo: Hello, world!' }],
    });
  });

  // Add more integration tests as needed
});
