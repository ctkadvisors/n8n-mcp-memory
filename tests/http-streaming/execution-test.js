/**
 * HTTP Streaming Tests for Execution Endpoints
 *
 * This file contains tests for the MCP HTTP Streaming server's execution endpoints.
 * Run with: node tests/http-streaming/execution-test.js
 */

import fetch from 'node-fetch';

// Helper function to parse SSE response
function parseSSE(text) {
  const events = text.split('\n\n').filter(Boolean);
  const results = [];

  for (const event of events) {
    const lines = event.split('\n');
    const eventType = lines.find(line => line.startsWith('event:'))?.substring(7).trim();
    const dataLine = lines.find(line => line.startsWith('data:'));

    if (dataLine) {
      const data = dataLine.substring(5).trim();
      try {
        const jsonData = JSON.parse(data);
        results.push({ type: eventType, data: jsonData });
      } catch (e) {
        results.push({ type: eventType, data });
      }
    }
  }

  return results;
}

async function main() {
  try {
    console.log('=== MCP HTTP Streaming Execution Tests ===');

    // Create a session ID
    const sessionId = 'test-session-' + Date.now();
    console.log('Using session ID:', sessionId);

    // Initialize the client
    console.log('\n=== INITIALIZING SESSION ===');
    const initResponse = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-Session-Id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'Execution Test Client',
            version: '1.0.0'
          }
        }
      })
    });

    console.log('Response status:', initResponse.status);

    // Handle SSE response
    const initText = await initResponse.text();
    const initEvents = parseSSE(initText);
    console.log('Initialization response:', JSON.stringify(initEvents, null, 2));

    // Send initialized notification
    console.log('\n=== SENDING INITIALIZED NOTIFICATION ===');
    const notifyResponse = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-Session-Id': sessionId,
        'Mcp-Session-Id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      })
    });

    console.log('Notification status:', notifyResponse.status);

    // Get all executions
    console.log('\n=== FETCHING ALL EXECUTIONS ===');
    try {
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const executionsResponse = await fetch('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'X-Session-Id': sessionId,
          'Mcp-Session-Id': sessionId
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'readResource',
          params: {
            uri: 'n8n://executions'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const executionsText = await executionsResponse.text();
      console.log('Executions response:', executionsText);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Executions request timed out - this is expected if no n8n instance is available');
      } else {
        console.error('Error fetching executions:', error);
      }
    }

    // Get all workflows to find a workflow ID for execution
    console.log('\n=== FETCHING ALL WORKFLOWS ===');
    let workflowsText = '';
    try {
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const workflowsResponse = await fetch('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'X-Session-Id': sessionId,
          'Mcp-Session-Id': sessionId
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'readResource',
          params: {
            uri: 'n8n://workflows'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      workflowsText = await workflowsResponse.text();
      console.log('Workflows response:', workflowsText);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Workflows request timed out - this is expected if no n8n instance is available');
      } else {
        console.error('Error fetching workflows:', error);
      }
    }

    // Parse the workflows response to get a workflow ID
    let workflowId = null;
    try {
      const workflowsData = JSON.parse(workflowsText);
      if (workflowsData.result && workflowsData.result.contents && workflowsData.result.contents.length > 0) {
        const workflowsContent = JSON.parse(workflowsData.result.contents[0].text);
        if (workflowsContent.data && workflowsContent.data.length > 0) {
          workflowId = workflowsContent.data[0].id;
          console.log('Found workflow ID for execution:', workflowId);
        }
      }
    } catch (error) {
      console.error('Error parsing workflows response:', error);
    }

    // Execute a workflow if we found a workflow ID
    if (workflowId) {
      console.log('\n=== EXECUTING WORKFLOW ===');
      try {
        // Set a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const executeResponse = await fetch('http://localhost:3000/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'X-Session-Id': sessionId,
            'Mcp-Session-Id': sessionId
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'useTool',
            params: {
              name: 'executeWorkflow',
              args: {
                workflowId: workflowId
              }
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const executeText = await executeResponse.text();
        console.log('Execute workflow response:', executeText);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Execute workflow request timed out - this is expected if no n8n instance is available');
        } else {
          console.error('Error executing workflow:', error);
        }
      }
    } else {
      console.log('No workflow ID found for execution test');
    }

    console.log('\n=== TESTS COMPLETED ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
