import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { n8nServiceV2 } from "../../services/n8nServiceV2.js";

// Define schemas for source control operations
const pullSchema = {
  force: z.boolean().optional(),
  variables: z.record(z.string()).optional(),
};

/**
 * Register source control-related tools with the MCP server
 * @param server The MCP server
 */
export function registerSourceControlTools(server: McpServer): void {
  // POST /source-control/pull - Pull changes from the remote repository
  server.tool(
    "pullFromSourceControl",
    "Pulls changes from the remote repository. Optional parameters: force (boolean) and variables (record).",
    pullSchema,
    async (args) => {
      try {
        const { force, variables } = args;
        const result = await n8nServiceV2.pullFromSourceControl({
          force,
          variables,
        });

        // Format the result for better readability
        const formattedResult = {
          variables: result.variables
            ? `Added: ${result.variables.added?.length || 0}, Changed: ${
                result.variables.changed?.length || 0
              }`
            : "None",
          credentials: result.credentials
            ? `${result.credentials.length} credential(s)`
            : "None",
          workflows: result.workflows
            ? `${result.workflows.length} workflow(s)`
            : "None",
          tags: result.tags?.tags
            ? `${result.tags.tags.length} tag(s)`
            : "None",
        };

        return {
          content: [
            {
              type: "text",
              text: `Successfully pulled from source control:\n${JSON.stringify(
                formattedResult,
                null,
                2
              )}`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error pulling from source control:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error pulling from source control: ${
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
