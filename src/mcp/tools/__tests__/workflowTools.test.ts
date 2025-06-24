import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerWorkflowTools } from '../workflowTools.js';
import { n8nService } from '../../../services/n8nService.js';

// Mock the n8nService
jest.mock('../../../services/n8nService.js', () => ({
  n8nService: {
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

const mockTags = [
  {
    id: 'tag1',
    name: 'Test Tag',
  },
];

describe('workflowTools', () => {
  let server: McpServer;
  let toolHandlers: Map<string, any>;
  let toolSchemas: Map<string, any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the n8nService methods
    (n8nService.createWorkflow as jest.Mock).mockResolvedValue({
      ...mockWorkflow,
      id: 'new-workflow-id',
    });
    (n8nService.updateWorkflow as jest.Mock).mockResolvedValue({
      ...mockWorkflow,
      name: 'Updated Workflow',
    });
    (n8nService.deleteWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);
    (n8nService.activateWorkflow as jest.Mock).mockResolvedValue({ ...mockWorkflow, active: true });
    (n8nService.deactivateWorkflow as jest.Mock).mockResolvedValue({
      ...mockWorkflow,
      active: false,
    });
    (n8nService.transferWorkflow as jest.Mock).mockResolvedValue({ success: true });
    (n8nService.updateWorkflowTags as jest.Mock).mockResolvedValue(mockTags);

    // Create a mock server
    server = {
      tool: jest.fn((name, schema, handler) => {
        if (!toolHandlers) toolHandlers = new Map();
        if (!toolSchemas) toolSchemas = new Map();

        toolHandlers.set(name, handler);
        toolSchemas.set(name, schema);

        return { name };
      }),
    } as unknown as McpServer;

    // Register the tools
    registerWorkflowTools(server);
  });

  test('should register workflow tools', () => {
    expect(server.tool).toHaveBeenCalledTimes(7);
    expect(toolHandlers.has('createWorkflow')).toBe(true);
    expect(toolHandlers.has('updateWorkflow')).toBe(true);
    expect(toolHandlers.has('deleteWorkflow')).toBe(true);
    expect(toolHandlers.has('activateWorkflow')).toBe(true);
    expect(toolHandlers.has('deactivateWorkflow')).toBe(true);
    expect(toolHandlers.has('transferWorkflow')).toBe(true);
    expect(toolHandlers.has('updateWorkflowTags')).toBe(true);
  });

  test('createWorkflow tool should create a workflow', async () => {
    const handler = toolHandlers.get('createWorkflow');
    const args = {
      name: 'New Workflow',
      nodes: [],
      connections: {},
      settings: {},
    };

    const result = await handler(args);

    expect(n8nService.createWorkflow).toHaveBeenCalledWith(args);
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Workflow created successfully: new-workflow-id',
        },
      ],
      data: { ...mockWorkflow, id: 'new-workflow-id' },
    });
  });

  test('updateWorkflow tool should update a workflow', async () => {
    const handler = toolHandlers.get('updateWorkflow');
    const args = {
      workflowId: 'workflow1',
      workflowData: {
        name: 'Updated Workflow',
        nodes: [],
        connections: {},
        settings: {},
      },
    };

    const result = await handler(args);

    expect(n8nService.updateWorkflow).toHaveBeenCalledWith('workflow1', args.workflowData);
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Workflow workflow1 updated successfully',
        },
      ],
      data: { ...mockWorkflow, name: 'Updated Workflow' },
    });
  });

  test('deleteWorkflow tool should delete a workflow', async () => {
    const handler = toolHandlers.get('deleteWorkflow');
    const args = {
      workflowId: 'workflow1',
    };

    const result = await handler(args);

    expect(n8nService.deleteWorkflow).toHaveBeenCalledWith('workflow1');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Workflow workflow1 deleted successfully',
        },
      ],
      data: mockWorkflow,
    });
  });

  test('activateWorkflow tool should activate a workflow', async () => {
    const handler = toolHandlers.get('activateWorkflow');
    const args = {
      workflowId: 'workflow1',
    };

    const result = await handler(args);

    expect(n8nService.activateWorkflow).toHaveBeenCalledWith('workflow1');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Workflow workflow1 activated successfully',
        },
      ],
      data: { ...mockWorkflow, active: true },
    });
  });

  test('deactivateWorkflow tool should deactivate a workflow', async () => {
    const handler = toolHandlers.get('deactivateWorkflow');
    const args = {
      workflowId: 'workflow1',
    };

    const result = await handler(args);

    expect(n8nService.deactivateWorkflow).toHaveBeenCalledWith('workflow1');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Workflow workflow1 deactivated successfully',
        },
      ],
      data: { ...mockWorkflow, active: false },
    });
  });

  test('transferWorkflow tool should transfer a workflow', async () => {
    const handler = toolHandlers.get('transferWorkflow');
    const args = {
      workflowId: 'workflow1',
      destinationProjectId: 'project1',
    };

    const result = await handler(args);

    expect(n8nService.transferWorkflow).toHaveBeenCalledWith('workflow1', 'project1');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Workflow workflow1 transferred to project project1 successfully',
        },
      ],
      data: { success: true },
    });
  });

  test('updateWorkflowTags tool should update workflow tags', async () => {
    const handler = toolHandlers.get('updateWorkflowTags');
    const args = {
      workflowId: 'workflow1',
      tagIds: [{ id: 'tag1' }],
    };

    const result = await handler(args);

    expect(n8nService.updateWorkflowTags).toHaveBeenCalledWith('workflow1', args.tagIds);
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Tags for workflow workflow1 updated successfully',
        },
      ],
      data: mockTags,
    });
  });

  test('should handle errors in createWorkflow tool', async () => {
    const handler = toolHandlers.get('createWorkflow');
    const args = {
      name: 'New Workflow',
      nodes: [],
      connections: {},
      settings: {},
    };
    const error = new Error('API error');

    (n8nService.createWorkflow as jest.Mock).mockRejectedValue(error);

    const result = await handler(args);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error creating workflow: API error',
        },
      ],
      isError: true,
    });
  });
});
