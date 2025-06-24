import { Router, Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OpenAPIGenerator } from './generator.js';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';

/**
 * Create OpenAPI routes for the MCP server
 */
export function createOpenAPIRoutes(mcpServer: McpServer, baseUrl?: string): Router {
  const router = Router();
  const generator = new OpenAPIGenerator(mcpServer, baseUrl);

  // Generate the OpenAPI specification
  const openApiSpec = generator.generateSpec();

  // Serve the OpenAPI specification as JSON
  router.get('/openapi.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    res.json(openApiSpec);
  });

  // Serve the OpenAPI specification as YAML
  router.get('/openapi.yaml', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/x-yaml');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    try {
      const yamlContent = yaml.dump(openApiSpec, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
      });
      res.send(yamlContent);
    } catch (error) {
      console.error('Error converting OpenAPI spec to YAML:', error);
      res.status(500).json({ error: 'Failed to generate YAML specification' });
    }
  });

  // Serve Swagger UI documentation
  router.use('/docs', swaggerUi.serve);
  router.get(
    '/docs',
    swaggerUi.setup(openApiSpec, {
      customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #3b4151; }
      .swagger-ui .scheme-container { background: #f7f7f7; padding: 15px; }
    `,
      customSiteTitle: 'MCP Server API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
      },
    })
  );

  // API endpoint to get server capabilities
  router.get('/capabilities', (req: Request, res: Response) => {
    res.json({
      server: {
        name: 'MCP Server with n8n Integration',
        version: '1.0.0',
      },
      capabilities: {
        tools: true,
        resources: true,
        prompts: false,
        logging: false,
        sampling: false,
      },
      endpoints: {
        mcp: '/mcp',
        openapi: '/openapi.json',
        docs: '/docs',
        tools: '/tools',
        resources: '/resources',
      },
    });
  });

  // Health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  return router;
}

/**
 * Create REST API routes for MCP tools and resources
 */
export function createRestAPIRoutes(mcpServer: McpServer): Router {
  const router = Router();

  // Tools endpoint - execute MCP tools via REST
  router.post('/tools/:toolName', async (req: Request, res: Response) => {
    try {
      const { toolName } = req.params;
      const params = req.body;

      // This is a simplified implementation - in a real scenario,
      // you would need to properly invoke the MCP tool
      console.log(`Executing tool: ${toolName} with params:`, params);

      // For now, return a placeholder response
      res.json({
        tool: toolName,
        status: 'executed',
        result: {
          content: [
            {
              type: 'text',
              text: `Tool ${toolName} executed successfully`,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error executing tool:', error);
      res.status(500).json({
        error: 'Tool execution failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Resources endpoint - get MCP resources via REST
  router.get('/resources/:resourceName', async (req: Request, res: Response) => {
    try {
      const { resourceName } = req.params;
      const query = req.query;

      // This is a simplified implementation - in a real scenario,
      // you would need to properly invoke the MCP resource
      console.log(`Getting resource: ${resourceName} with query:`, query);

      // For now, return a placeholder response
      res.json({
        resource: resourceName,
        uri: `n8n://${resourceName}`,
        contents: [
          {
            uri: `n8n://${resourceName}`,
            text: `Resource ${resourceName} data`,
            mimeType: 'application/json',
          },
        ],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting resource:', error);
      res.status(500).json({
        error: 'Resource retrieval failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // List available tools
  router.get('/tools', (req: Request, res: Response) => {
    // This would normally introspect the MCP server for available tools
    const tools = [
      'listWorkflows',
      'getWorkflowDetails',
      'createWorkflow',
      'updateWorkflow',
      'deleteWorkflow',
      'executeWorkflow',
      'listExecutions',
      'getExecutionDetails',
      'deleteExecution',
      'createCredential',
      'deleteCredential',
      'transferCredential',
      'createUsers',
      'deleteUser',
      'changeUserRole',
      'createProject',
      'updateProject',
      'deleteProject',
      'createVariable',
      'deleteVariable',
      'createTag',
      'updateTag',
      'deleteTag',
      'pullFromSourceControl',
      'generateAudit',
    ];

    res.json({
      tools: tools.map((name) => ({
        name,
        endpoint: `/tools/${name}`,
        method: 'POST',
      })),
    });
  });

  // List available resources
  router.get('/resources', (req: Request, res: Response) => {
    const resources = [
      'workflows',
      'executions',
      'tags',
      'users',
      'projects',
      'variables',
      'credentials',
    ];

    res.json({
      resources: resources.map((name) => ({
        name,
        endpoint: `/resources/${name}`,
        method: 'GET',
        uri: `n8n://${name}`,
      })),
    });
  });

  return router;
}
