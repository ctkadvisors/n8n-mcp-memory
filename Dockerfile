FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Create cache directory for documentation
RUN mkdir -p /app/cache/docs && chmod -R 777 /app/cache

# Define a volume for persistent storage of cache and documentation
VOLUME ["/app/cache"]

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Copy the Docker-optimized versions of the bridge and wrapper scripts
# These .new files are specifically designed for the Docker container
COPY mcp-bridge.js.new /app/mcp-bridge.js
COPY mcp-wrapper.sh.new /app/mcp-wrapper.sh

# Command to run the bridge with our wrapper script
CMD ["./mcp-wrapper.sh"]
