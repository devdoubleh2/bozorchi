FROM oven/bun:latest AS builder

WORKDIR /app

# Copy root package files and lock
COPY package.json bun.lock ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install dependencies for the web app only
RUN bun install --frozen-lockfile

# Build the web app
RUN cd apps/web && bun run build

# Production stage
FROM oven/bun:latest

WORKDIR /app

# Copy package.json for vite preview
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages/@bozorchi/shared ./packages/@bozorchi/shared
COPY --from=builder /app/bun.lock ./

# Install minimal dependencies for preview
RUN bun install --frozen-lockfile --ignore-scripts

EXPOSE 3000

CMD ["bun", "run", "--filter", "@bozorchi/web", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
