import { defineConfig, env } from "prisma/config";
import path from "path";
import dotenv from "dotenv";

// 1️⃣ Determine env file from NODE_ENV
const envFile =
  process.env.NODE_ENV === "production" ? ".env" : ".env.development";

// 2️⃣ Load env vars
dotenv.config({ path: path.resolve(envFile) });

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
