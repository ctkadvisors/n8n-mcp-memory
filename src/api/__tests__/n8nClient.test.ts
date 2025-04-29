import nock from 'nock';
import { N8nClient } from '../n8nClient.js';
import { Workflow, Tag } from '../../types/n8n.js';

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

describe('N8nClient', () => {
  const baseURL = 'https://n8n.example.com/api/v1';
  const apiKey = 'test-api-key';
  let client: N8nClient;

  beforeEach(() => {
    client = new N8nClient(baseURL, apiKey);
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  describe('Workflow operations', () => {
    test('getWorkflows should return a list of workflows', async () => {
      nock(baseURL)
        .get('/workflows')
        .reply(200, mockWorkflows);

      const result = await client.getWorkflows();
      expect(result).toEqual(mockWorkflows);
    });

    test('getWorkflow should return a specific workflow', async () => {
      const workflowId = 'test-workflow-id';
      nock(baseURL)
        .get(`/workflows/${workflowId}`)
        .reply(200, mockWorkflow);

      const result = await client.getWorkflow(workflowId);
      expect(result).toEqual(mockWorkflow);
    });

    test('createWorkflow should create a new workflow', async () => {
      const newWorkflow: Workflow = {
        name: 'New Workflow',
        nodes: [],
        connections: {},
        settings: {},
      };

      nock(baseURL)
        .post('/workflows', newWorkflow)
        .reply(200, { ...newWorkflow, id: 'new-workflow-id' });

      const result = await client.createWorkflow(newWorkflow);
      expect(result).toHaveProperty('id', 'new-workflow-id');
    });

    test('updateWorkflow should update an existing workflow', async () => {
      const workflowId = 'test-workflow-id';
      const updatedWorkflow: Workflow = {
        ...mockWorkflow,
        name: 'Updated Workflow',
      };

      nock(baseURL)
        .put(`/workflows/${workflowId}`, updatedWorkflow)
        .reply(200, updatedWorkflow);

      const result = await client.updateWorkflow(workflowId, updatedWorkflow);
      expect(result).toEqual(updatedWorkflow);
    });

    test('deleteWorkflow should delete a workflow', async () => {
      const workflowId = 'test-workflow-id';
      nock(baseURL)
        .delete(`/workflows/${workflowId}`)
        .reply(200, mockWorkflow);

      const result = await client.deleteWorkflow(workflowId);
      expect(result).toEqual(mockWorkflow);
    });

    test('activateWorkflow should activate a workflow', async () => {
      const workflowId = 'test-workflow-id';
      const activatedWorkflow = { ...mockWorkflow, active: true };

      nock(baseURL)
        .post(`/workflows/${workflowId}/activate`)
        .reply(200, activatedWorkflow);

      const result = await client.activateWorkflow(workflowId);
      expect(result).toHaveProperty('active', true);
    });

    test('deactivateWorkflow should deactivate a workflow', async () => {
      const workflowId = 'test-workflow-id';
      const deactivatedWorkflow = { ...mockWorkflow, active: false };

      nock(baseURL)
        .post(`/workflows/${workflowId}/deactivate`)
        .reply(200, deactivatedWorkflow);

      const result = await client.deactivateWorkflow(workflowId);
      expect(result).toHaveProperty('active', false);
    });

    test('getWorkflowTags should return workflow tags', async () => {
      const workflowId = 'test-workflow-id';
      nock(baseURL)
        .get(`/workflows/${workflowId}/tags`)
        .reply(200, mockTags);

      const result = await client.getWorkflowTags(workflowId);
      expect(result).toEqual(mockTags);
    });

    test('updateWorkflowTags should update workflow tags', async () => {
      const workflowId = 'test-workflow-id';
      const tagIds = [{ id: 'tag1' }];

      nock(baseURL)
        .put(`/workflows/${workflowId}/tags`, { tagIds })
        .reply(200, mockTags);

      const result = await client.updateWorkflowTags(workflowId, { tagIds });
      expect(result).toEqual(mockTags);
    });
  });

  describe('Tag operations', () => {
    test('getTags should return a list of tags', async () => {
      nock(baseURL)
        .get('/tags')
        .reply(200, mockTagsResponse);

      const result = await client.getTags();
      expect(result).toEqual(mockTagsResponse);
    });

    test('getTag should return a specific tag', async () => {
      const tagId = 'tag1';
      nock(baseURL)
        .get(`/tags/${tagId}`)
        .reply(200, mockTags[0]);

      const result = await client.getTag(tagId);
      expect(result).toEqual(mockTags[0]);
    });
  });

  describe('Error handling', () => {
    test('should handle API errors', async () => {
      nock(baseURL)
        .get('/workflows')
        .reply(401, { message: 'Unauthorized' });

      await expect(client.getWorkflows()).rejects.toMatchObject({
        status: 401,
      });
    });
  });
});
