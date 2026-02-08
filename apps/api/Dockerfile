FROM oven/bun:latest

WORKDIR /app

# Copy root package files and lock
COPY package.json bun.lockb ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install dependencies for the API only
RUN bun install --filter @bozorchi/api

# Build the API
RUN cd apps/api && bun run build

EXPOSE 4000

CMD ["bun", "run", "--filter", "@bozorchi/api", "start"]
