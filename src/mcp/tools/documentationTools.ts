/**
 * MCP Tools for accessing n8n documentation
 *
 * This module provides MCP tools for querying n8n node documentation.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DocFetcher, NodeDocumentation } from '../../documentation/docFetcher.js';
import { VectorStore, SearchResult } from '../../documentation/vectorStore.js';
import { LocalEmbeddingService } from '../../documentation/embeddingService.js';

// Service for handling documentation requests
class DocumentationService {
  private _fetcher: DocFetcher;
  private _vectorStore: VectorStore;
  private _embeddingService: LocalEmbeddingService;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this._fetcher = new DocFetcher();
    this._embeddingService = new LocalEmbeddingService();

    // Create vector store with in-memory storage by default
    // Will fall back to in-memory if PostgreSQL is not available
    const dbConfig = process.env.PGHOST
      ? {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432'),
          database: process.env.PGDATABASE || 'n8n_docs',
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
        }
      : null;

    this._vectorStore = new VectorStore(dbConfig, this._embeddingService);
  }

  /**
   * Initialize the documentation service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Use a promise to prevent multiple initializations
    if (!this.initializationPromise) {
      this.initializationPromise = this._initialize();
    }

    return this.initializationPromise;
  }

  /**
   * Get the vector store instance
   */
  getVectorStore(): VectorStore {
    return this._vectorStore;
  }

  /**
   * Get the documentation fetcher instance
   */
  get fetcher(): DocFetcher {
    return this._fetcher;
  }

  /**
   * Internal initialization method
   */
  private async _initialize(): Promise<void> {
    try {
      console.log('Initializing documentation service...');

      // Initialize components
      await this._fetcher.initialize();
      await this._vectorStore.initialize();

      // Load initial documentation cache
      await this.loadInitialDocumentation();

      this.initialized = true;
      console.log('Documentation service initialized successfully');
    } catch (error) {
      console.error('Error initializing documentation service:', error);
      throw error;
    }
  }

  /**
   * Load initial documentation for common nodes
   */
  private async loadInitialDocumentation(): Promise<void> {
    try {
      console.log('Loading initial documentation cache...');

      // List of common node types to pre-cache
      const commonNodeTypes = [
        // Core nodes
        'n8n-nodes-base.httpRequest',
        'n8n-nodes-base.set',
        'n8n-nodes-base.function',
        'n8n-nodes-base.if',
        'n8n-nodes-base.switch',
        'n8n-nodes-base.gmail',
        'n8n-nodes-base.webhook',

        // LangChain nodes
        'n8n-nodes-langchain.agent',
        'n8n-nodes-langchain.chainllm',
        'n8n-nodes-langchain.chainretrievalqa',
        'n8n-nodes-langchain.chainsummarization',
        'n8n-nodes-langchain.lmchatopenai',
        'n8n-nodes-langchain.vectorstorepinecone',
      ];

      // Fetch and store documentation for each node type
      for (const nodeType of commonNodeTypes) {
        try {
          const doc = await this._fetcher.fetchNodeDocumentation(nodeType);
          if (doc) {
            await this._vectorStore.storeDocumentation(doc);
            console.log(`Cached documentation for ${nodeType}`);
          }
        } catch (error) {
          console.error(`Error loading documentation for ${nodeType}:`, error);
        }
      }

      console.log('Initial documentation cache loaded');
    } catch (error) {
      console.error('Error loading initial documentation:', error);
    }
  }

  /**
   * Get documentation for a specific node type
   *
   * @param nodeType - The type of node to get documentation for
   * @returns The node documentation
   */
  async getNodeDocumentation(nodeType: string): Promise<NodeDocumentation | null> {
    await this.initialize();

    try {
      // Try to get from vector store first
      const doc = await this.getVectorStore().getByNodeType(nodeType);
      if (doc) {
        return doc;
      }

      // Fetch from source if not in store
      const fetchedDoc = await this.fetcher.fetchNodeDocumentation(nodeType);
      if (fetchedDoc) {
        // Store for future use
        await this.getVectorStore().storeDocumentation(fetchedDoc);
        return fetchedDoc;
      }

      return null;
    } catch (error) {
      console.error(`Error getting documentation for ${nodeType}:`, error);
      return null;
    }
  }

  /**
   * Search for node documentation by query
   *
   * @param query - The search query
   * @param limit - Maximum number of results to return
   * @returns Array of search results
   */
  async searchDocumentation(query: string, limit: number = 5): Promise<SearchResult[]> {
    await this.initialize();

    try {
      // Search with vector store
      return await this.getVectorStore().semanticSearch(query, limit);
    } catch (error) {
      console.error(`Error searching documentation for "${query}":`, error);
      return [];
    }
  }
}

// Create a singleton instance of the documentation service
const documentationService = new DocumentationService();

/**
 * Register documentation tools with the MCP server
 *
 * @param server - The MCP server instance
 */
export function registerDocumentationTools(server: McpServer): void {
  // Tool to get documentation for a specific node
  server.tool(
    'getNodeDocumentation',
    `Retrieves detailed documentation for a specific n8n node.

Provide the full node type (e.g., "n8n-nodes-base.gmail") to get comprehensive information about the node, including:
- Description and functionality
- Available parameters and their types
- Required vs. optional parameters
- Examples of usage

This tool is useful when you need to understand how to configure a specific node in a workflow.

Example:
{
  "nodeType": "n8n-nodes-base.gmail"
}`,
    {
      nodeType: z.string(),
    },
    async (args) => {
      try {
        const { nodeType } = args;
        const documentation = await documentationService.getNodeDocumentation(nodeType);

        if (!documentation) {
          return {
            content: [
              {
                type: 'text',
                text: `No documentation found for node type "${nodeType}". Please check the node type and try again, or use the fetchNodeDocumentation tool to fetch the latest documentation.`,
              },
            ],
            isError: true,
          };
        }

        // Format the documentation for display
        const parametersList = documentation.parameters
          .map(
            (param) =>
              `- ${param.name} (${param.type})${
                param.required ? ' [Required]' : ''
              }: ${param.description}`
          )
          .join('\n');

        const examplesList = documentation.examples
          .map(
            (example) =>
              `### ${example.title}\n${example.description}\n${
                example.code ? '```javascript\n' + example.code + '\n```' : ''
              }`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `# ${documentation.displayName} (${documentation.nodeType})

## Description
${documentation.description}

## Parameters
${parametersList || 'No parameters documented.'}

## Examples
${examplesList || 'No examples documented.'}

---
Documentation source: ${documentation.sourceUrl}
Last updated: ${
                typeof documentation.fetchedAt === 'object' &&
                documentation.fetchedAt instanceof Date
                  ? documentation.fetchedAt.toISOString()
                  : String(documentation.fetchedAt)
              }`,
            },
          ],
          data: documentation,
        };
      } catch (error) {
        console.error('Error getting node documentation:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving documentation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool to search for nodes by functionality
  server.tool(
    'searchNodeDocumentation',
    `Searches for n8n nodes based on functionality or keywords.

Provide a search query describing the functionality you're looking for, and this tool will return relevant n8n nodes that match your requirements.

This tool is useful when you're not sure which node to use for a specific task.

Example:
{
  "query": "send email with attachments",
  "limit": 5
}`,
    {
      query: z.string(),
      limit: z.number().min(1).max(20).optional().default(5),
    },
    async (args) => {
      try {
        const { query, limit } = args;
        const results = await documentationService.searchDocumentation(query, limit);

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No nodes found matching "${query}". Try a different search query or use the fetchNodeDocumentation tool to update the documentation.`,
              },
            ],
          };
        }

        // Format the results for display
        const resultsList = results
          .map(
            (result) =>
              `## ${result.displayName} (${result.nodeType})
Relevance: ${(result.relevance * 100).toFixed(1)}%

${result.description}

${result.snippet ? `### Relevant snippet:\n${result.snippet}` : ''}`
          )
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `# Search Results for "${query}"

${resultsList}`,
            },
          ],
          data: results,
        };
      } catch (error) {
        console.error('Error searching node documentation:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error searching documentation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool to get a list of all available node types
  server.tool(
    'listNodeTypes',
    `Lists all available n8n node types that have documentation.

This tool returns a list of all node types that have documentation available in the system.

This is useful when you want to see what nodes are available for use in your workflows.

Example:
{}
`,
    {},
    async () => {
      try {
        // Initialize the documentation service if not already done
        await documentationService.initialize();

        // Get all node types from the vector store
        const nodeTypes = await documentationService.getVectorStore().getAllNodeTypes();

        if (nodeTypes.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No node documentation is currently available in the system. Use the fetchNodeDocumentation tool to fetch documentation for specific nodes.',
              },
            ],
          };
        }

        // Group nodes by category (based on the node type naming)
        const categories: Record<string, string[]> = {};

        for (const nodeType of nodeTypes) {
          // Extract category from node type (e.g., 'n8n-nodes-base' from 'n8n-nodes-base.gmail')
          const parts = nodeType.split('.');
          if (parts.length >= 2) {
            const category = parts[0];
            const _nodeName = parts[1];

            if (!categories[category]) {
              categories[category] = [];
            }

            categories[category].push(nodeType);
          } else {
            // Handle node types without a category separator
            if (!categories['other']) {
              categories['other'] = [];
            }
            categories['other'].push(nodeType);
          }
        }

        // Format the result as a categorized list
        let formattedList = '# Available n8n Node Types\n\n';

        for (const [category, nodes] of Object.entries(categories)) {
          formattedList += `## ${category}\n\n`;

          // Sort nodes alphabetically within each category
          nodes.sort();

          for (const nodeType of nodes) {
            const nodeName = nodeType.split('.').pop() || nodeType;
            formattedList += `- ${nodeType} (${nodeName})\n`;
          }

          formattedList += '\n';
        }

        return {
          content: [
            {
              type: 'text',
              text: formattedList,
            },
          ],
          data: nodeTypes,
        };
      } catch (error) {
        console.error('Error listing node types:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error listing node types: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool to fetch and update documentation for a specific node (NEW TOOL)
  server.tool(
    'fetchNodeDocumentation',
    `Fetches and stores the latest documentation for specific n8n nodes.

Use this tool when you need to get up-to-date documentation for nodes that:
- Don't exist in the current documentation cache
- Have outdated information
- Need to be refreshed

This tool will fetch documentation directly from the n8n website and update the cache.

Example for a single node:
{
  "nodeType": "n8n-nodes-base.gmail"
}

Example for multiple nodes:
{
  "nodeTypes": ["n8n-nodes-base.http", "n8n-nodes-base.gmail"]
}
`,
    {
      nodeType: z.string().optional(),
      nodeTypes: z.array(z.string()).optional(),
    },
    async (args) => {
      try {
        // Initialize the documentation service
        await documentationService.initialize();

        // Determine which nodes to update
        let nodesToUpdate: string[] = [];
        if (args.nodeType) {
          nodesToUpdate = [args.nodeType];
        } else if (args.nodeTypes && args.nodeTypes.length > 0) {
          nodesToUpdate = args.nodeTypes;
        } else {
          return {
            content: [
              {
                type: 'text',
                text: 'Please specify a nodeType or nodeTypes to fetch documentation for.',
              },
            ],
            isError: true,
          };
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        // Process each node
        for (const nodeType of nodesToUpdate) {
          try {
            console.log(`Fetching latest documentation for ${nodeType}...`);

            // Force fetch from source
            const fetchedDoc = await documentationService.fetcher.fetchNodeDocumentation(nodeType);

            if (fetchedDoc) {
              // Store the updated documentation
              await documentationService.getVectorStore().storeDocumentation(fetchedDoc);

              results.push({
                nodeType,
                status: 'success',
                message: 'Successfully fetched and stored latest documentation.',
                fetchedAt: fetchedDoc.fetchedAt,
              });

              successCount++;
            } else {
              results.push({
                nodeType,
                status: 'failure',
                message: 'No documentation found for this node type.',
              });

              failureCount++;
            }
          } catch (error) {
            results.push({
              nodeType,
              status: 'error',
              message: `Error fetching documentation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            });

            failureCount++;
          }
        }

        // Format the response
        const resultsList = results
          .map(
            (result) =>
              `- **${result.nodeType}**: ${
                result.status === 'success' ? '✅' : '❌'
              } ${result.message}${
                result.fetchedAt
                  ? ` (Fetched at: ${
                      typeof result.fetchedAt === 'object' && result.fetchedAt instanceof Date
                        ? result.fetchedAt.toISOString()
                        : String(result.fetchedAt)
                    })`
                  : ''
              }`
          )
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `# Documentation Fetch Results

## Summary
- Total nodes: ${nodesToUpdate.length}
- Successfully fetched: ${successCount}
- Failed: ${failureCount}

## Details
${resultsList}

${
  successCount > 0
    ? 'The documentation cache has been updated with the latest information. You can now use getNodeDocumentation to access it.'
    : 'No documentation was updated. Please check the node types and try again.'
}`,
            },
          ],
          data: results,
        };
      } catch (error) {
        console.error('Error fetching node documentation:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching documentation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool to trigger documentation update process
  server.tool(
    'updateDocumentation',
    `Triggers the documentation fetch and cache process for n8n nodes.

This tool will fetch and cache documentation for a list of specified nodes or common nodes if no specific nodes are provided. Use this to proactively build the documentation cache.

Example with specific nodes:
{
  "nodeTypes": ["n8n-nodes-base.http", "n8n-nodes-base.gmail"]
}

Example for common nodes (default behavior):
{}
`,
    {
      nodeTypes: z.array(z.string()).optional(),
    },
    async (args) => {
      try {
        // Initialize the documentation service
        await documentationService.initialize();

        // List of nodes to update
        const nodesToUpdate = args.nodeTypes || [
          // Core nodes
          'n8n-nodes-base.httpRequest',
          'n8n-nodes-base.set',
          'n8n-nodes-base.function',
          'n8n-nodes-base.if',
          'n8n-nodes-base.switch',
          'n8n-nodes-base.gmail',
          'n8n-nodes-base.webhook',
          'n8n-nodes-base.merge',
          'n8n-nodes-base.slack',
          'n8n-nodes-base.code',
          'n8n-nodes-base.filter',
          'n8n-nodes-base.wait',
          'n8n-nodes-base.graphql',
          'n8n-nodes-base.s3',
          'n8n-nodes-base.googleSheets',
          'n8n-nodes-base.airtable',

          // LangChain nodes
          'n8n-nodes-langchain.agent',
          'n8n-nodes-langchain.chainllm',
          'n8n-nodes-langchain.chainretrievalqa',
          'n8n-nodes-langchain.chainsummarization',
          'n8n-nodes-langchain.lmchatopenai',
          'n8n-nodes-langchain.vectorstorepinecone',
          'n8n-nodes-langchain.lmchatollama',
          'n8n-nodes-langchain.embeddingsopenai',
        ];

        // Start the update process
        const results = [];

        // Process each node
        for (const nodeType of nodesToUpdate) {
          try {
            // Try to fetch documentation
            const doc = await documentationService.fetcher.fetchNodeDocumentation(nodeType);

            if (doc) {
              // If successful, store the documentation
              await documentationService.getVectorStore().storeDocumentation(doc);
              results.push({
                nodeType,
                status: 'success',
                message: `Documentation fetched and stored for ${nodeType}`,
              });
            } else {
              results.push({
                nodeType,
                status: 'failed',
                message: `No documentation found for ${nodeType}`,
              });
            }
          } catch (error) {
            results.push({
              nodeType,
              status: 'error',
              message: `Error updating documentation for ${nodeType}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            });
          }
        }

        // Format the response
        const successCount = results.filter((r) => r.status === 'success').length;
        const failedCount = results.filter((r) => r.status === 'failed').length;
        const errorCount = results.filter((r) => r.status === 'error').length;

        const resultsList = results
          .map(
            (r) =>
              `- **${r.nodeType}**: ${
                r.status === 'success' ? '✅' : r.status === 'failed' ? '❌' : '⚠️'
              } ${r.message}`
          )
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `# Documentation Update Results

## Summary
- Total nodes: ${nodesToUpdate.length}
- Successfully updated: ${successCount}
- Documentation not found: ${failedCount}
- Errors encountered: ${errorCount}

## Details
${resultsList}`,
            },
          ],
          data: results,
        };
      } catch (error) {
        console.error('Error updating documentation:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error updating documentation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool to trigger documentation update for all n8n nodes
  server.tool(
    'updateAllNodeDocumentation',
    `Updates and caches documentation for all available n8n nodes.

This tool will trigger the fetching and caching of documentation for all n8n nodes that can be discovered from the n8n documentation website. This is a time-consuming operation but ensures comprehensive documentation coverage.

Example:
{}
`,
    {},
    async () => {
      try {
        // Initialize the documentation service
        await documentationService.initialize();

        console.log('Starting full documentation update process...');

        // Start a longer-running process to fetch all nodes
        let allDocs;
        try {
          allDocs = await documentationService.fetcher.fetchAllNodes();
          console.log(`Found ${allDocs.length} nodes to process`);
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching node list: ${
                  error instanceof Error ? error.message : String(error)
                }. Please try again later.`,
              },
            ],
            isError: true,
          };
        }

        // Start processing the nodes
        const results = {
          total: allDocs.length,
          processed: 0,
          successful: 0,
          failed: 0,
          message: `Started processing ${allDocs.length} nodes in the background. This may take some time.`,
        };

        // Process nodes in the background
        (async () => {
          for (const doc of allDocs) {
            try {
              await documentationService.getVectorStore().storeDocumentation(doc);
              results.successful++;
            } catch (error) {
              console.error(`Error storing documentation for ${doc.nodeType}:`, error);
              results.failed++;
            }
            results.processed++;

            // Log progress every 10 nodes
            if (results.processed % 10 === 0) {
              console.log(
                `Documentation update progress: ${results.processed}/${results.total} nodes processed`
              );
            }
          }

          console.log(
            `Documentation update completed: ${results.successful}/${results.total} nodes successfully updated`
          );
        })();

        return {
          content: [
            {
              type: 'text',
              text: `# Full Documentation Update Initiated

A full documentation update process has been started in the background. This will fetch and store documentation for all available n8n nodes (approximately ${allDocs.length} nodes).

## Process Details
- This will run in the background and may take several minutes to complete
- Node documentation will be incrementally available as it is processed
- You can continue to use the system normally while this runs
- Check the server logs for progress updates

Use the listNodeTypes tool after some time to see which nodes have been documented.`,
            },
          ],
          data: results,
        };
      } catch (error) {
        console.error('Error initiating full documentation update:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error initiating full documentation update: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
