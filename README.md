# MCP HTTP Streaming Server with n8n Integration

[![CI](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/ci.yml)
[![Code Quality](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/code-quality.yml/badge.svg)](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/code-quality.yml)
[![Security Scan](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/security.yml/badge.svg)](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/security.yml)
[![Docker Build](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/docker.yml/badge.svg)](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/docker.yml)

This project implements a Model Context Protocol (MCP) server using the HTTP Streaming transport with comprehensive n8n API integration. It provides access to all n8n API endpoints through the MCP protocol.

## Overview

The Model Context Protocol (MCP) allows applications to provide context for LLMs in a standardized way, separating the concerns of providing context from the actual LLM interaction.

This server implements:

- HTTP Streaming transport for MCP
- Session management
- Comprehensive n8n API integration including:
  - Workflow management (create, read, update, delete, activate, deactivate)
  - Tag management (create, read, update, delete)
  - Execution management (list, get, delete, execute workflows)
  - Credential management (create, delete, get schema, transfer)
  - User management (list, get, create, delete, change role)
  - Project management (list, create, update, delete)
  - Variable management (list, create, delete)
  - Source control integration (pull)
  - Security audit generation

## Resources

### Documentation

API documentation is available at [https://ctkadvisors.github.io/n8n-mcp-memory/](https://ctkadvisors.github.io/n8n-mcp-memory/)

### Docker Image

The Docker image is available at [ghcr.io/ctkadvisors/n8n-mcp-memory](https://github.com/ctkadvisors/n8n-mcp-memory/pkgs/container/n8n-mcp-memory)

You can pull it using:

```bash
docker pull ghcr.io/ctkadvisors/n8n-mcp-memory:main
```

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- pnpm (v8 or later)
- n8n instance with API access
- Docker and Docker Compose (optional, for containerized deployment)

### Environment Variables

Create a `.env` file with the following variables:

N8N_API_URL=https://your-n8n-instance.com/api/v1
N8N_API_KEY=your-n8n-api-key

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running the Server

#### Local Development

```bash
pnpm run build
pnpm run start:server
```

This will start the MCP HTTP Streaming server with n8n integration on port 3000.

You can visit http://localhost:3000 to see the available resources and tools.

#### Using Docker

Build and run the Docker container:

# Pull the Docker image from GitHub Container Registry

docker pull ghcr.io/ctkadvisors/n8n-mcp-memory:main

# Run the container with environment variables

docker run -p 3000:3000 \
 -e N8N_API_URL=https://your-n8n-instance.com/api/v1 \
 -e N8N_API_KEY=your-n8n-api-key \
 -v n8n_mcp_cache:/app/cache \
 ghcr.io/ctkadvisors/n8n-mcp-memory:main

# Alternatively, build the Docker image locally

# docker build -t n8n-mcp .

Or using Docker Compose:

# Create a .env file with your n8n credentials first

echo "N8N_API_URL=https://your-n8n-instance.com/api/v1" > .env
echo "N8N_API_KEY=your-n8n-api-key" >> .env

# Start the container

docker-compose up

This will start the containerized MCP HTTP Streaming server with n8n integration on port 3000.

### Persistent Storage

The Docker container is configured with a volume for `/app/cache` to ensure that documentation and other cached data persists between container restarts. This means:

- Node documentation fetched from the n8n website is cached and reused
- Knowledge and "memories" are preserved when the container is restarted
- You don't need to re-download documentation each time you restart the container

The volume is created automatically with the `-v n8n_mcp_cache:/app/cache` parameter in the Docker run command.

## Server Endpoints

The server exposes the following MCP endpoint:

- `POST /mcp` - For client-to-server communication
- `GET /mcp` - For server-to-client notifications via SSE
- `DELETE /mcp` - For session termination

## Features

The server includes:

- An `echo` tool that echoes back a message
- A `greeting` resource that provides a welcome message
- Comprehensive n8n API integration:
  - **Workflow Management**: Create, read, update, delete, activate, deactivate, transfer workflows
  - **Tag Management**: Create, read, update, delete tags
  - **Execution Management**: List, get, delete executions, execute workflows
  - **Credential Management**: Create, delete, get schema, transfer credentials
  - **User Management**: List, get, create, delete users, change user roles
  - **Project Management**: List, create, update, delete projects
  - **Variable Management**: List, create, delete variables
  - **Source Control**: Pull changes from remote repository
  - **Security**: Generate security audits

### Resources and Tools

#### Resources

Resources are accessed using URI patterns:

- `n8n://workflows` - List all workflows
- `n8n://workflows/{workflowId}` - Get a specific workflow
- `n8n://workflows/{workflowId}/tags` - Get tags for a workflow
- `n8n://tags` - List all tags
- `n8n://executions` - List all executions
- `n8n://users` - List all users
- `n8n://projects` - List all projects
- `n8n://variables` - List all variables

#### Tools

Tools are used to perform actions:

- **Workflow Tools**:

  - `createWorkflow` - Create a new workflow
  - `updateWorkflow` - Update an existing workflow
  - `deleteWorkflow` - Delete a workflow
  - `activateWorkflow` - Activate a workflow
  - `deactivateWorkflow` - Deactivate a workflow
  - `transferWorkflow` - Transfer a workflow to another project
  - `updateWorkflowTags` - Update tags for a workflow
  - `executeWorkflow` - Execute a workflow

- **Tag Tools**:

  - `createTag` - Create a new tag
  - `updateTag` - Update a tag
  - `deleteTag` - Delete a tag

- **Execution Tools**:

  - `deleteExecution` - Delete an execution

- **Credential Tools**:

  - `createCredential` - Create a new credential
  - `deleteCredential` - Delete a credential
  - `transferCredential` - Transfer a credential to another project

- **User Tools**:

  - `createUsers` - Create new users
  - `deleteUser` - Delete a user
  - `changeUserRole` - Change a user's role

- **Project Tools**:

  - `createProject` - Create a new project
  - `updateProject` - Update a project
  - `deleteProject` - Delete a project

- **Variable Tools**:

  - `createVariable` - Create a new variable
  - `deleteVariable` - Delete a variable

- **Source Control Tools**:

  - `pullFromSourceControl` - Pull changes from source control

- **Audit Tools**:
  - `generateAudit` - Generate a security audit

## Testing

You can test the server using:

1. The MCP Inspector tool
2. Any MCP client implementation
3. Visit http://localhost:3000 for a simple web interface with information
4. Use the HTTP streaming tests in the `tests/http-streaming` directory:
   - `curl-tests.md` - cURL commands for testing the server
   - `fetch-test.js` - Node.js fetch-based tests for the server

To run the tests:

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm run test:coverage

# Basic HTTP tests
pnpm run test:http

# Execution tests
pnpm run test:execution

# Credential tests
pnpm run test:credential
```

### Code Quality

We use ESLint and Prettier to maintain code quality:

```bash
# Run linting
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Check formatting
pnpm run format:check

# Fix formatting
pnpm run format
```

### Continuous Integration

This project uses GitHub Actions for continuous integration. The following workflows are configured:

- **CI**: Builds and tests the project on multiple Node.js versions
- **Code Quality**: Runs ESLint and Prettier checks
- **Security Scan**: Performs security scanning with npm audit and GitHub CodeQL
- **Dependency Review**: Analyzes dependencies for security vulnerabilities
- **Docker**: Builds and publishes Docker images to GitHub Container Registry
- **Documentation**: Generates and publishes documentation to GitHub Pages
- **Release**: Automates the release process when version tags are pushed

## Integration with Claude Desktop/Cursor

### Claude Desktop Configuration

There are two ways to use the n8n MCP server with Claude Desktop:

#### Option 1: HTTP Endpoint (External Server)

1. Start the server using one of the methods described above
2. Add the following to your Claude Desktop configuration file:

```json
{
  "mcp": {
    "servers": {
      "n8n": {
        "endpoint": "http://localhost:3000/mcp"
      }
    }
  }
}
```

3. Restart Claude Desktop to apply the changes

This configuration tells Claude Desktop to connect to the MCP server via HTTP at the specified URL. The server must be running before you start Claude Desktop.

#### Option 2: Docker Container (Recommended)

You can configure Claude Desktop to start the Docker container directly:

1. Build the bridge Docker image:

```bash
docker build -t n8n-mcp-bridge .
```

2. Add the following to your Claude Desktop configuration file:

```json
{
  "mcp": {
    "servers": {
      "n8n": {
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-p",
          "3003:3000",
          "-v",
          "n8n_mcp_cache:/app/cache",
          "-e",
          "N8N_API_URL=https://your-n8n-instance.com/api/v1",
          "-e",
          "N8N_API_KEY=your-n8n-api-key",
          "n8n-mcp-bridge"
        ]
      }
    }
  }
}
```

3. Replace `https://your-n8n-instance.com/api/v1` and `your-n8n-api-key` with your actual n8n API URL and key
4. Restart Claude Desktop to apply the changes

This configuration tells Claude Desktop to start the Docker container when needed and communicate with it directly. This is the recommended approach as it ensures the server is always available when Claude needs it.

### Example Prompts

Once configured, you can interact with your n8n instance through Claude using natural language:

#### Workflow Management

```
Show me all my workflows.
```

To see all workflows, access the n8n://workflows resource.

```
Create a new workflow named "Email Processing" that triggers when an email is received.
```

Use the createWorkflow tool with a name and nodes array.

```
Activate the workflow with ID "abc123".
```

Use the activateWorkflow tool with the workflowId parameter.

#### Tag Management

```
Show me all tags.
```

Access the n8n://tags resource to see all tags.

```
Create a new tag called "Production".
```

Use the createTag tool with the name parameter.

```
Add the "Production" tag to workflow "abc123".
```

Use the updateWorkflowTags tool with workflowId and tagIds parameters.

#### Execution Management

```
Show me recent executions of workflow "abc123".
```

Access the n8n://executions resource to see all executions.

```
Execute workflow "abc123" with this input data: {"email": "test@example.com"}.
```

Use the executeWorkflow tool with workflowId and params parameters.

#### Credential Management

```
Show me the schema for Google Drive credentials.
```

Access the n8n://credentials/schema/{credentialTypeName} resource.

```
Create a new credential for Google Drive called "My Drive".
```

Use the createCredential tool with name, type, and data parameters.

For more detailed examples, see [CLAUDE_CURSOR_EXAMPLES.md](CLAUDE_CURSOR_EXAMPLES.md).

## Integration with Augment

You can use this MCP server with Augment to manage your n8n workflows directly from VS Code.

### Setting up with Augment

1. Install the Augment extension in VS Code
2. Build the n8n-mcp-bridge Docker image:
   ```bash
   docker build -t n8n-mcp-bridge .
   ```
3. Configure Augment to use the n8n-mcp server

#### Option 1: Using the Augment Settings Panel (Recommended)

1. Open VS Code
2. Click on the Augment icon in the sidebar
3. Click on the gear icon in the upper right of the Augment panel to open the settings
4. In the MCP servers section, add a new server with the following configuration:
   - Name: n8n-mcp-bridge
   - Command: docker
   - Args: run -i --rm -p 3003:3000 -e N8N_API_URL=https://your-n8n-instance.cloud/api/v1 -e N8N_API_KEY=your-api-key-here n8n-mcp-bridge

#### Option 2: Editing settings.json Directly

Add the following configuration to your VS Code settings.json file:

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "n8n-mcp-bridge",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-p",
        "3003:3000",
        "-v",
        "n8n_mcp_cache:/app/cache",
        "-e",
        "N8N_API_URL=https://your-n8n-instance.cloud/api/v1",
        "-e",
        "N8N_API_KEY=your-api-key-here",
        "n8n-mcp-bridge"
      ]
    }
  ]
}
```

### Using with Augment

Once configured, you can interact with your n8n instance through Augment using natural language:

1. Open the Augment panel in VS Code
2. Start a new chat and ask about n8n workflows, for example:
   - "List all my n8n workflows"
   - "Create a new workflow that sends an email when a file is uploaded"
   - "Update the workflow named 'Daily Report' to run at 9 AM"

For more detailed setup instructions, see [AUGMENT_SETUP.md](AUGMENT_SETUP.md).

## Next Steps

This implementation can be extended to:

- Add authentication and authorization
- Enhance error handling and validation
- Implement real-time updates using SSE
- Add more comprehensive testing
- Implement additional n8n API endpoints as they become available

## License

This project is licensed under the MIT License with Attribution - see the [LICENSE](LICENSE) file for details.

### Attribution Requirements

Any use of this software in a publicly accessible product or service must include visible attribution to "CTK Advisors n8n-mcp" with a link to this repository.
