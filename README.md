# n8n Memory Control Panel (MCP)

[![CI](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/ci.yml)
[![Docker Build](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/docker.yml/badge.svg)](https://github.com/ctkadvisors/n8n-mcp-memory/actions/workflows/docker.yml)

A Model Context Protocol (MCP) server that provides AI assistants with access to n8n automation platform.

## Features

- Complete n8n API integration
- Works with Claude Desktop and Augment
- Supports all n8n resources: workflows, tags, credentials, users, projects, variables
- Enables AI assistants to create, update, and execute n8n workflows

## Quick Start

### Using Docker

```bash
docker run -p 3000:3000 \
  -e N8N_API_URL=https://your-n8n-instance.com/api/v1 \
  -e N8N_API_KEY=your-n8n-api-key \
  -v n8n_mcp_cache:/app/cache \
  ghcr.io/ctkadvisors/n8n-mcp-memory:main
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/ctkadvisors/n8n-mcp-memory.git
cd n8n-mcp-memory

# Install dependencies
pnpm install

# Set environment variables
echo "N8N_API_URL=https://your-n8n-instance.com/api/v1" > .env
echo "N8N_API_KEY=your-n8n-api-key" >> .env

# Build and start the server
pnpm run build
pnpm run start:server
```

## Integration with AI Assistants

### Claude Desktop

Add to your Claude Desktop configuration:

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

### Augment (VS Code)

Configure in Augment settings:

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "n8n-mcp",
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "-p", "3000:3000",
        "-e", "N8N_API_URL=https://your-n8n-instance.com/api/v1",
        "-e", "N8N_API_KEY=your-n8n-api-key",
        "ghcr.io/ctkadvisors/n8n-mcp-memory:main"
      ]
    }
  ]
}
```

## Resources and Tools

The server provides access to n8n resources through URI patterns:

- `n8n://workflows` - List all workflows
- `n8n://tags` - List all tags
- `n8n://executions` - List all executions
- `n8n://users` - List all users
- `n8n://projects` - List all projects
- `n8n://variables` - List all variables

And tools for performing actions:

- Workflow management (create, update, delete, activate)
- Tag management (create, update, delete)
- Execution management (run workflows, delete executions)
- Credential management (create, delete, transfer)
- User management (create, delete, change roles)
- Project management (create, update, delete)
- Variable management (create, delete)
- Source control integration (pull changes)
- Security audit generation

## License

MIT License with Attribution - see [LICENSE](LICENSE) file for details.
