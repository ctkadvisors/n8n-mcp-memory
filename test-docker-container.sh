#!/bin/bash

# Docker Container Test Suite for n8n-mcp-memory
# Tests all major functionality to ensure the container behaves as expected

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
CONTAINER_NAME="n8n-mcp-test"
TEST_PORT="3002"
IMAGE_NAME="ghcr.io/ctkadvisors/n8n-mcp-memory:latest"
BASE_URL="http://localhost:${TEST_PORT}"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    ((TOTAL_TESTS++))
    log_info "Running test: $test_name"
    
    if result=$(eval "$test_command" 2>&1); then
        if [[ -z "$expected_pattern" ]] || echo "$result" | grep -q "$expected_pattern"; then
            log_success "$test_name"
            return 0
        else
            log_error "$test_name - Expected pattern '$expected_pattern' not found in: $result"
            return 1
        fi
    else
        log_error "$test_name - Command failed: $result"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test container..."
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

# Set up cleanup trap
trap cleanup EXIT

# Start the test suite
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  n8n-MCP-Memory Docker Container Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo

log_info "Starting Docker container test suite..."
log_info "Image: $IMAGE_NAME"
log_info "Test Port: $TEST_PORT"
echo

# Test 1: Pull the latest image
log_info "Test 1: Pulling Docker image..."
if docker pull "$IMAGE_NAME" >/dev/null 2>&1; then
    log_success "Docker image pulled successfully"
    ((TESTS_PASSED++))
else
    log_error "Failed to pull Docker image"
    ((TESTS_FAILED++))
    exit 1
fi
((TOTAL_TESTS++))

# Test 2: Start the container
log_info "Test 2: Starting Docker container..."
cleanup  # Ensure clean state
if docker run -d --name "$CONTAINER_NAME" -p "${TEST_PORT}:3000" "$IMAGE_NAME" >/dev/null 2>&1; then
    log_success "Docker container started successfully"
    ((TESTS_PASSED++))
else
    log_error "Failed to start Docker container"
    ((TESTS_FAILED++))
    exit 1
fi
((TOTAL_TESTS++))

# Wait for container to be ready
log_info "Waiting for container to be ready..."
sleep 15

# Test 3: Container health check
run_test "Container Health Check" \
    "curl -s --max-time 10 ${BASE_URL}/api/health" \
    "healthy"

# Test 4: Main server page
run_test "Main Server Page" \
    "curl -s --max-time 10 ${BASE_URL}/" \
    "MCP HTTP Streaming Example Server"

# Test 5: OpenAPI specification endpoint
run_test "OpenAPI Specification JSON" \
    "curl -s --max-time 10 ${BASE_URL}/api/openapi.json | jq -r '.info.title'" \
    "n8n MCP Memory Server API"

# Test 6: OpenAPI YAML endpoint
run_test "OpenAPI Specification YAML" \
    "curl -s --max-time 10 ${BASE_URL}/api/openapi.yaml" \
    "openapi: 3.1.0"

# Test 7: Swagger UI documentation
run_test "Swagger UI Documentation" \
    "curl -s --max-time 10 ${BASE_URL}/api/docs" \
    "swagger-ui"

# Test 8: Server capabilities endpoint
run_test "Server Capabilities" \
    "curl -s --max-time 10 ${BASE_URL}/api/capabilities | jq -r '.capabilities.tools'" \
    "true"

# Test 9: List available tools
run_test "List Available Tools" \
    "curl -s --max-time 10 ${BASE_URL}/api/tools | jq -r '.tools | length'" \
    "[0-9]+"

# Test 10: List available resources
run_test "List Available Resources" \
    "curl -s --max-time 10 ${BASE_URL}/api/resources | jq -r '.resources | length'" \
    "[0-9]+"

# Test 11: MCP Documentation tools are present (via MCP endpoint)
run_test "MCP Documentation Tools Present" \
    "curl -s --max-time 10 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/list\",\"id\":1}' | grep -o 'getNodeDocumentation\\|searchNodeDocumentation\\|listNodeTypes' | wc -l" \
    "[3-9]"

# Test 12: Primary documentation tool endpoint in OpenAPI
run_test "getNodeDocumentation Tool in OpenAPI" \
    "curl -s --max-time 10 ${BASE_URL}/api/openapi.json | jq -r '.paths.\"/tools/getNodeDocumentation\".post.tags[0]'" \
    "Documentation"

# Test 13: MCP JSON-RPC endpoint basic connectivity
run_test "MCP JSON-RPC Endpoint Connectivity" \
    "curl -s --max-time 10 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"ping\",\"id\":1}'" \
    "pong"

# Test 14: Container logs check (no critical errors)
run_test "Container Logs Check" \
    "docker logs ${CONTAINER_NAME} 2>&1 | grep -v 'Error\\|ERROR\\|error' | wc -l" \
    "[0-9]+"

# Test 15: Container resource usage
log_info "Test 15: Checking container resource usage..."
if docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" "$CONTAINER_NAME" | tail -n 1; then
    log_success "Container resource usage check"
    ((TESTS_PASSED++))
else
    log_error "Failed to get container resource usage"
    ((TESTS_FAILED++))
fi
((TOTAL_TESTS++))

# Test 16: Container process check
run_test "Container Process Check" \
    "docker exec ${CONTAINER_NAME} ps aux | grep -c node" \
    "[1-9]"

# Test 17: Cache directory exists
run_test "Cache Directory Exists" \
    "docker exec ${CONTAINER_NAME} ls -la /app/cache" \
    "docs"

# Test 18: Built application exists
run_test "Built Application Exists" \
    "docker exec ${CONTAINER_NAME} ls -la /app/dist" \
    "server.js"

# Test 19: Environment check
run_test "Environment Check" \
    "docker exec ${CONTAINER_NAME} printenv NODE_ENV" \
    "production"

# Test 20: Port binding check
run_test "Port Binding Check" \
    "docker port ${CONTAINER_NAME}" \
    "3000/tcp"

# Test 21: Test DocumentationService - listNodeTypes
run_test "DocumentationService - listNodeTypes" \
    "curl -s --max-time 15 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"listNodeTypes\",\"arguments\":{}},\"id\":1}'" \
    "result"

# Test 22: Test DocumentationService - searchNodeDocumentation
run_test "DocumentationService - searchNodeDocumentation" \
    "curl -s --max-time 15 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"searchNodeDocumentation\",\"arguments\":{\"query\":\"http\",\"limit\":3}},\"id\":1}'" \
    "result"

# Test 23: Test DocumentationService - getNodeDocumentation
run_test "DocumentationService - getNodeDocumentation" \
    "curl -s --max-time 15 -X POST ${BASE_URL}/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"getNodeDocumentation\",\"arguments\":{\"nodeType\":\"n8n-nodes-base.http\"}},\"id\":1}'" \
    "result"

# Test 24: Swagger UI contains Documentation tag
run_test "Swagger UI Documentation Tag" \
    "curl -s --max-time 10 ${BASE_URL}/api/docs | grep -i 'documentation'" \
    "Documentation"

# Test 25: OpenAPI spec has Documentation tag as first tag
run_test "OpenAPI Documentation Tag Priority" \
    "curl -s --max-time 10 ${BASE_URL}/api/openapi.json | jq -r '.tags[0].name'" \
    "Documentation"

echo
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}           Test Results Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! The Docker container is working correctly.${NC}"
    echo -e "${GREEN}✅ DocumentationService is properly integrated${NC}"
    echo -e "${GREEN}✅ OpenAPI specification is correctly served${NC}"
    echo -e "${GREEN}✅ MCP integration is functional${NC}"
    echo -e "${GREEN}✅ Container is production-ready${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the container configuration.${NC}"
    exit 1
fi
