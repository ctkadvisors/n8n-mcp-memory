import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerN8nIntegration } from '../n8nIntegration.js';
import { registerWorkflowResources } from '../resources/workflowResources.js';
import { registerTagResources } from '../resources/tagResources.js';
import { registerWorkflowTools } from '../tools/workflowTools.js';

// Mock the resource and tool registration functions
jest.mock('../resources/workflowResources.js', () => ({
  registerWorkflowResources: jest.fn(),
}));

jest.mock('../resources/tagResources.js', () => ({
  registerTagResources: jest.fn(),
}));

jest.mock('../tools/workflowTools.js', () => ({
  registerWorkflowTools: jest.fn(),
}));

describe('n8nIntegration', () => {
  let server: McpServer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock server
    server = {} as McpServer;

    // Register the integration
    registerN8nIntegration(server);
  });

  test('should register all resources and tools', () => {
    expect(registerWorkflowResources).toHaveBeenCalledWith(server);
    expect(registerTagResources).toHaveBeenCalledWith(server);
    expect(registerWorkflowTools).toHaveBeenCalledWith(server);
  });
});
