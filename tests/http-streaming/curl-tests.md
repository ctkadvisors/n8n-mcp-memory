# HTTP Streaming Tests with cURL

This file contains cURL commands for testing the MCP HTTP Streaming server.

## Initialize a Session

```bash
curl -X POST -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -H "X-Session-Id: test-session-curl" -d '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"Curl Test Client","version":"1.0.0"}}}' http://localhost:3000/mcp
```

Expected response:
```
event: message
data: {"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true},"resources":{"listChanged":true}},"serverInfo":{"name":"MCP HTTP Streaming Example with n8n Integration","version":"1.0.0"}},"jsonrpc":"2.0","id":0}
```

## Send Initialized Notification

```bash
curl -X POST -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -H "X-Session-Id: test-session-curl" -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' http://localhost:3000/mcp
```

## Use Echo Tool

```bash
curl -X POST -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -H "X-Session-Id: test-session-curl" -d '{"jsonrpc":"2.0","id":1,"method":"useTool","params":{"name":"echo","args":{"message":"Hello from curl!"}}}' http://localhost:3000/mcp
```

## Read Greeting Resource

```bash
curl -X POST -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -H "X-Session-Id: test-session-curl" -d '{"jsonrpc":"2.0","id":2,"method":"readResource","params":{"uri":"greeting://hello"}}' http://localhost:3000/mcp
```

## Read n8n Workflows Resource

```bash
curl -X POST -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -H "X-Session-Id: test-session-curl" -d '{"jsonrpc":"2.0","id":3,"method":"readResource","params":{"uri":"n8n://workflows"}}' http://localhost:3000/mcp
```

## Notes

- The server expects the `X-Session-Id` header for session management
- For subsequent requests after initialization, the server may also expect a `Mcp-Session-Id` header
- The server responds with SSE format for streaming responses
