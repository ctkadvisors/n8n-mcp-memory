/**
 * HTTP Streaming Tests using fetch
 *
 * This file contains tests for the MCP HTTP Streaming server using the fetch API.
 * Run with: node tests/http-streaming/fetch-test.js
 */

import fetch from 'node-fetch';

// Helper function to parse SSE response
function parseSSE(text) {
  const events = text.split('\n\n').filter(Boolean);
  const results = [];

  for (const event of events) {
    const lines = event.split('\n');
    const eventType = lines
      .find((line) => line.startsWith('event:'))
      ?.substring(7)
      .trim();
    const dataLine = lines.find((line) => line.startsWith('data:'));

    if (dataLine) {
      const data = dataLine.substring(5).trim();
      try {
        const jsonData = JSON.parse(data);
        results.push({ type: eventType, data: jsonData });
      } catch (_e) {
        results.push({ type: eventType, data });
      }
    }
  }

  return results;
}

async function main() {
  try {
    console.log('=== MCP HTTP Streaming Tests ===');

    // Create a session ID
    const sessionId = 'test-session-' + Date.now();
    console.log('Using session ID:', sessionId);

    // Initialize the client
    console.log('\n=== INITIALIZING SESSION ===');
    const initResponse = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'Fetch Test Client',
            version: '1.0.0',
          },
        },
      }),
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
        Accept: 'application/json, text/event-stream',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }),
    });

    console.log('Notification status:', notifyResponse.status);

    // Test the echo tool
    console.log('\n=== TESTING ECHO TOOL ===');
    const echoResponse = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'useTool',
        params: {
          name: 'echo',
          args: {
            message: 'Hello from fetch!',
          },
        },
      }),
    });

    const echoText = await echoResponse.text();
    console.log('Echo response:', echoText);

    // Test the greeting resource
    console.log('\n=== TESTING GREETING RESOURCE ===');
    const greetingResponse = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'readResource',
        params: {
          uri: 'greeting://hello',
        },
      }),
    });

    const greetingText = await greetingResponse.text();
    console.log('Greeting response:', greetingText);

    // Get all n8n workflows
    console.log('\n=== FETCHING ALL WORKFLOWS ===');
    const workflowsResponse = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'readResource',
        params: {
          uri: 'n8n://workflows',
        },
      }),
    });

    const workflowsText = await workflowsResponse.text();
    console.log('Workflows response:', workflowsText);

    console.log('\n=== TESTS COMPLETED ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
