#!/bin/sh

# This is the development version of the wrapper script
# It is used for local development and testing
# For Docker container deployment, see mcp-wrapper.sh.new
#
# This wrapper script ensures that only valid JSON-RPC messages are sent to stdout
# All other output is redirected to stderr

# Create a named pipe for communication
PIPE_DIR="/tmp"
PIPE_NAME="mcp_pipe_$$"
PIPE_PATH="$PIPE_DIR/$PIPE_NAME"

# Make sure the pipe doesn't exist
rm -f "$PIPE_PATH"

# Create the pipe
mkfifo "$PIPE_PATH"

# Clean up the pipe when the script exits
trap "rm -f $PIPE_PATH" EXIT

# Start the mcp-bridge.js script with all output going to stderr
node mcp-bridge.js > "$PIPE_PATH" 2>&1 &
BRIDGE_PID=$!

# Clean up the bridge process when the script exits
trap "kill $BRIDGE_PID 2>/dev/null; rm -f $PIPE_PATH" EXIT

# Process the output from the pipe
# Only forward valid JSON-RPC messages to stdout
cat "$PIPE_PATH" | while read -r line; do
    # Check if the line is a valid JSON-RPC message
    if echo "$line" | grep -q -E '^\{"jsonrpc":"2\.0"'; then
        # Send valid JSON-RPC messages to stdout
        echo "$line"
    else
        # Send everything else to stderr
        echo "$line" >&2
    fi
done
