# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Start
- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run start` - Start the main MCP server (dist/index.js)
- `pnpm run start:server` - Start the enhanced server with OpenAPI (dist/server.js)
- `pnpm run start:enhanced` - Start the server-enhanced variant
- `pnpm run start:v2` - Start the v2 implementation

### Testing
- `pnpm test` - Run Jest tests with experimental VM modules
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:http` - Test HTTP streaming functionality
- `pnpm test:execution` - Test execution endpoints
- `pnpm test:credential` - Test credential endpoints

### Code Quality
- `pnpm run lint` - Run ESLint on TypeScript files
- `pnpm run lint:fix` - Auto-fix linting issues
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting

## Architecture Overview

This is an MCP (Model Context Protocol) HTTP streaming server that provides AI assistants with access to n8n automation platform functionality.

### Core Components

**Entry Points:**
- `src/index.ts` - Simple MCP server implementation with basic n8n workflow tools
- `src/server.ts` - Enhanced server with full n8n integration, OpenAPI docs, and REST API
- `src/indexV2.ts` - Alternative v2 implementation

**MCP Integration:**
- `src/mcp/n8nIntegration.ts` - Main n8n MCP integration registration
- `src/mcp/resources/` - MCP resource handlers (workflows, tags, executions, users, projects, variables)  
- `src/mcp/tools/` - MCP tool implementations for n8n operations

**n8n API Layer:**
- `src/services/n8nService.ts` - Core n8n API service
- `src/services/n8nServiceV2.ts` - Enhanced v2 service implementation
- `src/services/simpleN8nService.ts` - Simplified service for basic operations
- `src/api/n8nClient.ts` - Generated n8n API client
- `src/api/generated/` - Auto-generated OpenAPI client code

**OpenAPI Integration:**
- `src/openapi/routes.ts` - REST API routes and Swagger UI setup
- `src/openapi/generator.ts` - OpenAPI specification generator
- `openapi.yml` - OpenAPI specification file

### Key Features

The server exposes n8n functionality through:
1. **MCP Resources** - URI-based data access (n8n://workflows, n8n://tags, etc.)
2. **MCP Tools** - Action-based operations (createWorkflow, executeWorkflow, etc.)
3. **REST API** - HTTP endpoints for all MCP functionality
4. **OpenAPI Documentation** - Interactive Swagger UI at `/api/docs`

### Environment Setup

Required environment variables:
- `N8N_API_URL` - Base URL for n8n API (e.g., https://your-n8n-instance.com/api/v1)
- `N8N_API_KEY` - n8n API authentication key

### Docker Support

The project includes Docker configuration:
- `Dockerfile` - Multi-stage build with production optimization
- `docker-compose.yml` - Service orchestration
- Various test scripts for Docker validation

### Testing Strategy

- Unit tests in `__tests__/` directories alongside source files
- Integration tests in `src/__tests__/integration.test.ts`
- HTTP streaming tests in `tests/http-streaming/`
- Mocking with nock for external API calls
- Jest configuration supports ES modules with experimental VM modules

### Generated Code

The `src/api/generated/` directory contains auto-generated TypeScript client code from n8n's OpenAPI specification. This code should not be manually edited - regenerate using the generation scripts in `scripts/` directory.