FROM oven/bun:latest

WORKDIR /app

# Copy root package files and lock
COPY package.json bun.lockb ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install dependencies for the mobile app only
RUN bun install --filter @bozorchi/mobile

# For mobile apps, we typically don't run the app in Docker itself
# Instead, this container is used for CI/CD build processes
# Build would be triggered by EAS or other mobile CI/CD tools

# If you need to build an APK or IPA, you would add those commands here
# For now, we just have the dependencies installed and ready

WORKDIR /app/apps/mobile

# You can add specific build commands here if needed for your CI/CD
# For example: RUN bun run build:android

EXPOSE 8081

CMD ["bun", "run", "dev"]
