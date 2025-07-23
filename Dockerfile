# Production-ready Dockerfile with dependency resolution
FROM node:18-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Clear npm cache and install with legacy peer deps handling
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --no-optional

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy built application
COPY --from=base /app/dist ./dist
COPY --from=base /app/build ./build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S molls -u 1001 -G nodejs

USER molls

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:10000/health || exit 1

# Start application
CMD ["node", "dist/server.js"]
