import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { simpleN8nService } from './services/simpleN8nService.js';
import env from './utils/env.js';

// Define schemas for workflow-related operations
const workflowSchema = {
  name: z.string(),
  nodes: z.array(z.any()),
  connections: z.any(),
  settings: z.any(),
};

const workflowIdSchema = {
  workflowId: z.string(),
};

const _tagIdsSchema = {
  tagIds: z.array(
    z.object({
      id: z.string(),
    })
  ),
};

const transferWorkflowSchema = {
  workflowId: z.string(),
  destinationProjectId: z.string(),
};

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
  server.tool('echo', { message: z.string() }, async ({ message }) => ({
    content: [{ type: 'text', text: `Echo: ${message}` }],
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

  // ==================== WORKFLOW RESOURCES ====================

  // GET /workflows - List all workflows
  server.resource('n8nWorkflows', 'n8n://workflows', async (uri) => {
    try {
      const workflows = await simpleN8nService.getWorkflows();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(workflows, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching n8n workflows:', error);
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error fetching n8n workflows: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // GET /workflows/{id} - Get a workflow by ID
  server.resource(
    'n8nWorkflow',
    new ResourceTemplate('n8n://workflows/{workflowId}', { list: undefined }),
    async (uri, { workflowId }) => {
      try {
        const workflow = await simpleN8nService.getWorkflow(workflowId);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(workflow, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`Error fetching n8n workflow ${workflowId}:`, error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching n8n workflow ${workflowId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // GET /workflows/{id}/tags - Get workflow tags
  server.resource(
    'n8nWorkflowTags',
    new ResourceTemplate('n8n://workflows/{workflowId}/tags', {
      list: undefined,
    }),
    async (uri, { workflowId }) => {
      try {
        const tags = await simpleN8nService.getWorkflowTags(workflowId);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(tags, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`Error fetching tags for workflow ${workflowId}:`, error);
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching tags for workflow ${workflowId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ==================== TAG RESOURCES ====================

  // GET /tags - List all tags
  server.resource('n8nTags', 'n8n://tags', async (uri) => {
    try {
      const tags = await simpleN8nService.getTags();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(tags, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching n8n tags:', error);
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error fetching n8n tags: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // ==================== WORKFLOW TOOLS ====================

  // POST /workflows - Create a workflow
  server.tool('createWorkflow', workflowSchema, async (args) => {
    try {
      const result = await simpleN8nService.createWorkflow(args);
      return {
        content: [
          {
            type: 'text',
            text: `Workflow created successfully: ${result.id}`,
          },
        ],
        data: result,
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error creating workflow: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // PUT /workflows/{id} - Update a workflow
  server.tool(
    'updateWorkflow',
    {
      workflowId: z.string(),
      workflowData: z.object(workflowSchema).passthrough(),
    },
    async (args) => {
      try {
        const { workflowId, workflowData } = args;
        const result = await simpleN8nService.updateWorkflow(workflowId, workflowData);
        return {
          content: [
            {
              type: 'text',
              text: `Workflow ${workflowId} updated successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error('Error updating workflow:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error updating workflow: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // DELETE /workflows/{id} - Delete a workflow
  server.tool('deleteWorkflow', workflowIdSchema, async ({ workflowId }) => {
    try {
      const result = await simpleN8nService.deleteWorkflow(workflowId);
      return {
        content: [
          {
            type: 'text',
            text: `Workflow ${workflowId} deleted successfully`,
          },
        ],
        data: result,
      };
    } catch (error) {
      console.error(`Error deleting workflow ${workflowId}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error deleting workflow ${workflowId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // POST /workflows/{id}/activate - Activate a workflow
  server.tool('activateWorkflow', workflowIdSchema, async ({ workflowId }) => {
    try {
      const result = await simpleN8nService.activateWorkflow(workflowId);
      return {
        content: [
          {
            type: 'text',
            text: `Workflow ${workflowId} activated successfully`,
          },
        ],
        data: result,
      };
    } catch (error) {
      console.error(`Error activating workflow ${workflowId}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error activating workflow ${workflowId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // POST /workflows/{id}/deactivate - Deactivate a workflow
  server.tool('deactivateWorkflow', workflowIdSchema, async ({ workflowId }) => {
    try {
      const result = await simpleN8nService.deactivateWorkflow(workflowId);
      return {
        content: [
          {
            type: 'text',
            text: `Workflow ${workflowId} deactivated successfully`,
          },
        ],
        data: result,
      };
    } catch (error) {
      console.error(`Error deactivating workflow ${workflowId}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error deactivating workflow ${workflowId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // PUT /workflows/{id}/transfer - Transfer a workflow to another project
  server.tool(
    'transferWorkflow',
    transferWorkflowSchema,
    async ({ workflowId, destinationProjectId }) => {
      try {
        const result = await simpleN8nService.transferWorkflow(workflowId, destinationProjectId);
        return {
          content: [
            {
              type: 'text',
              text: `Workflow ${workflowId} transferred to project ${destinationProjectId} successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error transferring workflow ${workflowId}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error transferring workflow ${workflowId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // PUT /workflows/{id}/tags - Update workflow tags
  server.tool(
    'updateWorkflowTags',
    z.object({
      workflowId: z.string(),
      tagIds: z.array(z.object({ id: z.string() })),
    }),
    async ({ workflowId, tagIds }) => {
      try {
        const result = await simpleN8nService.updateWorkflowTags(workflowId, tagIds);
        return {
          content: [
            {
              type: 'text',
              text: `Tags for workflow ${workflowId} updated successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error updating tags for workflow ${workflowId}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error updating tags for workflow ${workflowId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
        console.log(`Session ${transport.sessionId} closed`);
      }
    };

    // Create and connect to the MCP server
    const server = createServer();
    await server.connect(transport);

    console.log('New MCP server created and connected');
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP HTTP Streaming Server with n8n Integration listening on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for more information`);
  console.log(`Using n8n API URL: ${env.N8N_API_URL}`);
});
