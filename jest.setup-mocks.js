// Mock the N8nClient
jest.mock('./src/api/n8nClient.js', () => {
  const mockFn = () => {
    const fn = jest.fn();
    fn.mockResolvedValue = jest.fn().mockReturnValue(fn);
    fn.mockRejectedValue = jest.fn().mockReturnValue(fn);
    return fn;
  };

  return {
    N8nClient: jest.fn().mockImplementation(() => {
      return {
        getWorkflows: mockFn(),
        getWorkflow: mockFn(),
        createWorkflow: mockFn(),
        updateWorkflow: mockFn(),
        deleteWorkflow: mockFn(),
        activateWorkflow: mockFn(),
        deactivateWorkflow: mockFn(),
        getWorkflowTags: mockFn(),
        updateWorkflowTags: mockFn(),
        getTags: mockFn(),
        getTag: mockFn(),
      };
    }),
  };
});

// Mock the n8nServiceV2
jest.mock('./src/services/n8nServiceV2.js');

// Mock the workflowResources
jest.mock('./src/mcp/resources/workflowResources.js');

// Mock the tagResources
jest.mock('./src/mcp/resources/tagResources.js');

// Mock the workflowTools
jest.mock('./src/mcp/tools/workflowTools.js');
