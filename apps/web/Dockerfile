FROM oven/bun:latest AS builder

WORKDIR /app

# Copy root package files and lock
COPY package.json bun.lockb ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install dependencies for the web app only
RUN bun install --filter @bozorchi/web

# Build the web app
RUN cd apps/web && bun run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built web app from builder
COPY --from=builder /app/apps/web/dist ./dist

# Install a simple HTTP server to serve the static files
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
