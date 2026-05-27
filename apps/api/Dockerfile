FROM oven/bun:latest

WORKDIR /app

# Install PostgreSQL client tools (pg_dump)
RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# Copy root package files and lock
COPY package.json bun.lock ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install dependencies for the API only
RUN bun install --frozen-lockfile

# Build the API
RUN cd apps/api && bun run build

EXPOSE 4000

CMD ["bun", "run", "--filter", "@bozorchi/api", "start"]
