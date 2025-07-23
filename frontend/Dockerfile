# =============================
# FRONTEND (React + Vite + PWA)
# =============================

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app (includes PWA assets)
RUN npm run build

# Production stage (serving static files)
FROM nginx:1.25-alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built assets from builder
COPY --from=builder /app/dist .
COPY --from=builder /app/manifest.webmanifest ./manifest.webmanifest
COPY --from=builder /app/icons ./icons

# Copy custom nginx config for SPA routing (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Development stage (hot reload)
FROM node:18-alpine AS development
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"] 