/**
 * Vector Store for n8n Documentation
 *
 * This module provides functionality to store and retrieve node documentation
 * using vector embeddings for semantic search capabilities.
 */

import { Pool } from "pg";
import { NodeDocumentation } from "./docFetcher.js";
import { EmbeddingService, LocalEmbeddingService } from "./embeddingService.js";

// Configuration for the PostgreSQL connection
interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Search result interface
export interface SearchResult {
  nodeType: string;
  displayName: string;
  description: string;
  relevance: number;
  snippet?: string;
}

// In-memory node documentation storage
interface NodeDocEntry {
  doc: NodeDocumentation;
  embedding: number[];
}

/**
 * Vector Store class for documentation
 */
export class VectorStore {
  private pool: Pool | null = null;
  private embeddingService: EmbeddingService;
  private initialized: boolean = false;
  private useInMemoryStore: boolean;
  private inMemoryStore: Map<string, NodeDocEntry> = new Map();

  /**
   * Create a new VectorStore instance
   *
   * @param config - PostgreSQL connection configuration or null for in-memory storage
   * @param embeddingService - Service to generate embeddings
   * @param useInMemoryStore - Whether to use in-memory storage instead of PostgreSQL
   */
  constructor(
    config: DbConfig | null = null,
    embeddingService: EmbeddingService | null = null,
    useInMemoryStore: boolean = false
  ) {
    this.useInMemoryStore = useInMemoryStore || config === null;
    
    // Initialize database connection if using PostgreSQL
    if (!this.useInMemoryStore && config) {
      this.pool = new Pool(config);
    }
    
    // Use provided embedding service or create a local one
    this.embeddingService = embeddingService || new LocalEmbeddingService();
  }

  /**
   * Initialize the vector store
   * Creates necessary tables and indexes if they don't exist
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize the embedding service
      if (this.embeddingService instanceof LocalEmbeddingService) {
        await (this.embeddingService as LocalEmbeddingService).initialize();
      }
      
      // If using PostgreSQL, initialize the database
      if (!this.useInMemoryStore && this.pool) {
        // Check if pgvector extension is available
        try {
          await this.pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
        } catch (error) {
          console.warn("pgvector extension not available, falling back to in-memory storage");
          this.useInMemoryStore = true;
          if (this.pool) {
            await this.pool.end();
            this.pool = null;
          }
        }
        
        // If we still want to use PostgreSQL, create the necessary tables
        if (!this.useInMemoryStore && this.pool) {
          // Create table for node documentation
          await this.pool.query(`
            CREATE TABLE IF NOT EXISTS node_documentation (
              id SERIAL PRIMARY KEY,
              node_type TEXT UNIQUE NOT NULL,
              display_name TEXT NOT NULL,
              description TEXT NOT NULL,
              version TEXT NOT NULL,
              parameters JSONB NOT NULL,
              examples JSONB NOT NULL,
              source_url TEXT NOT NULL,
              fetched_at TIMESTAMP NOT NULL,
              embedding vector(512)
            );
          `);

          // Create index for vector similarity search
          await this.pool.query(`
            CREATE INDEX IF NOT EXISTS node_documentation_embedding_idx
            ON node_documentation
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
          `);
        }
      }

      this.initialized = true;
      console.log(`Vector store initialized successfully (using ${this.useInMemoryStore ? 'in-memory storage' : 'PostgreSQL'})`);
    } catch (error) {
      console.error("Error initializing vector store:", error);
      // Fall back to in-memory storage if database initialization fails
      this.useInMemoryStore = true;
      if (this.pool) {
        try {
          await this.pool.end();
        } catch (e) {
          console.error("Error closing pool:", e);
        }
        this.pool = null;
      }
      this.initialized = true;
      console.log("Falling back to in-memory storage due to initialization error");
    }
  }

  /**
   * Store node documentation in the vector store
   *
   * @param doc - The node documentation to store
   * @param embedding - The vector embedding for the documentation (optional)
   */
  async storeDocumentation(
    doc: NodeDocumentation,
    embedding?: number[]
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Generate embedding if not provided
      const docEmbedding = embedding || await this.generateEmbeddingForDoc(doc);
      
      // Store in the appropriate storage system
      if (this.useInMemoryStore) {
        // Store in memory
        this.inMemoryStore.set(doc.nodeType, {
          doc,
          embedding: docEmbedding
        });
      } else if (this.pool) {
        // Store in PostgreSQL
        await this.pool.query(
          `
          INSERT INTO node_documentation (
            node_type, display_name, description, version,
            parameters, examples, source_url, fetched_at, embedding
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (node_type)
          DO UPDATE SET
            display_name = $2,
            description = $3,
            version = $4,
            parameters = $5,
            examples = $6,
            source_url = $7,
            fetched_at = $8,
            embedding = $9
        `,
          [
            doc.nodeType,
            doc.displayName,
            doc.description,
            doc.version,
            JSON.stringify(doc.parameters),
            JSON.stringify(doc.examples),
            doc.sourceUrl,
            doc.fetchedAt,
            docEmbedding,
          ]
        );
      }

      console.log(`Stored documentation for ${doc.nodeType}`);
    } catch (error) {
      console.error(`Error storing documentation for ${doc.nodeType}:`, error);
      throw error;
    }
  }

  /**
   * Generate embedding for a node documentation
   * 
   * @param doc - The node documentation
   * @returns The embedding vector
   */
  private async generateEmbeddingForDoc(doc: NodeDocumentation): Promise<number[]> {
    // Create a text representation of the documentation
    const text = [
      doc.displayName,
      doc.description,
      ...doc.parameters.map(p => `${p.name}: ${p.description}`),
      ...doc.examples.map(e => `${e.title} ${e.description}`)
    ].join(" ");
    
    // Generate embedding
    return await this.embeddingService.generateEmbedding(text);
  }

  /**
   * Search for node documentation by node type
   *
   * @param nodeType - The type of node to search for
   * @returns The node documentation or null if not found
   */
  async getByNodeType(nodeType: string): Promise<NodeDocumentation | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      if (this.useInMemoryStore) {
        // Get from in-memory store
        const entry = this.inMemoryStore.get(nodeType);
        return entry ? entry.doc : null;
      } else if (this.pool) {
        // Get from PostgreSQL
        const result = await this.pool.query(
          `
          SELECT
            node_type, display_name, description, version,
            parameters, examples, source_url, fetched_at
          FROM node_documentation
          WHERE node_type = $1
        `,
          [nodeType]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        return {
          nodeType: row.node_type,
          displayName: row.display_name,
          description: row.description,
          version: row.version,
          parameters: row.parameters,
          examples: row.examples,
          sourceUrl: row.source_url,
          fetchedAt: row.fetched_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting documentation for ${nodeType}:`, error);
      throw error;
    }
  }

  /**
   * Search for node documentation by semantic similarity
   *
   * @param query - The search query
   * @param limit - Maximum number of results to return
   * @returns Array of search results sorted by relevance
   */
  async semanticSearch(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      if (this.useInMemoryStore) {
        // Search in-memory store
        const results: SearchResult[] = [];
        
        // Calculate similarity for each document
        for (const [nodeType, entry] of this.inMemoryStore.entries()) {
          // Use cosine similarity from the embedding service
          const similarity = LocalEmbeddingService.cosineSimilarity(
            queryEmbedding,
            entry.embedding
          );
          
          // Add to results if similarity is positive
          if (similarity > 0) {
            results.push({
              nodeType,
              displayName: entry.doc.displayName,
              description: entry.doc.description,
              relevance: similarity,
              snippet: this.generateSnippet(entry.doc, query)
            });
          }
        }
        
        // Sort by relevance (highest first) and limit results
        return results
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, limit);
      } else if (this.pool) {
        // Search in PostgreSQL using vector similarity
        const result = await this.pool.query(
          `
          SELECT
            node_type, display_name, description,
            1 - (embedding <=> $1) as relevance
          FROM node_documentation
          ORDER BY embedding <=> $1
          LIMIT $2
        `,
          [queryEmbedding, limit]
        );

        return result.rows.map((row) => ({
          nodeType: row.node_type,
          displayName: row.display_name,
          description: row.description,
          relevance: row.relevance,
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Error performing semantic search:", error);
      throw error;
    }
  }
  
  /**
   * Generate a snippet from the document that matches the query
   * 
   * @param doc - The node documentation
   * @param query - The search query
   * @returns A relevant snippet from the documentation
   */
  private generateSnippet(doc: NodeDocumentation, query: string): string {
    // Lowercase query terms for case-insensitive matching
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    // Look for matches in parameters
    for (const param of doc.parameters) {
      const paramText = `${param.name}: ${param.description}`.toLowerCase();
      if (queryTerms.some(term => paramText.includes(term))) {
        return `Parameter: ${param.name} - ${param.description}`;
      }
    }
    
    // Look for matches in examples
    for (const example of doc.examples) {
      const exampleText = `${example.title} ${example.description}`.toLowerCase();
      if (queryTerms.some(term => exampleText.includes(term))) {
        return `Example: ${example.title} - ${example.description.substring(0, 100)}...`;
      }
    }
    
    // Default to description
    return doc.description;
  }

  /**
   * Get all stored node types
   * 
   * @returns Array of node types
   */
  async getAllNodeTypes(): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      if (this.useInMemoryStore) {
        return Array.from(this.inMemoryStore.keys());
      } else if (this.pool) {
        const result = await this.pool.query(`
          SELECT node_type FROM node_documentation
        `);
        
        return result.rows.map(row => row.node_type);
      }
      
      return [];
    } catch (error) {
      console.error("Error getting all node types:", error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// Example usage
async function main() {
  // Create a local embedding service
  const embeddingService = new LocalEmbeddingService();
  
  // Create a vector store with in-memory storage
  const store = new VectorStore(null, embeddingService, true);
  await store.initialize();

  // Example documentation
  const exampleDoc: NodeDocumentation = {
    nodeType: "n8n-nodes-base.example",
    displayName: "Example Node",
    description: "This is an example node for demonstration purposes.",
    version: "1.0",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "The URL to connect to",
        required: true
      },
      {
        name: "method",
        type: "string",
        description: "The HTTP method to use",
        required: false
      }
    ],
    examples: [
      {
        title: "Basic usage",
        description: "This example shows how to use the node for a simple request.",
        code: "{ url: 'https://example.com' }"
      }
    ],
    sourceUrl: "https://example.com",
    fetchedAt: new Date(),
  };

  // Store the example documentation
  await store.storeDocumentation(exampleDoc);

  // Retrieve the documentation
  const retrievedDoc = await store.getByNodeType("n8n-nodes-base.example");
  console.log("Retrieved documentation:", retrievedDoc);

  // Perform a semantic search
  const searchResults = await store.semanticSearch("url connection request", 3);
  console.log("Search results:", searchResults);

  // Close the connection
  await store.close();
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
