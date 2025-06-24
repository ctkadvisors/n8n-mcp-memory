FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

# Create cache directory for documentation
RUN mkdir -p /app/cache/docs && chmod -R 777 /app/cache

# Define a volume for persistent storage of cache and documentation
VOLUME ["/app/cache"]

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# For Claude Code MCP integration, run the server directly
CMD ["node", "dist/server.js"]
