# Setting up n8n-mcp with Augment

This guide will help you set up the n8n-mcp server with Augment to enable n8n workflow management directly from Augment.

## Prerequisites

1. Docker installed on your machine
2. n8n-mcp-bridge Docker image built
3. Augment extension installed in VS Code
4. n8n API key

## Building the n8n-mcp Docker Image

If you haven't already built the Docker image, run the following command in the project directory:

```bash
docker build -t n8n-mcp-bridge .
```

## Configuring Augment

There are two ways to configure MCP servers in Augment:

### Option 1: Using the Augment Settings Panel (Recommended)

1. Open VS Code
2. Click on the Augment icon in the sidebar
3. Click on the gear icon in the upper right of the Augment panel to open the settings
4. In the MCP servers section, add a new server with the following configuration:
   - Name: n8n-mcp-bridge
   - Command: docker
   - Args: run -i --rm -p 3003:3000 -v n8n_mcp_cache:/app/cache -e N8N_API_URL=https://your-n8n-instance.cloud/api/v1 -e N8N_API_KEY=your-api-key-here n8n-mcp-bridge

### Option 2: Editing settings.json Directly

1. Press Cmd/Ctrl+Shift+P to open the command palette
2. Type "Preferences: Open Settings (JSON)" and select it
3. Add the following configuration to your settings.json file:

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

## Persistent Storage

The Docker container is configured with a volume for `/app/cache` to ensure that documentation and other cached data persists between container restarts. This means:

- Node documentation fetched from the n8n website is cached and reused
- Knowledge and "memories" are preserved when the container is restarted
- You don't need to re-download documentation each time you restart the container

The volume is created automatically with the `-v n8n_mcp_cache:/app/cache` parameter in the Docker run command.

## Persistent Storage

The Docker container is configured with a volume for `/app/cache` to ensure that documentation and other cached data persists between container restarts. This means:

- Node documentation fetched from the n8n website is cached and reused
- Knowledge and "memories" are preserved when the container is restarted
- You don't need to re-download documentation each time you restart the container

The volume is created automatically with the `-v n8n_mcp_cache:/app/cache` parameter in the Docker run command.

## Testing the Integration

1. Restart VS Code after adding the configuration
2. Open the Augment panel
3. Start a new chat and ask about n8n workflows, for example:
   - "List all my n8n workflows"
   - "Create a new workflow that sends an email when a file is uploaded"
   - "Update the workflow named 'Daily Report' to run at 9 AM"

## Troubleshooting

If you encounter issues with the integration:

1. Check that the Docker container is running:

   ```bash
   docker ps | grep n8n-mcp-bridge
   ```

2. Check the logs of the Docker container:

   ```bash
   docker logs $(docker ps -q --filter ancestor=n8n-mcp-bridge)
   ```

3. Verify that your n8n API key is correct and has the necessary permissions

4. Make sure the port 3003 is not being used by another application

## Available Tools

The n8n-mcp integration provides the following tools:

1. Workflow Management:

   - List workflows
   - Get workflow details
   - Create workflows
   - Update workflows
   - Delete workflows
   - Execute workflows
   - Activate/deactivate workflows

2. Documentation:
   - Get node documentation
   - Search node documentation
   - List node types
   - Fetch node documentation (self-fetching)
   - Update documentation

For more information on how to use these tools, start a chat with Augment and ask for help with n8n workflows.
