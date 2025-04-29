import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { n8nServiceV2 } from "../../services/n8nServiceV2.js";
import { formatError } from "../../utils/errorHandling.js";

// Define schemas for workflow-related operations
const workflowSettingsSchema = z.object({
  saveExecutionProgress: z.boolean().optional(),
  saveManualExecutions: z.boolean().optional(),
  saveDataErrorExecution: z.enum(["all", "none"]).optional(),
  saveDataSuccessExecution: z.enum(["all", "none"]).optional(),
  executionTimeout: z.number().optional(),
  errorWorkflow: z.string().optional(),
  timezone: z.string().optional(),
  executionOrder: z.string().optional(),
});

const workflowSchema = {
  name: z.string(),
  nodes: z.array(z.any()),
  connections: z.any(),
  settings: workflowSettingsSchema,
};

const workflowIdSchema = {
  workflowId: z.string(),
};

const tagIdsSchema = {
  workflowId: z.string(),
  tagIds: z.array(
    z.object({
      id: z.string(),
    })
  ),
};

const transferWorkflowSchema = {
  workflowId: z.string(),
  destinationProjectId: z.string(),
};

/**
 * Register workflow-related tools with the MCP server
 * @param server The MCP server
 */
export function registerWorkflowTools(server: McpServer): void {
  // GET /workflows - List all workflows
  server.tool(
    "listWorkflows",
    "Lists all workflows in your n8n instance. Optional parameters: active, tags, name, projectId.",
    {
      active: z.boolean().optional(),
      tags: z.string().optional(),
      name: z.string().optional(),
      projectId: z.string().optional(),
      excludePinnedData: z.boolean().optional(),
      limit: z.number().optional(),
      cursor: z.string().optional(),
    },
    async (args) => {
      try {
        const result = await n8nServiceV2.getWorkflows(args || {});

        // Format the workflow data for better readability
        const formattedWorkflows = result.data.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          active: workflow.active,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          tags: workflow.tags?.map((tag) => tag.name) || [],
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${result.data.length} workflows`,
            },
            {
              type: "text",
              text: JSON.stringify(formattedWorkflows, null, 2),
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error("Error listing workflows:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error listing workflows: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // GET /workflows/{id} - Get a workflow by ID
  server.tool(
    "getWorkflowDetails",
    "Gets detailed information about a specific workflow by ID.",
    {
      workflowId: z.string(),
      excludePinnedData: z.boolean().optional(),
    },
    async (args) => {
      try {
        const { workflowId, excludePinnedData } = args;
        const workflow = await n8nServiceV2.getWorkflow(
          workflowId,
          excludePinnedData
        );

        // Format the workflow data for better readability
        const formattedWorkflow = {
          id: workflow.id,
          name: workflow.name,
          active: workflow.active,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          tags: workflow.tags?.map((tag) => tag.name) || [],
          nodeCount: workflow.nodes?.length || 0,
          nodes: workflow.nodes?.map((node) => ({
            id: node.id,
            name: node.name,
            type: node.type,
            disabled: node.disabled || false,
          })),
          settings: workflow.settings,
        };

        return {
          content: [
            {
              type: "text",
              text: `Workflow details for: ${workflow.name} (ID: ${workflow.id})`,
            },
            {
              type: "text",
              text: JSON.stringify(formattedWorkflow, null, 2),
            },
          ],
          data: workflow,
        };
      } catch (error) {
        console.error(`Error getting workflow details:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error getting workflow details: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
  // POST /workflows - Create a workflow
  server.tool(
    "createWorkflow",
    `Creates a new workflow in n8n. Provide a complete workflow definition in a single call.

IMPORTANT: Create the entire workflow in one step rather than adding nodes incrementally.

CRITICAL FORMAT REQUIREMENTS:
1. The connections and settings properties must be actual JSON objects, not strings
2. Do not use backticks around property names or values
3. Use double quotes for all JSON property names and string values
4. Ensure all JSON is properly formatted

VALID SETTINGS PROPERTIES:
The settings object can only include these properties:
- saveExecutionProgress (boolean)
- saveManualExecutions (boolean)
- saveDataErrorExecution ("all" or "none")
- saveDataSuccessExecution ("all" or "none")
- executionTimeout (number)
- errorWorkflow (string)
- timezone (string)
- executionOrder (string)

Example format:
{
  "name": "My Workflow",
  "nodes": [
    {
      "id": "node1",
      "name": "Start Node",
      "type": "n8n-nodes-base.manualTrigger",
      "parameters": {},
      "typeVersion": 1,
      "position": [100, 200]
    },
    {
      "id": "node2",
      "name": "Second Node",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "number": [
            {
              "name": "value",
              "value": 123
            }
          ]
        }
      },
      "typeVersion": 1,
      "position": [300, 200]
    }
  ],
  "connections": {
    "Start Node": {
      "main": [
        [
          {
            "node": "Second Node",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "saveExecutionProgress": true,
    "saveManualExecutions": true
  }
}

Notes:
1. Each node must have a unique ID
2. Node positions should be spaced out (typically 200 units apart)
3. Connections must use the node names (not IDs) as keys
4. The connections object structure is critical - follow the example exactly
5. The connections and settings must be actual JSON objects, not strings
6. Do not include properties like "callerPolicy" or other non-standard properties in the settings object`,
    workflowSchema,
    async (args) => {
      try {
        // Ensure required properties are present and properly formatted
        let connections = args.connections || {};
        let settings = args.settings || {};

        // Handle case where connections or settings are provided as strings
        if (typeof connections === "string") {
          try {
            connections = JSON.parse(connections);
          } catch (e) {
            console.error("Error parsing connections string:", e);
            return {
              content: [
                {
                  type: "text",
                  text: `Error creating workflow: connections must be a valid JSON object, not a string. Please remove quotes/backticks around the connections object.`,
                },
              ],
              isError: true,
            };
          }
        }

        if (typeof settings === "string") {
          try {
            settings = JSON.parse(settings);
          } catch (e) {
            console.error("Error parsing settings string:", e);
            return {
              content: [
                {
                  type: "text",
                  text: `Error creating workflow: settings must be a valid JSON object, not a string. Please remove quotes/backticks around the settings object.`,
                },
              ],
              isError: true,
            };
          }
        }

        // Log the workflow data for debugging
        console.log(
          "Creating workflow with data:",
          JSON.stringify(
            {
              name: args.name,
              nodesCount: args.nodes?.length || 0,
              connectionsType: typeof connections,
              settingsType: typeof settings,
            },
            null,
            2
          )
        );

        const workflow = {
          ...args,
          connections,
          settings,
        };

        // Log the full workflow object for debugging
        console.log(
          "Full workflow object:",
          JSON.stringify(
            {
              name: workflow.name,
              nodesCount: workflow.nodes?.length || 0,
              hasConnections:
                !!workflow.connections &&
                Object.keys(workflow.connections).length > 0,
              hasSettings:
                !!workflow.settings &&
                Object.keys(workflow.settings).length > 0,
            },
            null,
            2
          )
        );

        const result = await n8nServiceV2.createWorkflow(workflow);
        return {
          content: [
            {
              type: "text",
              text: `Workflow created successfully: ${result.id}`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error("Error creating workflow:", error);

        // Provide more detailed error information
        let errorMessage = "Error creating workflow: ";

        if (error instanceof Error) {
          errorMessage += error.message;
        } else if (typeof error === "object") {
          try {
            errorMessage += JSON.stringify(error, null, 2);
          } catch (e) {
            errorMessage += "Unserializable error object";
          }
        } else {
          errorMessage += String(error);
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // PUT /workflows/{id} - Update a workflow
  server.tool(
    "updateWorkflow",
    `Updates an existing workflow in n8n. Requires workflowId and workflowData.

IMPORTANT: You must provide the complete workflow definition in workflowData.

CRITICAL FORMAT REQUIREMENTS:
1. The connections and settings properties must be actual JSON objects, not strings
2. Do not use backticks around property names or values
3. Use double quotes for all JSON property names and string values
4. Ensure all JSON is properly formatted

VALID SETTINGS PROPERTIES:
The settings object can only include these properties:
- saveExecutionProgress (boolean)
- saveManualExecutions (boolean)
- saveDataErrorExecution ("all" or "none")
- saveDataSuccessExecution ("all" or "none")
- executionTimeout (number)
- errorWorkflow (string)
- timezone (string)
- executionOrder (string)

Best practice:
1. First get the current workflow details using getWorkflowDetails
2. Make your changes to the retrieved workflow data
3. Submit the complete updated workflow with all nodes and connections

Example:
{
  "workflowId": "123abc",
  "workflowData": {
    "name": "Updated Workflow Name",
    "nodes": [
      {
        "id": "node1",
        "name": "Start Node",
        "type": "n8n-nodes-base.manualTrigger",
        "parameters": {},
        "typeVersion": 1,
        "position": [100, 200]
      }
    ],
    "connections": {
      "Start Node": {
        "main": [[]]
      }
    },
    "settings": {
      "saveExecutionProgress": true
    }
  }
}

Note: Do not include properties like "callerPolicy" or other non-standard properties in the settings object`,
    {
      workflowId: z.string(),
      workflowData: z.object(workflowSchema).passthrough(),
    },
    async (args) => {
      try {
        const { workflowId, workflowData } = args;

        // Ensure required properties are present and properly formatted
        let connections = workflowData.connections || {};
        let settings = workflowData.settings || {};

        // Handle case where connections or settings are provided as strings
        if (typeof connections === "string") {
          try {
            connections = JSON.parse(connections);
          } catch (e) {
            console.error("Error parsing connections string:", e);
            return {
              content: [
                {
                  type: "text",
                  text: `Error updating workflow: connections must be a valid JSON object, not a string. Please remove quotes/backticks around the connections object.`,
                },
              ],
              isError: true,
            };
          }
        }

        if (typeof settings === "string") {
          try {
            settings = JSON.parse(settings);
          } catch (e) {
            console.error("Error parsing settings string:", e);
            return {
              content: [
                {
                  type: "text",
                  text: `Error updating workflow: settings must be a valid JSON object, not a string. Please remove quotes/backticks around the settings object.`,
                },
              ],
              isError: true,
            };
          }
        }

        const workflow = {
          ...workflowData,
          connections,
          settings,
        };

        try {
          // First attempt
          console.log(
            `Attempting to update workflow ${workflowId} (first attempt)`
          );
          const result = await n8nServiceV2.updateWorkflow(
            workflowId,
            workflow
          );

          return {
            content: [
              {
                type: "text",
                text: `Workflow ${workflowId} updated successfully`,
              },
            ],
            data: result,
          };
        } catch (firstError) {
          console.error(
            `Error on first attempt updating workflow:`,
            firstError
          );

          // If we get an empty response or timeout error, try again after a delay
          if (
            firstError instanceof Error &&
            (firstError.message.includes("Empty response") ||
              firstError.message.includes("timeout") ||
              firstError.message.includes("network"))
          ) {
            console.log(
              `Retrying workflow update after error: ${firstError.message}`
            );

            try {
              // Wait before retrying
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // Second attempt
              console.log(
                `Attempting to update workflow ${workflowId} (second attempt)`
              );
              const result = await n8nServiceV2.updateWorkflow(
                workflowId,
                workflow
              );

              return {
                content: [
                  {
                    type: "text",
                    text: `Workflow ${workflowId} updated successfully on second attempt`,
                  },
                ],
                data: result,
              };
            } catch (secondError) {
              console.error(
                `Error on second attempt updating workflow:`,
                secondError
              );

              // Try to get the workflow to see if the update actually succeeded
              try {
                console.log(
                  `Checking if workflow ${workflowId} was actually updated despite errors`
                );
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const checkResult = await n8nServiceV2.getWorkflow(workflowId);

                // Compare some key properties to see if the update took effect
                if (checkResult.name === workflow.name) {
                  console.log(
                    `Workflow appears to have been updated successfully despite errors`
                  );
                  return {
                    content: [
                      {
                        type: "text",
                        text: `Workflow ${workflowId} appears to have been updated successfully despite communication errors`,
                      },
                    ],
                    data: checkResult,
                  };
                }
              } catch (checkError) {
                console.error(`Error checking workflow status:`, checkError);
              }

              // If we get here, both attempts failed and the check didn't confirm success
              throw secondError;
            }
          } else {
            // If it's not an empty response or timeout error, rethrow the original error
            throw firstError;
          }
        }
      } catch (error) {
        console.error(`Error updating workflow:`, error);

        // Provide a more detailed error message
        let errorMessage = `Error updating workflow: `;

        if (error instanceof Error) {
          errorMessage += error.message;
        } else if (typeof error === "object") {
          try {
            errorMessage += JSON.stringify(error, null, 2);
          } catch (e) {
            errorMessage += "Unserializable error object";
          }
        } else {
          errorMessage += String(error);
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // DELETE /workflows/{id} - Delete a workflow
  server.tool(
    "deleteWorkflow",
    "Deletes a workflow from n8n. Requires workflowId.",
    workflowIdSchema,
    async (args) => {
      try {
        const { workflowId } = args;

        // Add a longer timeout for delete operations
        console.log(`Attempting to delete workflow ${workflowId}`);

        try {
          const result = await n8nServiceV2.deleteWorkflow(workflowId);
          return {
            content: [
              {
                type: "text",
                text: `Workflow ${workflowId} deleted successfully`,
              },
            ],
            data: result,
          };
        } catch (firstError) {
          console.error(
            `Error on first attempt deleting workflow:`,
            firstError
          );

          // If we get a timeout or network error, try again after a delay
          if (
            firstError instanceof Error &&
            (firstError.message.includes("timeout") ||
              firstError.message.includes("network"))
          ) {
            console.log(
              `Retrying workflow deletion after error: ${firstError.message}`
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Second attempt with longer timeout
            const result = await n8nServiceV2.deleteWorkflow(workflowId);
            return {
              content: [
                {
                  type: "text",
                  text: `Workflow ${workflowId} deleted successfully on second attempt`,
                },
              ],
              data: result,
            };
          }

          throw firstError;
        }
      } catch (error) {
        console.error(`Error deleting workflow:`, error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: "text",
              text: `Error deleting workflow: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // POST /workflows/{id}/activate - Activate a workflow
  server.tool(
    "activateWorkflow",
    "Activates a workflow in n8n so it can be triggered. Requires workflowId.",
    workflowIdSchema,
    async (args) => {
      try {
        const { workflowId } = args;
        const result = await n8nServiceV2.activateWorkflow(workflowId);
        return {
          content: [
            {
              type: "text",
              text: `Workflow ${workflowId} activated successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error activating workflow:`, error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: "text",
              text: `Error activating workflow: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // POST /workflows/{id}/deactivate - Deactivate a workflow
  server.tool(
    "deactivateWorkflow",
    "Deactivates a workflow in n8n so it won't be triggered. Requires workflowId.",
    workflowIdSchema,
    async (args) => {
      try {
        const { workflowId } = args;
        const result = await n8nServiceV2.deactivateWorkflow(workflowId);
        return {
          content: [
            {
              type: "text",
              text: `Workflow ${workflowId} deactivated successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error deactivating workflow:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error deactivating workflow: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // PUT /workflows/{id}/transfer - Transfer a workflow to another project
  server.tool(
    "transferWorkflow",
    "Transfers a workflow to another project. Requires workflowId and destinationProjectId.",
    transferWorkflowSchema,
    async (args) => {
      try {
        const { workflowId, destinationProjectId } = args;
        const result = await n8nServiceV2.transferWorkflow(
          workflowId,
          destinationProjectId
        );
        return {
          content: [
            {
              type: "text",
              text: `Workflow ${workflowId} transferred to project ${destinationProjectId} successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error transferring workflow:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error transferring workflow: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // PUT /workflows/{id}/tags - Update workflow tags
  server.tool(
    "updateWorkflowTags",
    "Updates the tags for a workflow. Requires workflowId and tagIds array.",
    tagIdsSchema,
    async (args) => {
      try {
        const { workflowId, tagIds } = args;
        const result = await n8nServiceV2.updateWorkflowTags(
          workflowId,
          tagIds
        );
        return {
          content: [
            {
              type: "text",
              text: `Tags for workflow ${workflowId} updated successfully`,
            },
          ],
          data: result,
        };
      } catch (error) {
        console.error(`Error updating tags for workflow:`, error);

        // Use the formatError utility to properly handle ApiError objects
        const errorMessage = formatError(error);

        return {
          content: [
            {
              type: "text",
              text: `Error updating tags for workflow: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
