# Using n8n MCP Integration with Claude and Cursor

This guide provides examples of how to use the n8n MCP integration with Claude Desktop and Cursor. These examples demonstrate how to interact with your n8n instance through natural language.

## Setup

Before you can use the n8n MCP integration with Claude or Cursor, you need to:

1. Start the n8n MCP server:
   ```bash
   # Using npm
   npm run build
   npm run start:server
   
   # Or using Docker
   docker-compose up
   ```

2. Configure Claude Desktop or Cursor to use the MCP server:
   - In Claude Desktop: Go to Settings > Integrations > Add Custom Integration > Enter `http://localhost:3000/mcp` as the endpoint
   - In Cursor: Configure the MCP integration in the settings with `http://localhost:3000/mcp` as the endpoint

3. Make sure your n8n instance is running and accessible, and that you've set the correct environment variables:
   ```
   N8N_API_URL=https://your-n8n-instance.com/api/v1
   N8N_API_KEY=your-n8n-api-key
   ```

## Example Prompts for Claude/Cursor

Here are examples of natural language prompts you can use with Claude or Cursor to interact with your n8n instance:

### Workflow Management

#### List Workflows

```
Show me all the workflows in my n8n instance.
```

Claude will use the MCP integration to fetch and display all workflows from your n8n instance.

#### Get Workflow Details

```
Show me the details of the workflow with ID "abc123".
```

Claude will fetch and display the details of the specified workflow.

#### Create a Workflow

```
Create a new workflow in n8n with the name "Email Processing" and the following nodes:
- Start node: When an email is received
- Filter node: Only process emails with attachments
- Save node: Save attachments to Google Drive
```

Claude will create a new workflow with the specified configuration.

#### Update a Workflow

```
Update the workflow with ID "abc123" to add a new node that sends a Slack notification after saving attachments.
```

Claude will update the specified workflow with the new node.

#### Activate/Deactivate a Workflow

```
Activate the workflow with ID "abc123".
```

or

```
Deactivate the workflow with ID "abc123".
```

Claude will activate or deactivate the specified workflow.

### Tag Management

#### List Tags

```
Show me all the tags in my n8n instance.
```

Claude will fetch and display all tags from your n8n instance.

#### Create a Tag

```
Create a new tag in n8n with the name "Production".
```

Claude will create a new tag with the specified name.

#### Update Workflow Tags

```
Add the tag "Production" to the workflow with ID "abc123".
```

Claude will update the tags for the specified workflow.

### Execution Management

#### List Executions

```
Show me the recent executions of the workflow with ID "abc123".
```

Claude will fetch and display recent executions of the specified workflow.

#### Execute a Workflow

```
Execute the workflow with ID "abc123" with the following input data:
{
  "email": "test@example.com",
  "subject": "Test Email"
}
```

Claude will execute the specified workflow with the provided input data.

### Credential Management

#### Get Credential Schema

```
Show me the schema for the "Google Drive" credential type.
```

Claude will fetch and display the schema for the specified credential type.

#### Create a Credential

```
Create a new credential for Google Drive with the following details:
- Name: "My Google Drive"
- Client ID: "client-id-here"
- Client Secret: "client-secret-here"
```

Claude will create a new credential with the specified details.

### User Management

#### List Users

```
Show me all the users in my n8n instance.
```

Claude will fetch and display all users from your n8n instance.

#### Create a User

```
Create a new user in n8n with the email "user@example.com" and the role "global:member".
```

Claude will create a new user with the specified details.

### Project Management

#### List Projects

```
Show me all the projects in my n8n instance.
```

Claude will fetch and display all projects from your n8n instance.

#### Create a Project

```
Create a new project in n8n with the name "Marketing Automation".
```

Claude will create a new project with the specified name.

### Variable Management

#### List Variables

```
Show me all the variables in my n8n instance.
```

Claude will fetch and display all variables from your n8n instance.

#### Create a Variable

```
Create a new variable in n8n with the key "API_KEY" and the value "my-secret-api-key".
```

Claude will create a new variable with the specified key and value.

### Source Control

#### Pull Changes

```
Pull the latest changes from the source control repository for my n8n instance.
```

Claude will pull the latest changes from the source control repository.

### Security Audit

#### Generate Audit

```
Generate a security audit for my n8n instance.
```

Claude will generate a security audit for your n8n instance.

## Advanced Examples

### Multi-step Workflow Creation

```
I want to create a complete workflow for processing customer feedback. Here's what it should do:

1. Trigger when a new response is submitted to a Google Form
2. Extract the feedback text and customer email
3. Analyze the sentiment of the feedback using the OpenAI API
4. If the sentiment is negative, create a ticket in Zendesk
5. If the sentiment is positive, save it to a Google Sheet
6. Send a thank you email to the customer in either case

Can you create this workflow in my n8n instance?
```

Claude will create a complex workflow with multiple nodes and logic.

### Workflow Troubleshooting

```
The workflow with ID "abc123" failed in its last execution. Can you help me troubleshoot what went wrong?
```

Claude will fetch the execution details, analyze the error, and suggest possible solutions.

### Workflow Migration

```
I need to transfer the workflow with ID "abc123" from my development project to my production project with ID "prod456". Can you help me with that?
```

Claude will help you transfer the workflow between projects.

## Tips for Effective Use

1. **Be Specific**: Provide as much detail as possible in your requests, including IDs, names, and configurations.

2. **Use Step-by-Step Approaches**: For complex tasks, break them down into smaller steps and guide Claude through each step.

3. **Ask for Verification**: After Claude performs an action, ask it to verify that the action was successful by fetching the updated data.

4. **Provide Context**: If you're working on a specific project or workflow, provide context to help Claude understand your needs better.

5. **Use JSON for Complex Data**: When providing complex data structures, use JSON format for clarity.

## Troubleshooting

If you encounter issues with the n8n MCP integration:

1. **Check Server Status**: Make sure the n8n MCP server is running and accessible.

2. **Verify Environment Variables**: Ensure that the `N8N_API_URL` and `N8N_API_KEY` environment variables are correctly set.

3. **Check n8n Instance**: Verify that your n8n instance is running and accessible.

4. **Review Logs**: Check the logs of the n8n MCP server for any error messages.

5. **Test with Simple Requests**: Start with simple requests (like listing workflows) to verify that the integration is working correctly.

6. **Check Permissions**: Ensure that the API key you're using has the necessary permissions to perform the requested actions.

## Security Considerations

When using the n8n MCP integration with Claude or Cursor, keep in mind:

1. **API Key Security**: The API key provides full access to your n8n instance. Keep it secure and don't share it.

2. **Sensitive Data**: Be cautious about sharing sensitive data in your prompts, as they may be stored in Claude's or Cursor's systems.

3. **Production Use**: Consider using a separate n8n instance or API key with limited permissions for integration with AI assistants in production environments.

4. **Regular Audits**: Regularly audit the actions performed through the integration to ensure they align with your security policies.
