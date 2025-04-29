# n8n MCP Documentation System

This directory contains documentation and implementation details for the n8n node documentation system integrated with MCP.

## Files

- `documentation-plan.md`: Original implementation plan for the documentation system
- `documentation-implementation.md`: Details of the actual implementation

## Project Structure

The documentation system is implemented in the following files:

- `/src/documentation/docFetcher.ts`: Fetches and parses n8n node documentation
- `/src/documentation/embeddingService.ts`: Generates vector embeddings locally
- `/src/documentation/vectorStore.ts`: Stores and retrieves documentation with semantic search
- `/src/mcp/tools/documentationTools.ts`: MCP tools for accessing documentation
- `/src/scripts/updateDocumentation.ts`: Script to update documentation cache

## Features

1. **Self-contained documentation system**: Works without external dependencies
2. **Semantic search**: Find nodes based on functionality, not just exact keyword matches
3. **Local embeddings**: Generates vector embeddings without requiring external API keys
4. **Graceful degradation**: Falls back to in-memory storage if database is unavailable
5. **Efficient caching**: Uses file-based and in-memory caching to minimize network requests

## MCP Tools

The documentation system provides three MCP tools:

1. **getNodeDocumentation**: Get detailed information about a specific node
2. **searchNodeDocumentation**: Find nodes based on functionality
3. **listNodeTypes**: List all available node types

## Usage

### Building and Running

1. Build the project: `npm run build`
2. Start the MCP server: `npm run start:server`
3. Update documentation cache: `npm run update-docs`

### Example Queries

**Getting node documentation**:
```json
{
  "nodeType": "n8n-nodes-base.gmail"
}
```

**Searching for nodes**:
```json
{
  "query": "send email with attachments",
  "limit": 5
}
```

**Listing all node types**:
```json
{}
```

## Storage Options

The documentation system supports two storage modes:

1. **In-memory storage**: Used by default, requires no additional setup
2. **PostgreSQL with pgvector**: For production environments, requires PostgreSQL with the pgvector extension

To use PostgreSQL, set the following environment variables:
- `PGHOST`: PostgreSQL server hostname
- `PGPORT`: PostgreSQL server port
- `PGDATABASE`: Database name
- `PGUSER`: Database username
- `PGPASSWORD`: Database password

If PostgreSQL with pgvector is not available, the system will automatically fall back to in-memory storage.
