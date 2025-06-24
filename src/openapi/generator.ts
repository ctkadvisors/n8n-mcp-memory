import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod';

/**
 * Interface for MCP tool information
 */
interface McpToolInfo {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
}

/**
 * Interface for MCP resource information
 */
interface McpResourceInfo {
  name: string;
  uriTemplate: string;
  description?: string;
}

/**
 * Generates OpenAPI 3.1.0 specification from MCP server capabilities
 */
export class OpenAPIGenerator {
  private server: McpServer;
  private baseUrl: string;
  private version: string;

  constructor(
    server: McpServer,
    baseUrl: string = 'http://localhost:3000',
    version: string = '1.0.0'
  ) {
    this.server = server;
    this.baseUrl = baseUrl;
    this.version = version;
  }

  /**
   * Generate the complete OpenAPI specification
   */
  public generateSpec(): OpenAPIV3_1.Document {
    const tools = this.extractTools();
    const resources = this.extractResources();

    const spec: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'n8n MCP Memory Server API',
        description:
          'Model Context Protocol Server with n8n Integration and Advanced Documentation Service - The primary value-add is the DocumentationService which provides semantic search and caching of n8n node documentation',
        version: this.version,
        contact: {
          name: 'CTK Advisors',
          email: 'support@ctkadvisors.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: this.baseUrl,
          description: 'MCP Server',
        },
      ],
      paths: {
        '/mcp': {
          post: {
            summary: 'MCP JSON-RPC Endpoint',
            description: 'Main endpoint for Model Context Protocol JSON-RPC communication',
            tags: ['MCP'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      jsonrpc: {
                        type: 'string',
                        enum: ['2.0'],
                      },
                      method: {
                        type: 'string',
                      },
                      params: {
                        type: 'object',
                      },
                      id: {
                        type: 'string',
                      },
                    },
                    required: ['jsonrpc', 'method'],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Successful JSON-RPC response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        jsonrpc: {
                          type: 'string',
                          enum: ['2.0'],
                        },
                        result: {
                          type: 'object',
                        },
                        error: {
                          type: 'object',
                          properties: {
                            code: { type: 'number' },
                            message: { type: 'string' },
                            data: { type: 'object' },
                          },
                        },
                        id: {
                          type: 'string',
                        },
                      },
                      required: ['jsonrpc'],
                    },
                  },
                },
              },
            },
          },
        },
        ...this.generateToolPaths(tools),
        ...this.generateResourcePaths(resources),
      },
      components: {
        schemas: {
          ...this.generateToolSchemas(tools),
          ...this.generateResourceSchemas(resources),
          ...this.generateCommonSchemas(),
        },
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for authentication',
          },
        },
      },
      tags: [
        {
          name: 'Documentation',
          description:
            '🎯 PRIMARY VALUE-ADD: Advanced n8n node documentation service with semantic search and caching',
        },
        {
          name: 'MCP',
          description: 'Model Context Protocol operations',
        },
        {
          name: 'Tools',
          description: 'MCP Tools - executable functions',
        },
        {
          name: 'Resources',
          description: 'MCP Resources - data sources',
        },
        {
          name: 'n8n',
          description: 'n8n workflow automation operations',
        },
      ],
    };

    return spec;
  }

  /**
   * Extract tool information from the MCP server
   */
  private extractTools(): McpToolInfo[] {
    // Try to introspect the actual server tools if possible
    // For now, we'll return the comprehensive list of all registered n8n tools
    // including the DocumentationService which is the primary value-add
    return [
      // Documentation Tools (Primary Value-Add)
      {
        name: 'getNodeDocumentation',
        description:
          'Retrieves detailed documentation for a specific n8n node including parameters, examples, and usage information',
        inputSchema: z.object({
          nodeType: z.string(),
        }),
      },
      {
        name: 'searchNodeDocumentation',
        description:
          'Searches for n8n nodes based on functionality or keywords using semantic search',
        inputSchema: z.object({
          query: z.string(),
          limit: z.number().min(1).max(20).optional().default(5),
        }),
      },
      {
        name: 'listNodeTypes',
        description:
          'Lists all available n8n node types that have documentation cached in the system',
        inputSchema: z.object({}),
      },
      {
        name: 'fetchNodeDocumentation',
        description:
          'Fetches and stores the latest documentation for specific n8n nodes from the official documentation',
        inputSchema: z.object({
          nodeType: z.string().optional(),
          nodeTypes: z.array(z.string()).optional(),
        }),
      },
      {
        name: 'updateDocumentation',
        description:
          'Triggers the documentation fetch and cache process for common n8n nodes or specified nodes',
        inputSchema: z.object({
          nodeTypes: z.array(z.string()).optional(),
        }),
      },
      {
        name: 'updateAllNodeDocumentation',
        description:
          'Updates and caches documentation for all available n8n nodes (time-intensive operation)',
        inputSchema: z.object({}),
      },

      // Workflow Management Tools
      {
        name: 'listWorkflows',
        description: 'Lists all workflows in your n8n instance',
        inputSchema: z.object({
          active: z.boolean().optional(),
          tags: z.string().optional(),
          name: z.string().optional(),
          projectId: z.string().optional(),
          excludePinnedData: z.boolean().optional(),
          limit: z.number().optional(),
          cursor: z.string().optional(),
        }),
      },
      {
        name: 'getWorkflowDetails',
        description: 'Gets detailed information about a specific workflow by ID',
        inputSchema: z.object({
          workflowId: z.string(),
          excludePinnedData: z.boolean().optional(),
        }),
      },
      {
        name: 'createWorkflow',
        description: 'Creates a new workflow in n8n',
        inputSchema: z.object({
          name: z.string(),
          nodes: z.array(z.any()),
          connections: z.any(),
          settings: z.any(),
        }),
      },
      {
        name: 'updateWorkflow',
        description: 'Updates an existing workflow in n8n',
        inputSchema: z.object({
          workflowId: z.string(),
          workflowData: z.object({
            name: z.string(),
            nodes: z.array(z.any()),
            connections: z.any(),
            settings: z.any(),
          }),
        }),
      },
      {
        name: 'deleteWorkflow',
        description: 'Deletes a workflow',
        inputSchema: z.object({
          workflowId: z.string(),
        }),
      },
      {
        name: 'executeWorkflow',
        description: 'Executes a workflow',
        inputSchema: z.object({
          workflowId: z.string(),
          inputData: z.any().optional(),
        }),
      },
    ];
  }

  /**
   * Extract resource information from the MCP server
   */
  private extractResources(): McpResourceInfo[] {
    return [
      {
        name: 'workflows',
        uriTemplate: 'n8n://workflows',
        description: 'Lists all n8n workflows',
      },
      {
        name: 'workflow',
        uriTemplate: 'n8n://workflows/{workflowId}',
        description: 'Gets a specific n8n workflow by ID',
      },
      {
        name: 'executions',
        uriTemplate: 'n8n://executions',
        description: 'Lists all n8n executions',
      },
      {
        name: 'execution',
        uriTemplate: 'n8n://executions/{executionId}',
        description: 'Gets a specific n8n execution by ID',
      },
      {
        name: 'tags',
        uriTemplate: 'n8n://tags',
        description: 'Lists all n8n tags',
      },
      {
        name: 'users',
        uriTemplate: 'n8n://users',
        description: 'Lists all n8n users',
      },
      {
        name: 'projects',
        uriTemplate: 'n8n://projects',
        description: 'Lists all n8n projects',
      },
      {
        name: 'variables',
        uriTemplate: 'n8n://variables',
        description: 'Lists all n8n variables',
      },
    ];
  }

  /**
   * Generate OpenAPI paths for tools
   */
  private generateToolPaths(tools: McpToolInfo[]): Record<string, OpenAPIV3_1.PathItemObject> {
    const paths: Record<string, OpenAPIV3_1.PathItemObject> = {};

    tools.forEach((tool) => {
      const pathKey = `/tools/${tool.name}`;
      const isDocumentationTool = tool.name.includes('Documentation') || tool.name.includes('Node');
      const tags = isDocumentationTool ? ['Documentation', 'Tools'] : ['Tools', 'n8n'];

      paths[pathKey] = {
        post: {
          summary: tool.description,
          description: `Execute the ${tool.name} tool via REST API`,
          tags,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: this.zodToOpenAPISchema(tool.inputSchema) as any,
              },
            },
          },
          responses: {
            '200': {
              description: 'Tool execution result',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ToolResult',
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - invalid parameters',
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
      };
    });

    return paths;
  }

  /**
   * Generate OpenAPI paths for resources
   */
  private generateResourcePaths(
    resources: McpResourceInfo[]
  ): Record<string, OpenAPIV3_1.PathItemObject> {
    const paths: Record<string, OpenAPIV3_1.PathItemObject> = {};

    resources.forEach((resource) => {
      const pathKey = `/resources/${resource.name}`;
      paths[pathKey] = {
        get: {
          summary: resource.description || `Get ${resource.name} resource`,
          description: `Retrieve the ${resource.name} resource data`,
          tags: ['Resources', 'n8n'],
          responses: {
            '200': {
              description: 'Resource data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ResourceResult',
                  },
                },
              },
            },
            '404': {
              description: 'Resource not found',
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
      };
    });

    return paths;
  }

  /**
   * Generate OpenAPI schemas for tools
   */
  private generateToolSchemas(tools: McpToolInfo[]): Record<string, OpenAPIV3_1.SchemaObject> {
    const schemas: Record<string, OpenAPIV3_1.SchemaObject> = {};

    tools.forEach((tool) => {
      const schemaName = `${tool.name}Input`;
      schemas[schemaName] = this.zodToOpenAPISchema(tool.inputSchema);
    });

    return schemas;
  }

  /**
   * Generate OpenAPI schemas for resources
   */
  private generateResourceSchemas(
    resources: McpResourceInfo[]
  ): Record<string, OpenAPIV3_1.SchemaObject> {
    const schemas: Record<string, OpenAPIV3_1.SchemaObject> = {};

    resources.forEach((resource) => {
      const schemaName = `${resource.name}Resource`;
      schemas[schemaName] = {
        type: 'object',
        properties: {
          uri: {
            type: 'string',
            description: 'Resource URI',
          },
          contents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                uri: { type: 'string' },
                text: { type: 'string' },
                mimeType: { type: 'string' },
              },
            },
          },
        },
      };
    });

    return schemas;
  }

  /**
   * Generate common OpenAPI schemas
   */
  private generateCommonSchemas(): Record<string, OpenAPIV3_1.SchemaObject> {
    return {
      ToolResult: {
        type: 'object',
        properties: {
          content: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['text', 'image', 'resource'],
                },
                text: { type: 'string' },
                data: { type: 'object' },
              },
            },
          },
          isError: { type: 'boolean' },
          data: { type: 'object' },
        },
      },
      ResourceResult: {
        type: 'object',
        properties: {
          contents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                uri: { type: 'string' },
                text: { type: 'string' },
                mimeType: { type: 'string' },
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'number' },
          message: { type: 'string' },
          data: { type: 'object' },
        },
        required: ['code', 'message'],
      },
    };
  }

  /**
   * Convert Zod schema to OpenAPI schema
   */
  private zodToOpenAPISchema(zodSchema: z.ZodSchema): OpenAPIV3_1.SchemaObject {
    // This is a simplified conversion - a full implementation would handle all Zod types
    const def = zodSchema._def as any;

    if (def.typeName === 'ZodObject') {
      const properties: Record<string, OpenAPIV3_1.SchemaObject> = {};
      const required: string[] = [];

      Object.entries(def.shape()).forEach(([key, value]: [string, any]) => {
        properties[key] = this.zodToOpenAPISchema(value);
        if (!value.isOptional()) {
          required.push(key);
        }
      });

      return {
        type: 'object',
        properties,
        ...(required.length > 0 && { required }),
      };
    }

    if (def.typeName === 'ZodString') {
      return { type: 'string' };
    }

    if (def.typeName === 'ZodNumber') {
      return { type: 'number' };
    }

    if (def.typeName === 'ZodBoolean') {
      return { type: 'boolean' };
    }

    if (def.typeName === 'ZodArray') {
      return {
        type: 'array',
        items: this.zodToOpenAPISchema(def.type),
      };
    }

    if (def.typeName === 'ZodOptional') {
      return this.zodToOpenAPISchema(def.innerType);
    }

    if (def.typeName === 'ZodAny') {
      return {};
    }

    // Fallback for unknown types
    return { type: 'object' };
  }
}
