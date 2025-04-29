import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import env from './utils/env.js';
import { registerN8nIntegration } from './mcp/n8nIntegration.js';

// Create Express app
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Create a new MCP server instance
const mcpServer = new McpServer({
  name: 'MCP HTTP Streaming Example with n8n Integration',
  version: '1.0.0',
});

// Add a simple greeting resource
mcpServer.resource('greeting', 'greeting://hello', async (uri: URL) => ({
  contents: [
    {
      uri: uri.href,
      text: 'Hello from MCP HTTP Streaming Server!',
    },
  ],
}));

// Register n8n integration
registerN8nIntegration(mcpServer);

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  try {
    console.log('Received request:', req.body);

    // Handle ping requests specially (for health checks)
    if (req.body && req.body.method === 'ping') {
      console.log('Received ping request, responding with pong');
      res.json({
        jsonrpc: '2.0',
        result: { pong: true },
        id: req.body.id,
      });
      return;
    }

    // IMPORTANT: We're using a fixed session ID for all requests
    // This is a workaround for the session ID issue
    const sessionId = 'fixed-session-id-for-all-requests';
    console.log('Using fixed session ID for all requests:', sessionId);

    // Add the session ID to the response headers so the client can use it
    res.setHeader('Mcp-Session-Id', sessionId);

    // Log all headers for debugging
    console.log('Request headers:', req.headers);
    console.log('Session ID being used:', sessionId);

    console.log('Using Session ID:', sessionId);

    // Check if this is an initialization request
    const isInitRequest = isInitializeRequest(req.body);

    // Always create a new transport for initialization requests
    if (isInitRequest) {
      console.log('Received initialization request for session:', sessionId);

      // If we already have a transport for this session, close it
      if (transports[sessionId]) {
        console.log('Closing existing transport for session:', sessionId);
        await transports[sessionId].close();
        delete transports[sessionId];
      }
    }

    // For non-init requests, if we don't have a transport, create one anyway
    // This is more lenient and helps with session handling issues
    if (!transports[sessionId]) {
      console.log('Creating new transport for session:', sessionId);
    }

    // Get or create a transport for this session
    let transport = transports[sessionId];
    if (!transport) {
      console.log('Creating new transport for session:', sessionId);

      // Create a transport in stateless mode (no session ID validation)
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      // Store the transport for future requests
      transports[sessionId] = transport;

      // Connect the transport to the MCP server
      console.log('Connecting server to transport');
      await mcpServer.connect(transport);
      console.log('Server connected to transport');
    }

    // Always set these headers in the response
    res.setHeader('X-Session-Id', sessionId);
    res.setHeader('Mcp-Session-Id', sessionId);

    // Handle the request
    console.log('Handling request');
    await transport.handleRequest(req, res, req.body);
    console.log('Request handled');
  } catch (error) {
    console.error('Error handling request:', error);

    // Ensure we return a properly formatted JSON-RPC error response
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32603, // Internal JSON-RPC error
        message: `Internal error: ${errorMessage}`,
      },
      id: req.body?.id || null,
    };

    res.status(500).json(errorResponse);
  }
});

// Add a simple HTML page for testing
app.get('/', (_, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MCP HTTP Streaming Example with n8n Integration</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        h3 { color: #888; margin-top: 20px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
        .endpoint { font-weight: bold; }
        .method { display: inline-block; width: 70px; font-weight: bold; color: #0066cc; }
        .tool { color: #009900; font-weight: bold; }
        .resource { color: #990000; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h1>MCP HTTP Streaming Example Server with n8n Integration</h1>
      <p>This is an MCP HTTP Streaming server example with complete n8n API workflow integration. The server exposes:</p>

      <h2>Basic Resources</h2>
      <ul>
        <li>A <code>greeting</code> resource that provides a welcome message</li>
      </ul>

      <h2>n8n Resources</h2>
      <table>
        <tr>
          <th>Resource URI</th>
          <th>Description</th>
          <th>n8n API Endpoint</th>
        </tr>
        <tr>
          <td><span class="resource">n8n://workflows</span></td>
          <td>Lists all n8n workflows</td>
          <td><span class="method">GET</span> /workflows</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://workflows/{workflowId}</span></td>
          <td>Gets a specific n8n workflow by ID</td>
          <td><span class="method">GET</span> /workflows/{id}</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://workflows/{workflowId}/tags</span></td>
          <td>Gets tags for a specific workflow</td>
          <td><span class="method">GET</span> /workflows/{id}/tags</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://tags</span></td>
          <td>Lists all n8n tags</td>
          <td><span class="method">GET</span> /tags</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://executions</span></td>
          <td>Lists all n8n executions</td>
          <td><span class="method">GET</span> /executions</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://executions/{executionId}</span></td>
          <td>Gets a specific n8n execution by ID</td>
          <td><span class="method">GET</span> /executions/{id}</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://credentials/schema/{credentialTypeName}</span></td>
          <td>Gets the schema for a specific credential type</td>
          <td><span class="method">GET</span> /credentials/schema/{credentialTypeName}</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://users</span></td>
          <td>Lists all n8n users</td>
          <td><span class="method">GET</span> /users</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://users/{userIdOrEmail}</span></td>
          <td>Gets a specific n8n user by ID or email</td>
          <td><span class="method">GET</span> /users/{id}</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://projects</span></td>
          <td>Lists all n8n projects</td>
          <td><span class="method">GET</span> /projects</td>
        </tr>
        <tr>
          <td><span class="resource">n8n://variables</span></td>
          <td>Lists all n8n variables</td>
          <td><span class="method">GET</span> /variables</td>
        </tr>
      </table>

      <h2>n8n Tools</h2>
      <table>
        <tr>
          <th>Tool Name</th>
          <th>Description</th>
          <th>n8n API Endpoint</th>
        </tr>
        <tr>
          <td><span class="tool">listWorkflows</span></td>
          <td>Lists all workflows</td>
          <td><span class="method">GET</span> /workflows</td>
        </tr>
        <tr>
          <td><span class="tool">getWorkflowDetails</span></td>
          <td>Gets detailed information about a specific workflow</td>
          <td><span class="method">GET</span> /workflows/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">createWorkflow</span></td>
          <td>Creates a new workflow</td>
          <td><span class="method">POST</span> /workflows</td>
        </tr>
        <tr>
          <td><span class="tool">updateWorkflow</span></td>
          <td>Updates an existing workflow</td>
          <td><span class="method">PUT</span> /workflows/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">deleteWorkflow</span></td>
          <td>Deletes a workflow</td>
          <td><span class="method">DELETE</span> /workflows/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">activateWorkflow</span></td>
          <td>Activates a workflow</td>
          <td><span class="method">POST</span> /workflows/{id}/activate</td>
        </tr>
        <tr>
          <td><span class="tool">deactivateWorkflow</span></td>
          <td>Deactivates a workflow</td>
          <td><span class="method">POST</span> /workflows/{id}/deactivate</td>
        </tr>
        <tr>
          <td><span class="tool">transferWorkflow</span></td>
          <td>Transfers a workflow to another project</td>
          <td><span class="method">PUT</span> /workflows/{id}/transfer</td>
        </tr>
        <tr>
          <td><span class="tool">updateWorkflowTags</span></td>
          <td>Updates tags for a workflow</td>
          <td><span class="method">PUT</span> /workflows/{id}/tags</td>
        </tr>
        <tr>
          <td><span class="tool">executeWorkflow</span></td>
          <td>Executes a workflow</td>
          <td><span class="method">POST</span> /workflows/{id}/execute</td>
        </tr>
        <tr>
          <td><span class="tool">deleteExecution</span></td>
          <td>Deletes an execution</td>
          <td><span class="method">DELETE</span> /executions/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">createCredential</span></td>
          <td>Creates a new credential</td>
          <td><span class="method">POST</span> /credentials</td>
        </tr>
        <tr>
          <td><span class="tool">deleteCredential</span></td>
          <td>Deletes a credential</td>
          <td><span class="method">DELETE</span> /credentials/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">transferCredential</span></td>
          <td>Transfers a credential to another project</td>
          <td><span class="method">PUT</span> /credentials/{id}/transfer</td>
        </tr>
        <tr>
          <td><span class="tool">createUsers</span></td>
          <td>Creates new users</td>
          <td><span class="method">POST</span> /users</td>
        </tr>
        <tr>
          <td><span class="tool">deleteUser</span></td>
          <td>Deletes a user</td>
          <td><span class="method">DELETE</span> /users/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">changeUserRole</span></td>
          <td>Changes a user's role</td>
          <td><span class="method">PATCH</span> /users/{id}/role</td>
        </tr>
        <tr>
          <td><span class="tool">createProject</span></td>
          <td>Creates a new project</td>
          <td><span class="method">POST</span> /projects</td>
        </tr>
        <tr>
          <td><span class="tool">updateProject</span></td>
          <td>Updates a project</td>
          <td><span class="method">PUT</span> /projects/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">deleteProject</span></td>
          <td>Deletes a project</td>
          <td><span class="method">DELETE</span> /projects/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">createVariable</span></td>
          <td>Creates a new variable</td>
          <td><span class="method">POST</span> /variables</td>
        </tr>
        <tr>
          <td><span class="tool">deleteVariable</span></td>
          <td>Deletes a variable</td>
          <td><span class="method">DELETE</span> /variables/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">createTag</span></td>
          <td>Creates a new tag</td>
          <td><span class="method">POST</span> /tags</td>
        </tr>
        <tr>
          <td><span class="tool">updateTag</span></td>
          <td>Updates a tag</td>
          <td><span class="method">PUT</span> /tags/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">deleteTag</span></td>
          <td>Deletes a tag</td>
          <td><span class="method">DELETE</span> /tags/{id}</td>
        </tr>
        <tr>
          <td><span class="tool">pullFromSourceControl</span></td>
          <td>Pulls changes from the remote repository</td>
          <td><span class="method">POST</span> /source-control/pull</td>
        </tr>
        <tr>
          <td><span class="tool">generateAudit</span></td>
          <td>Generates a security audit</td>
          <td><span class="method">POST</span> /audit</td>
        </tr>
      </table>

      <p>To interact with this server, you need an MCP client. The server is available at:</p>
      <pre>http://localhost:3000/mcp</pre>
    </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP HTTP Streaming Server with n8n Integration listening on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for more information`);
  console.log(`Using n8n API URL: ${env.N8N_API_URL}`);
});
