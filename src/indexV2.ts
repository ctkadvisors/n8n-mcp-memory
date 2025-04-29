import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { _isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import env from './utils/env.js';
import { registerN8nIntegration } from './mcp/n8nIntegration.js';

// Create Express app
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Create a new MCP server instance
const createServer = () => {
  const server = new McpServer({
    name: 'MCP HTTP Streaming Example with n8n Integration',
    version: '1.0.0',
  });

  // Add a simple echo tool
  server.tool('echo', { message: z.string() }, async (args) => ({
    content: [{ type: 'text', text: `Echo: ${args.message}` }],
  }));

  // Add a simple greeting resource
  server.resource('greeting', 'greeting://hello', async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: 'Hello from MCP HTTP Streaming Server!',
      },
    ],
  }));

  // Register n8n integration
  registerN8nIntegration(server);

  return server;
};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = (req.headers['x-session-id'] as string) || randomUUID();

  // Get or create a transport for this session
  let transport = transports[sessionId];
  if (!transport) {
    transport = new StreamableHTTPServerTransport();
    transports[sessionId] = transport;

    // Create a new server instance for this session
    const server = createServer();

    // Connect the server to the transport
    await server.connect(transport);
  }

  // Handle the request
  const response = await transport.handleRequest(req.body);

  // Set the session ID header
  res.setHeader('X-Session-Id', sessionId);

  // Send the response
  res.json(response);
});

// Handle GET requests for streaming responses
app.get('/mcp', async (req, res) => {
  // Get the session ID
  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId || !transports[sessionId]) {
    return res.status(400).json({ error: 'Invalid or missing session ID' });
  }

  // Get the transport for this session
  const transport = transports[sessionId];

  // Set up streaming response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Handle streaming
  const cleanup = transport.handleStream(
    // Write function
    (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
    // End function
    () => {
      res.end();
    }
  );

  // Handle client disconnect
  req.on('close', cleanup);
});

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

// Add a simple HTML page for testing
app.get('/', (req, res) => {
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
        <li>An <code>echo</code> tool that echoes back a message</li>
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
      </table>

      <h2>n8n Tools</h2>
      <table>
        <tr>
          <th>Tool Name</th>
          <th>Description</th>
          <th>n8n API Endpoint</th>
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
      </table>

      <p>To interact with this server, you need an MCP client. The server is available at:</p>
      <pre>http://localhost:3000/mcp</pre>
    </body>
    </html>
  `);
});

// Helper function to handle session requests
async function handleSessionRequest(req: express.Request, res: express.Response) {
  // Get the session ID
  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId || !transports[sessionId]) {
    return res.status(400).json({ error: 'Invalid or missing session ID' });
  }

  // Clean up the transport
  const transport = transports[sessionId];
  delete transports[sessionId];

  // Close the transport
  await transport.close();

  // Send a success response
  res.json({ success: true });
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP HTTP Streaming Server with n8n Integration listening on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for more information`);
  console.log(`Using n8n API URL: ${env.N8N_API_URL}`);
});
