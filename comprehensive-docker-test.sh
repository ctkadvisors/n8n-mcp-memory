#!/bin/bash

# Comprehensive Docker Container Test Suite for n8n-mcp-memory
# Tests all functionality including DocumentationService, OpenAPI, and MCP integration

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME="n8n-mcp-comprehensive-test"
TEST_PORT="3003"
IMAGE_NAME="ghcr.io/ctkadvisors/n8n-mcp-memory:latest"
BASE_URL="http://localhost:${TEST_PORT}"

echo -e "${BLUE}🧪 Comprehensive Docker Container Test Suite${NC}"
echo -e "${BLUE}=============================================${NC}"
echo

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

test_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    echo -e "${BLUE}🔍 Testing: $test_name${NC}"
    
    if result=$(eval "$test_command" 2>&1); then
        if [[ -z "$expected_pattern" ]] || echo "$result" | grep -q "$expected_pattern"; then
            test_passed "$test_name"
            return 0
        else
            test_failed "$test_name - Expected pattern '$expected_pattern' not found"
            echo "  Result: $result"
            return 1
        fi
    else
        test_failed "$test_name - Command failed"
        echo "  Error: $result"
        return 1
    fi
}

# Cleanup function
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up test container...${NC}"
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo -e "${BLUE}🚀 Starting container...${NC}"
cleanup
docker run -d --name "$CONTAINER_NAME" -p "${TEST_PORT}:3000" "$IMAGE_NAME"

echo -e "${BLUE}⏳ Waiting for container to start...${NC}"
sleep 20

echo -e "${BLUE}🏁 Running comprehensive tests...${NC}"
echo

# Basic functionality tests
run_test "Container Health Check" \
    "curl -s --max-time 10 ${BASE_URL}/api/health | jq -r '.status'" \
    "healthy"

run_test "Server Version Check" \
    "curl -s --max-time 10 ${BASE_URL}/api/health | jq -r '.version'" \
    "1.0.0"

# OpenAPI tests
run_test "OpenAPI Specification Title" \
    "curl -s --max-time 10 ${BASE_URL}/api/openapi.json | jq -r '.info.title'" \
    "n8n MCP Memory Server API"

run_test "OpenAPI Documentation Tag Priority" \
    "curl -s --max-time 10 ${BASE_URL}/api/openapi.json | jq -r '.tags[0].name'" \
    "Documentation"

run_test "OpenAPI Documentation Tag Description" \
    "curl -s --max-time 10 ${BASE_URL}/api/openapi.json | jq -r '.tags[0].description'" \
    "PRIMARY VALUE-ADD"

run_test "OpenAPI YAML Format" \
    "curl -s --max-time 10 ${BASE_URL}/api/openapi.yaml" \
    "openapi: 3.1.0"

# Swagger UI tests
run_test "Swagger UI Accessibility" \
    "curl -s --max-time 10 ${BASE_URL}/api/docs/" \
    "swagger-ui"

# MCP Protocol tests
run_test "MCP Tools List" \
    "curl -s --max-time 15 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/list\",\"id\":1}'" \
    "getNodeDocumentation"

run_test "MCP Resources List" \
    "curl -s --max-time 15 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"resources/list\",\"id\":1}'" \
    "result"

# DocumentationService specific tests
echo -e "${YELLOW}📚 Testing DocumentationService functionality...${NC}"

run_test "DocumentationService - listNodeTypes" \
    "curl -s --max-time 20 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"listNodeTypes\",\"arguments\":{}},\"id\":1}'" \
    "result"

run_test "DocumentationService - searchNodeDocumentation" \
    "curl -s --max-time 20 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"searchNodeDocumentation\",\"arguments\":{\"query\":\"http request\",\"limit\":3}},\"id\":1}'" \
    "result"

run_test "DocumentationService - getNodeDocumentation" \
    "curl -s --max-time 20 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"getNodeDocumentation\",\"arguments\":{\"nodeType\":\"n8n-nodes-base.manualTrigger\"}},\"id\":1}'" \
    "result"

# Container health tests
echo -e "${YELLOW}🔧 Testing container internals...${NC}"

run_test "Container Process Check" \
    "docker exec ${CONTAINER_NAME} ps aux | grep -c node" \
    "[1-9]"

run_test "Cache Directory Exists" \
    "docker exec ${CONTAINER_NAME} ls -la /app/cache" \
    "docs"

run_test "Built Application Exists" \
    "docker exec ${CONTAINER_NAME} ls -la /app/dist/server.js" \
    "server.js"

run_test "Environment Variables" \
    "docker exec ${CONTAINER_NAME} printenv NODE_ENV" \
    "production"

# Performance and resource tests
echo -e "${YELLOW}📊 Testing performance and resources...${NC}"

echo -e "${BLUE}🔍 Testing: Container Resource Usage${NC}"
if docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" "$CONTAINER_NAME" | tail -n 1; then
    test_passed "Container Resource Usage"
else
    test_failed "Container Resource Usage"
fi

# Log analysis
echo -e "${YELLOW}📝 Analyzing container logs...${NC}"

ERROR_COUNT=$(docker logs "$CONTAINER_NAME" 2>&1 | grep -i "error\|exception\|failed" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    test_passed "No errors in container logs"
else
    test_failed "Found $ERROR_COUNT errors in logs"
    echo -e "${RED}Recent errors:${NC}"
    docker logs "$CONTAINER_NAME" 2>&1 | grep -i "error\|exception\|failed" | tail -3
fi

# Count documentation tools
DOC_TOOLS_RESPONSE=$(curl -s --max-time 15 -X POST "${BASE_URL}/mcp" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"tools/list","id":1}')

DOC_TOOLS_COUNT=$(echo "$DOC_TOOLS_RESPONSE" | grep -o "getNodeDocumentation\|searchNodeDocumentation\|listNodeTypes\|fetchNodeDocumentation\|updateDocumentation\|updateAllNodeDocumentation" | wc -l)

if [ "$DOC_TOOLS_COUNT" -eq 6 ]; then
    test_passed "All 6 DocumentationService tools available"
else
    test_failed "Only $DOC_TOOLS_COUNT/6 DocumentationService tools found"
fi

# Final summary
echo
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}           Test Results Summary${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Total Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Total Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}✅ Docker container is production-ready${NC}"
    echo -e "${GREEN}✅ DocumentationService is fully functional${NC}"
    echo -e "${GREEN}✅ OpenAPI specification properly features DocumentationService${NC}"
    echo -e "${GREEN}✅ MCP integration working correctly${NC}"
    echo -e "${GREEN}✅ All $DOC_TOOLS_COUNT documentation tools available${NC}"
    echo
    echo -e "${BLUE}📋 Container Details:${NC}"
    echo -e "  • Image: $IMAGE_NAME"
    echo -e "  • Test Port: $TEST_PORT"
    echo -e "  • Health: $BASE_URL/api/health"
    echo -e "  • OpenAPI Docs: $BASE_URL/api/docs/"
    echo -e "  • OpenAPI Spec: $BASE_URL/api/openapi.json"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}Please review the failed tests above${NC}"
    exit 1
fi
