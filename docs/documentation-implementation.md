# n8n Documentation System Implementation

## Overview

This document describes the implementation of the n8n node documentation system. The system provides LLMs with up-to-date information about n8n nodes when creating workflows.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Documentation  │────▶│  Local Embedding│────▶│  Vector Store   │
│    Fetcher      │     │     Service     │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    MCP Tools    │◀───▶│ Documentation   │◀───▶│  Cache Layer    │
│                 │     │    Service      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Components

### 1. Documentation Fetcher (`docFetcher.ts`)

- Collects documentation for all n8n nodes from the official n8n documentation website
- Parses HTML content to extract structured information about nodes
- Organizes data by node type, parameters, examples, etc.
- Caches fetched documentation to local files

### 2. Local Embedding Service (`embeddingService.ts`)

- Generates vector embeddings for documentation without requiring external APIs
- Uses a simple but effective term frequency-based approach for embeddings
- Normalizes vectors for similarity calculations
- Provides cosine similarity calculation for semantic search

### 3. Vector Store (`vectorStore.ts`)

- Supports both PostgreSQL (with pgvector) and in-memory storage
- Automatically falls back to in-memory storage if PostgreSQL/pgvector is not available
- Provides semantic search functionality for finding relevant nodes
- Generates snippets that match search queries

### 4. Documentation Service (in `documentationTools.ts`)

- Centralizes access to documentation components
- Manages initialization and caching
- Provides methods for fetching documentation and searching
- Pre-caches documentation for common nodes

### 5. MCP Tools (in `documentationTools.ts`)

- `getNodeDocumentation`: Retrieves detailed documentation for a specific node
- `searchNodeDocumentation`: Searches for nodes based on functionality or keywords
- `listNodeTypes`: Lists all available node types with documentation
- `fetchNodeDocumentation`: Fetches and updates documentation for specific nodes when data is stale/missing
- `updateDocumentation`: Updates documentation for common nodes or specified nodes
- `updateAllNodeDocumentation`: Triggers a background job to update all available node documentation

### 6. Documentation Update Script (`updateDocumentation.ts`)

- Command-line script to fetch and update documentation for all nodes
- Can be run periodically to keep documentation up-to-date
- Outputs detailed logging information

## Benefits and Features

1. **Self-contained**: All components work without external dependencies
2. **Graceful degradation**: Falls back to in-memory storage if database is unavailable
3. **Efficient caching**: Uses file-based and in-memory caching to minimize network requests
4. **Local embeddings**: Generates vector embeddings without requiring external API keys
5. **Semantic search**: Find nodes based on functionality, not just exact keyword matches
6. **Comprehensive tools**: Multiple tools for different documentation access patterns
7. **On-demand updates**: LLMs can trigger documentation updates when they detect missing or stale data

## Usage

### MCP Tools

The documentation system provides the following MCP tools:

1. `getNodeDocumentation`: Get detailed information about a specific node
   ```
   {
     "nodeType": "n8n-nodes-base.gmail"
   }
   ```

2. `searchNodeDocumentation`: Find nodes based on functionality
   ```
   {
     "query": "send email with attachments",
     "limit": 5
   }
   ```

3. `listNodeTypes`: List all available node types
   ```
   {}
   ```

4. `fetchNodeDocumentation`: Fetch and update documentation for specific nodes
   ```
   {
     "nodeType": "n8n-nodes-base.gmail"
   }
   ```
   or
   ```
   {
     "nodeTypes": ["n8n-nodes-base.http", "n8n-nodes-base.gmail"]
   }
   ```

5. `updateDocumentation`: Update documentation for common or specified nodes
   ```
   {
     "nodeTypes": ["n8n-nodes-base.http", "n8n-nodes-base.gmail"]
   }
   ```

6. `updateAllNodeDocumentation`: Update documentation for all available nodes
   ```
   {}
   ```

### Updating Documentation

To update the documentation cache via command line, run:

```
npm run update-docs
```

This will fetch and process documentation for all available n8n nodes.

Alternatively, LLMs can use the documentation tools directly within their context to:

1. Check if documentation exists using `getNodeDocumentation` or `searchNodeDocumentation`
2. If documentation is missing or needs updating, use `fetchNodeDocumentation` to retrieve the latest information
3. Access the updated documentation immediately

## Future Enhancements

1. **Incremental updates**: Only update documentation that has changed
2. **Better parsing**: Improve HTML parsing to extract more detailed information
3. **More advanced embeddings**: Integrate with optional embedding models for better search
4. **API documentation**: Add support for n8n API documentation in addition to node documentation
5. **Versioning**: Track and provide access to documentation for different n8n versions
6. **Examples database**: Provide a larger collection of workflow examples
7. **Automatic background updates**: Schedule regular documentation updates
8. **Documentation refresh notifications**: Alert when documentation is significantly updated
