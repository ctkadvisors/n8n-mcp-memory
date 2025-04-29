/**
 * HTTP Streaming Tests for Credential Endpoints
 * 
 * This file contains tests for the MCP HTTP Streaming server's credential endpoints.
 * Run with: node tests/http-streaming/credential-test.js
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
    console.log('=== MCP HTTP Streaming Credential Tests ===');
    
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
        'X-Session-Id': sessionId,
        'Mcp-Session-Id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'Credential Test Client',
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
    
    // Get credential schema
    console.log('\n=== FETCHING CREDENTIAL SCHEMA ===');
    try {
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const schemaResponse = await fetch('http://localhost:3000/mcp', {
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
            uri: 'n8n://credentials/schema/n8nApi'
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const schemaText = await schemaResponse.text();
      console.log('Credential schema response:', schemaText);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Credential schema request timed out - this is expected if no n8n instance is available');
      } else {
        console.error('Error fetching credential schema:', error);
      }
    }
    
    // Create a credential
    console.log('\n=== CREATING CREDENTIAL ===');
    try {
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const createResponse = await fetch('http://localhost:3000/mcp', {
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
          method: 'useTool',
          params: {
            name: 'createCredential',
            args: {
              name: 'Test Credential',
              type: 'n8nApi',
              data: {
                apiKey: 'test-api-key',
                baseUrl: 'https://example.com/api/v1'
              }
            }
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const createText = await createResponse.text();
      console.log('Create credential response:', createText);
      
      // Parse the response to get the credential ID
      let credentialId = null;
      try {
        const createData = JSON.parse(createText);
        if (createData.result && createData.result.data && createData.result.data.id) {
          credentialId = createData.result.data.id;
          console.log('Created credential ID:', credentialId);
          
          // Delete the credential
          console.log('\n=== DELETING CREDENTIAL ===');
          const deleteController = new AbortController();
          const deleteTimeoutId = setTimeout(() => deleteController.abort(), 5000);
          
          const deleteResponse = await fetch('http://localhost:3000/mcp', {
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
                name: 'deleteCredential',
                args: {
                  credentialId: credentialId
                }
              }
            }),
            signal: deleteController.signal
          });
          
          clearTimeout(deleteTimeoutId);
          const deleteText = await deleteResponse.text();
          console.log('Delete credential response:', deleteText);
        }
      } catch (error) {
        console.error('Error parsing create credential response:', error);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Create credential request timed out - this is expected if no n8n instance is available');
      } else {
        console.error('Error creating credential:', error);
      }
    }

    console.log('\n=== TESTS COMPLETED ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
