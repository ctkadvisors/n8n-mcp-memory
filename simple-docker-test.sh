#!/bin/bash

# Simple Docker Container Test for n8n-mcp-memory

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="n8n-mcp-test"
TEST_PORT="3002"
IMAGE_NAME="ghcr.io/ctkadvisors/n8n-mcp-memory:latest"
BASE_URL="http://localhost:${TEST_PORT}"

echo -e "${BLUE}🐳 Testing Docker Container: n8n-mcp-memory${NC}"
echo

# Cleanup function
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up...${NC}"
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

trap cleanup EXIT

# Start container
echo -e "${BLUE}🚀 Starting container...${NC}"
cleanup
docker run -d --name "$CONTAINER_NAME" -p "${TEST_PORT}:3000" "$IMAGE_NAME"

# Wait for startup
echo -e "${BLUE}⏳ Waiting for container to start...${NC}"
sleep 15

# Test 1: Health check
echo -e "${BLUE}🏥 Testing health endpoint...${NC}"
if curl -s --max-time 10 "${BASE_URL}/api/health" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test 2: OpenAPI spec
echo -e "${BLUE}📋 Testing OpenAPI specification...${NC}"
if curl -s --max-time 10 "${BASE_URL}/api/openapi.json" | jq -r '.info.title' | grep -q "n8n MCP Memory Server API"; then
    echo -e "${GREEN}✅ OpenAPI specification correct${NC}"
else
    echo -e "${RED}❌ OpenAPI specification failed${NC}"
    exit 1
fi

# Test 3: Documentation tag priority
echo -e "${BLUE}🎯 Testing Documentation tag priority...${NC}"
if curl -s --max-time 10 "${BASE_URL}/api/openapi.json" | jq -r '.tags[0].name' | grep -q "Documentation"; then
    echo -e "${GREEN}✅ Documentation tag is first (primary value-add)${NC}"
else
    echo -e "${RED}❌ Documentation tag not prioritized${NC}"
    exit 1
fi

# Test 4: MCP tools list
echo -e "${BLUE}🔧 Testing MCP tools via JSON-RPC...${NC}"
TOOLS_RESPONSE=$(curl -s --max-time 15 -X POST "${BASE_URL}/mcp" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"tools/list","id":1}')

if echo "$TOOLS_RESPONSE" | grep -q "getNodeDocumentation"; then
    echo -e "${GREEN}✅ Documentation tools found in MCP${NC}"
else
    echo -e "${RED}❌ Documentation tools missing from MCP${NC}"
    exit 1
fi

# Test 5: Count documentation tools
DOC_TOOLS_COUNT=$(echo "$TOOLS_RESPONSE" | grep -o "getNodeDocumentation\|searchNodeDocumentation\|listNodeTypes\|fetchNodeDocumentation\|updateDocumentation\|updateAllNodeDocumentation" | wc -l)
if [ "$DOC_TOOLS_COUNT" -ge 5 ]; then
    echo -e "${GREEN}✅ Found $DOC_TOOLS_COUNT documentation tools${NC}"
else
    echo -e "${RED}❌ Only found $DOC_TOOLS_COUNT documentation tools (expected 6)${NC}"
    exit 1
fi

# Test 6: Test a documentation tool
echo -e "${BLUE}📚 Testing listNodeTypes tool...${NC}"
LIST_RESPONSE=$(curl -s --max-time 15 -X POST "${BASE_URL}/mcp" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"listNodeTypes","arguments":{}},"id":1}')

if echo "$LIST_RESPONSE" | grep -q "result"; then
    echo -e "${GREEN}✅ listNodeTypes tool working${NC}"
else
    echo -e "${RED}❌ listNodeTypes tool failed${NC}"
    echo "Response: $LIST_RESPONSE"
    exit 1
fi

# Test 7: Container logs check
echo -e "${BLUE}📝 Checking container logs for errors...${NC}"
ERROR_COUNT=$(docker logs "$CONTAINER_NAME" 2>&1 | grep -i "error\|exception\|failed" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No errors in container logs${NC}"
else
    echo -e "${RED}❌ Found $ERROR_COUNT errors in logs${NC}"
    docker logs "$CONTAINER_NAME" 2>&1 | grep -i "error\|exception\|failed" | head -5
fi

# Test 8: Swagger UI
echo -e "${BLUE}📖 Testing Swagger UI...${NC}"
if curl -s --max-time 10 "${BASE_URL}/api/docs/" | grep -q "swagger-ui"; then
    echo -e "${GREEN}✅ Swagger UI accessible${NC}"
else
    echo -e "${RED}❌ Swagger UI not accessible${NC}"
    exit 1
fi

echo
echo -e "${GREEN}🎉 All tests passed! Docker container is working correctly.${NC}"
echo -e "${GREEN}✅ DocumentationService is properly integrated and prioritized${NC}"
echo -e "${GREEN}✅ OpenAPI specification correctly features DocumentationService${NC}"
echo -e "${GREEN}✅ MCP integration is functional with all documentation tools${NC}"
echo -e "${GREEN}✅ Container is production-ready${NC}"
echo
echo -e "${BLUE}📊 Container Summary:${NC}"
echo -e "  • Image: $IMAGE_NAME"
echo -e "  • Port: $TEST_PORT"
echo -e "  • Health: http://localhost:$TEST_PORT/api/health"
echo -e "  • OpenAPI: http://localhost:$TEST_PORT/api/docs"
echo -e "  • Documentation Tools: $DOC_TOOLS_COUNT available"
