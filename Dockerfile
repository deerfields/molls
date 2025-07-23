# =============================================================================
# MALLOS ENTERPRISE - DOCKERFILE
# Multi-stage build for production-ready enterprise application
# =============================================================================

# =============================================================================
# BUILD STAGE
# =============================================================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# =============================================================================
# PRODUCTION STAGE
# =============================================================================
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy necessary files
COPY --chown=nodejs:nodejs .env.example ./
COPY --chown=nodejs:nodejs ./uploads ./uploads

# Create necessary directories
RUN mkdir -p /app/logs /app/temp /app/uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]

# =============================================================================
# DEVELOPMENT STAGE
# =============================================================================
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Install system dependencies for development
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    vim \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/temp /app/uploads

# Expose ports
EXPOSE 3001 3002

# Start development server
CMD ["npm", "run", "dev"] 