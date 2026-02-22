import { defineConfig, env } from "prisma/config";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load env vars with sensible fallbacks for local + CI/docker builds.
// In many deployments `.env` is not checked into git, while `.env.production` is.
const nodeEnv = process.env.NODE_ENV;
const envFiles =
  nodeEnv === "production"
    ? [".env.production", ".env"]
    : [".env.development", ".env"];

for (const file of envFiles) {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
}

export default defineConfig({
  schema: "prisma/schema/",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"), // reads DATABASE_URL from loaded env
  },
});
