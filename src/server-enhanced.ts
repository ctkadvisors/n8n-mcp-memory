/**
 * Enhanced MCP HTTP Streaming Server with n8n Integration
 * This version includes improved documentation capabilities
 */

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
  name: 'MCP HTTP Streaming Server with Enhanced n8n Documentation',
  version: '1.1.0',
});

// Add a simple greeting resource
mcpServer.resource('greeting', 'greeting://hello', async (uri: URL) => ({
  contents: [
    {
      uri: uri.href,
      text: 'Hello from MCP HTTP Streaming Server with Enhanced Documentation!',
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
      <title>Enhanced MCP HTTP Streaming Server with n8n Integration</title>
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
      <h1>Enhanced MCP HTTP Streaming Server with n8n Integration</h1>
      <p>This is an MCP HTTP Streaming server with improved documentation capabilities.</p>
      
      <h2>Key Features:</h2>
      <ul>
        <li>Complete n8n API workflow integration</li>
        <li>Enhanced documentation tools with semantic search</li>
        <li>Self-contained vector storage for documentation</li>
        <li>No dependency on external embedding APIs</li>
      </ul>

      <h2>Documentation Tools</h2>
      <table>
        <tr>
          <th>Tool Name</th>
          <th>Description</th>
        </tr>
        <tr>
          <td><span class="tool">getNodeDocumentation</span></td>
          <td>Retrieves detailed documentation for a specific n8n node</td>
        </tr>
        <tr>
          <td><span class="tool">searchNodeDocumentation</span></td>
          <td>Searches for n8n nodes based on functionality or keywords</td>
        </tr>
        <tr>
          <td><span class="tool">listNodeTypes</span></td>
          <td>Lists all available n8n node types that have documentation</td>
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
  console.log(`Enhanced MCP HTTP Streaming Server with n8n Integration listening on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for more information`);
  console.log(`Using n8n API URL: ${env.N8N_API_URL}`);
});
