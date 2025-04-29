import { N8nClient } from '../../api/n8nClient.js';
import { N8nServiceV2 } from '../n8nServiceV2.js';
import { Workflow, Tag } from '../../types/n8n.js';

// Mock the N8nClient
jest.mock('../../api/n8nClient.js');

// Mock data
const mockWorkflow: Workflow = {
  id: 'test-workflow-id',
  name: 'Test Workflow',
  active: false,
  nodes: [
    {
      id: 'node1',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: [100, 100],
    },
  ],
  connections: {},
  settings: {
    saveExecutionProgress: true,
  },
};

const mockWorkflows = {
  data: [mockWorkflow],
  nextCursor: null,
};

const mockTags: Tag[] = [
  {
    id: 'tag1',
    name: 'Test Tag',
  },
];

const mockTagsResponse = {
  data: mockTags,
  nextCursor: null,
};

describe('N8nServiceV2', () => {
  let service: N8nServiceV2;
  let mockClient: jest.Mocked<N8nClient>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock client
    mockClient = new N8nClient('', '') as jest.Mocked<N8nClient>;
    
    // Set up the mock methods
    mockClient.getWorkflows.mockResolvedValue(mockWorkflows);
    mockClient.getWorkflow.mockResolvedValue(mockWorkflow);
    mockClient.createWorkflow.mockResolvedValue({ ...mockWorkflow, id: 'new-workflow-id' });
    mockClient.updateWorkflow.mockResolvedValue({ ...mockWorkflow, name: 'Updated Workflow' });
    mockClient.deleteWorkflow.mockResolvedValue(mockWorkflow);
    mockClient.activateWorkflow.mockResolvedValue({ ...mockWorkflow, active: true });
    mockClient.deactivateWorkflow.mockResolvedValue({ ...mockWorkflow, active: false });
    mockClient.getWorkflowTags.mockResolvedValue(mockTags);
    mockClient.updateWorkflowTags.mockResolvedValue(mockTags);
    mockClient.getTags.mockResolvedValue(mockTagsResponse);
    mockClient.getTag.mockResolvedValue(mockTags[0]);

    // Mock the constructor
    (N8nClient as jest.Mock).mockImplementation(() => mockClient);

    // Create the service
    service = new N8nServiceV2('https://n8n.example.com/api/v1', 'test-api-key');
  });

  describe('Workflow operations', () => {
    test('getWorkflows should return a list of workflows', async () => {
      const result = await service.getWorkflows();
      expect(result).toEqual(mockWorkflows);
      expect(mockClient.getWorkflows).toHaveBeenCalled();
    });

    test('getWorkflow should return a specific workflow', async () => {
      const workflowId = 'test-workflow-id';
      const result = await service.getWorkflow(workflowId);
      expect(result).toEqual(mockWorkflow);
      expect(mockClient.getWorkflow).toHaveBeenCalledWith(workflowId, undefined);
    });

    test('createWorkflow should create a new workflow', async () => {
      const newWorkflow: Workflow = {
        name: 'New Workflow',
        nodes: [],
        connections: {},
        settings: {},
      };

      const result = await service.createWorkflow(newWorkflow);
      expect(result).toHaveProperty('id', 'new-workflow-id');
      expect(mockClient.createWorkflow).toHaveBeenCalledWith(newWorkflow);
    });

    test('updateWorkflow should update an existing workflow', async () => {
      const workflowId = 'test-workflow-id';
      const updatedWorkflow: Workflow = {
        ...mockWorkflow,
        name: 'Updated Workflow',
      };

      const result = await service.updateWorkflow(workflowId, updatedWorkflow);
      expect(result).toHaveProperty('name', 'Updated Workflow');
      expect(mockClient.updateWorkflow).toHaveBeenCalledWith(workflowId, updatedWorkflow);
    });

    test('deleteWorkflow should delete a workflow', async () => {
      const workflowId = 'test-workflow-id';
      const result = await service.deleteWorkflow(workflowId);
      expect(result).toEqual(mockWorkflow);
      expect(mockClient.deleteWorkflow).toHaveBeenCalledWith(workflowId);
    });

    test('activateWorkflow should activate a workflow', async () => {
      const workflowId = 'test-workflow-id';
      const result = await service.activateWorkflow(workflowId);
      expect(result).toHaveProperty('active', true);
      expect(mockClient.activateWorkflow).toHaveBeenCalledWith(workflowId);
    });

    test('deactivateWorkflow should deactivate a workflow', async () => {
      const workflowId = 'test-workflow-id';
      const result = await service.deactivateWorkflow(workflowId);
      expect(result).toHaveProperty('active', false);
      expect(mockClient.deactivateWorkflow).toHaveBeenCalledWith(workflowId);
    });

    test('getWorkflowTags should return workflow tags', async () => {
      const workflowId = 'test-workflow-id';
      const result = await service.getWorkflowTags(workflowId);
      expect(result).toEqual(mockTags);
      expect(mockClient.getWorkflowTags).toHaveBeenCalledWith(workflowId);
    });

    test('updateWorkflowTags should update workflow tags', async () => {
      const workflowId = 'test-workflow-id';
      const tagIds = [{ id: 'tag1' }];

      const result = await service.updateWorkflowTags(workflowId, tagIds);
      expect(result).toEqual(mockTags);
      expect(mockClient.updateWorkflowTags).toHaveBeenCalledWith(workflowId, { tagIds });
    });
  });

  describe('Tag operations', () => {
    test('getTags should return a list of tags', async () => {
      const result = await service.getTags();
      expect(result).toEqual(mockTagsResponse);
      expect(mockClient.getTags).toHaveBeenCalled();
    });

    test('getTag should return a specific tag', async () => {
      const tagId = 'tag1';
      const result = await service.getTag(tagId);
      expect(result).toEqual(mockTags[0]);
      expect(mockClient.getTag).toHaveBeenCalledWith(tagId);
    });
  });

  describe('Error handling', () => {
    test('should handle client errors', async () => {
      const error = new Error('API error');
      mockClient.getWorkflows.mockRejectedValue(error);

      await expect(service.getWorkflows()).rejects.toThrow('API error');
    });
  });
});
