#!/usr/bin/env node

// This is the development version of the bridge script
// It is used for local development and testing
// For Docker container deployment, see mcp-bridge.js.new

import http from 'http';
import { spawn } from 'child_process';
import readline from 'readline';

// Start the n8n-mcp server in the background
console.error('Starting n8n-mcp server...');
const server = spawn('node', ['dist/server.js'], {
  stdio: 'ignore',
  detached: true,
});

// Generate a UUID for the session ID
// This is important as the server expects a specific format
const sessionId = '00000000-0000-0000-0000-000000000000';
console.error(`Using session ID: ${sessionId}`);

// Give the server a moment to start up
setTimeout(async () => {
  console.error('Server started, setting up bridge...');

  // Create readline interface for stdin only
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  // Ping the server to make sure it's ready
  try {
    await sendToHttpServer({
      jsonrpc: '2.0',
      method: 'ping',
      params: {},
      id: 'ping-1',
    });
    console.error('Server is ready to receive messages');
  } catch (error) {
    console.error(`Failed to ping server: ${error.message}`);
    console.error('Continuing anyway, but there might be issues...');
  }

  // Listen for messages from Claude Desktop
  rl.on('line', async (line) => {
    try {
      // Parse the incoming message
      const message = JSON.parse(line);
      console.error(`Received message: ${line}`);

      // Check if this is a notification (no id)
      if (message.method && message.method.startsWith('notifications/')) {
        console.error(`Handling notification: ${message.method}`);

        // Special handling for notifications/initialized
        if (message.method === 'notifications/initialized') {
          console.error('Handling notifications/initialized specially');
          try {
            const response = await sendToHttpServer(message);
            console.error(`Got notifications/initialized response: ${JSON.stringify(response)}`);
            // No need to send a response back to Claude Desktop for notifications
          } catch (error) {
            console.error(`Error sending notifications/initialized: ${error.message}`);
          }
        } else {
          // For other notifications, we don't need to send a response
          // Just forward to the HTTP server and ignore the response
          sendToHttpServer(message).catch((error) => {
            console.error(`Error forwarding notification: ${error.message}`);
          });
        }
        return;
      }

      // Special handling for initialize request
      if (message.method === 'initialize') {
        console.error('Handling initialize request');
        try {
          const response = await sendToHttpServer(message);
          console.error(`Got initialize response: ${JSON.stringify(response)}`);
          console.log(JSON.stringify(response));
        } catch (error) {
          console.error(`Error sending initialize request: ${error.message}`);
          console.log(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: `Internal error: ${error.message}`,
              },
              id: message.id || null,
            })
          );
        }
        return;
      }

      // Special handling for tools/list and resources/list
      if (message.method === 'tools/list' || message.method === 'resources/list') {
        console.error(`Handling ${message.method} request specially`);
        try {
          const response = await sendToHttpServer(message);
          console.error(`Got ${message.method} response: ${JSON.stringify(response)}`);
          console.log(JSON.stringify(response));
        } catch (error) {
          console.error(`Error sending ${message.method} request: ${error.message}`);
          console.log(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: `Internal error: ${error.message}`,
              },
              id: message.id || null,
            })
          );
        }
        return;
      }

      // Forward the message to the HTTP server
      try {
        const response = await sendToHttpServer(message);
        console.error(`Got response: ${JSON.stringify(response)}`);

        // Make sure the response has the correct ID from the original message
        if (response && !response.id && message.id) {
          response.id = message.id;
        }

        // Send the response back to Claude Desktop
        console.log(JSON.stringify(response));
      } catch (error) {
        console.error(`Error sending to HTTP server: ${error.message}`);
        // Send error response
        console.log(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: `Internal error: ${error.message}`,
            },
            id: message.id || null,
          })
        );
      }
    } catch (error) {
      console.error(`Error parsing message: ${error.message}`);
      // Send error response for parse errors
      console.log(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: `Parse error: ${error.message}`,
          },
          id: null,
        })
      );
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.error('Received SIGINT, shutting down...');
    server.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error('Received SIGTERM, shutting down...');
    server.kill();
    process.exit(0);
  });

  // Send initialization success message
  console.error('Bridge ready to process messages');
}, 2000); // Wait 2 seconds for the server to start

// Function to send messages to the HTTP server
async function sendToHttpServer(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(message);
    console.error(`Sending to HTTP server: ${data}`);

    // Log the session ID being used
    console.error(`Using session ID for request: ${sessionId}`);

    // According to the MCP spec, the session ID should be in the mcp-session-id header
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        Accept: 'application/json, text/event-stream',
        // IMPORTANT: The header must be lowercase as that's what the server expects
        'mcp-session-id': sessionId,
      },
    };

    // Log the complete request details for debugging
    console.error('HTTP Request Details:');
    console.error(`Method: ${options.method}`);
    console.error(`Path: ${options.path}`);
    console.error('Headers:');
    for (const [key, value] of Object.entries(options.headers)) {
      console.error(`  ${key}: ${value}`);
    }
    console.error(`Body: ${data}`);

    const req = http.request(options, (res) => {
      let responseData = '';

      // Log response headers
      console.error('Response Headers:');
      for (const [key, value] of Object.entries(res.headers)) {
        console.error(`  ${key}: ${value}`);
      }
      console.error(`Status Code: ${res.statusCode}`);

      res.on('data', (chunk) => {
        responseData += chunk;
        console.error(`Received chunk: ${chunk}`);
      });

      res.on('end', () => {
        try {
          console.error(`Complete response: ${responseData}`);

          // If this is a notification, we don't need to parse the response
          if (message.method && message.method.startsWith('notifications/')) {
            resolve({ jsonrpc: '2.0', result: null, id: null });
            return;
          }

          // Check if this is an SSE response
          if (responseData.includes('event: message') && responseData.includes('data:')) {
            // Parse the SSE response
            const dataMatches = responseData.match(/data: ({.*})/g);
            if (dataMatches && dataMatches.length > 0) {
              // Extract the JSON data from the last data: line
              const lastDataMatch = dataMatches[dataMatches.length - 1];
              const jsonStr = lastDataMatch.substring(6).trim();
              try {
                const parsedData = JSON.parse(jsonStr);
                console.error(`Successfully parsed SSE data: ${JSON.stringify(parsedData)}`);
                resolve(parsedData);
                return;
              } catch (e) {
                console.error(`Failed to parse SSE data: ${e.message}`);
                // Continue to try other parsing methods
              }
            }
          }

          // Try to parse as direct JSON response
          if (responseData.trim()) {
            try {
              const parsedData = JSON.parse(responseData);
              console.error(`Successfully parsed direct JSON: ${JSON.stringify(parsedData)}`);
              resolve(parsedData);
              return;
            } catch (e) {
              console.error(`Failed to parse as direct JSON: ${e.message}`);
              // Continue to try other parsing methods
            }
          }

          // For notifications or methods that don't require a response
          if (
            message.method &&
            (message.method.startsWith('notifications/') || message.method === 'shutdown')
          ) {
            resolve({ jsonrpc: '2.0', result: null, id: message.id || null });
            return;
          }

          // If we got here, we couldn't parse the response
          reject(new Error(`Could not parse response: ${responseData}`));
        } catch (error) {
          console.error(`Error parsing response: ${error.message}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`HTTP request error: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}
