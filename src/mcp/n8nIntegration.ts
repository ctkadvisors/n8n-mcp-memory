import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerWorkflowResources } from './resources/workflowResources.js';
import { registerTagResources } from './resources/tagResources.js';
import { registerExecutionResources } from './resources/executionResources.js';
import { registerCredentialResources } from './resources/credentialResources.js';
import { registerUserResources } from './resources/userResources.js';
import { registerProjectResources } from './resources/projectResources.js';
import { registerVariableResources } from './resources/variableResources.js';
import { registerWorkflowTools } from './tools/workflowTools.js';
import { registerExecutionTools } from './tools/executionTools.js';
import { registerCredentialTools } from './tools/credentialTools.js';
import { registerUserTools } from './tools/userTools.js';
import { registerProjectTools } from './tools/projectTools.js';
import { registerVariableTools } from './tools/variableTools.js';
import { registerTagTools } from './tools/tagTools.js';
import { registerSourceControlTools } from './tools/sourceControlTools.js';
import { registerAuditTools } from './tools/auditTools.js';
import { registerDocumentationTools } from './tools/documentationTools.js';

/**
 * Register all n8n API resources and tools with the MCP server
 * @param server The MCP server
 */
export function registerN8nIntegration(server: McpServer): void {
  // Register resources
  registerWorkflowResources(server);
  registerTagResources(server);
  registerExecutionResources(server);
  registerCredentialResources(server);
  registerUserResources(server);
  registerProjectResources(server);
  registerVariableResources(server);

  // Register tools
  registerWorkflowTools(server);
  registerExecutionTools(server);
  registerCredentialTools(server);
  registerUserTools(server);
  registerProjectTools(server);
  registerVariableTools(server);
  registerTagTools(server);
  registerSourceControlTools(server);
  registerAuditTools(server);
  registerDocumentationTools(server);
}
