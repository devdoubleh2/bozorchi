import { PrismaClient as PublicClient } from "../generated/public/client";
import {
  PrismaClient as TenantClient,
  Prisma as TenantPrisma,
} from "../generated/tenant/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { LRUCache } from "lru-cache";
import logger from "../../logs/log";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const DATABASE_URL = process.env["DATABASE_URL"]!;
if (!DATABASE_URL) throw new Error("DATABASE_URL must be set");

/**
 * Custom error class for tenant-related errors
 */
export class TenantConnectionError extends Error {
  constructor(
    message: string,
    public readonly orgId: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = "TenantConnectionError";
  }
}

/**
 * Custom error class for pool-related errors
 */
export class PoolConnectionError extends Error {
  constructor(message: string, public override readonly cause?: Error) {
    super(message);
    this.name = "PoolConnectionError";
  }
}

// ----- Public Client (Shared Data) -----
const publicPool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors globally
publicPool.on("error", (err: Error) => {
  logger.error("[PRISMA] Public pool error:", "prisma", { error: err.message });
});

const publicAdapter = new PrismaPg(publicPool);
export const prisma = new PublicClient({ adapter: publicAdapter });

// ----- LRU Cache for Prisma Clients per Organization -----
const tenantClients = new LRUCache<string, TenantClient>({
  max: 100, // Maximum 100 organizations cached
  ttl: 1000 * 60 * 60, // 1 hour TTL
  dispose: async (client, key) => {
    try {
      // Properly disconnect client when evicted
      await client.$disconnect();

      logger.info(`[PRISMA] Tenant client disposed`, "prisma", { orgId: key });
    } catch (err) {
      logger.error(`[PRISMA] Error disposing tenant client`, "prisma", {
        orgId: key,
        error: err,
      });
    }
  },
  updateAgeOnGet: true, // Refresh TTL on access
});
const pendingTenantClients = new Map<string, Promise<TenantClient>>();

/**
 * Custom tenant creation using Prisma's native migration system
 */
export const createTenantSchema = async (orgId: string): Promise<void> => {
  const tenantSchema = `org_${orgId}`;
  logger.info(`[SchemaManager] Creating schema request`, "prisma", {
    orgId,
    tenantSchema,
  });

  try {
    // Create schema in public database
    await prisma.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${tenantSchema}";`
    );

    logger.info(`[SchemaManager] Schema created, running migrations`, "prisma", {
      orgId,
      tenantSchema,
    });

    // Parse the database URL and add schema parameter
    const dbUrl = new URL(DATABASE_URL);
    dbUrl.searchParams.set("schema", tenantSchema);

    const schemaPath = path.join(
      process.cwd(),
      "prisma",
      "tenant",
      "schema.prisma"
    );

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Tenant schema file not found at ${schemaPath}`);
    }

    // Run prisma migrate deploy with the schema-specific DATABASE_URL
    const env = {
      ...process.env,
      DATABASE_URL: dbUrl.toString(),
    };

    logger.info(`[SchemaManager] Running Prisma db push`, "prisma", {
      orgId,
      tenantSchema,
    });

    // Use db push instead of migrate deploy for tenant schemas
    // This creates/updates tables directly without migration history
    const output = execSync(`bunx prisma db push --schema=${schemaPath}`, {
      env,
      encoding: "utf-8",
      stdio: "pipe",
    });

    logger.debug(`[SchemaManager] Migration output`, "prisma", { orgId, output });
    logger.info(`[SchemaManager] Successfully created and migrated schema`, "prisma", {
      orgId,
      tenantSchema,
    });
  } catch (error) {
    // Type guard for exec errors which have stdout/stderr properties
    const execError = error as { stdout?: string; stderr?: string };
    const errorOutput =
      error instanceof Error && "stdout" in error
        ? execError.stdout || execError.stderr
        : null;

    logger.error(
      `[SchemaManager] Failed to create/migrate schema ${tenantSchema}:`,
      "prisma",
      {
        error,
        output: errorOutput,
      }
    );

    // Attempt to rollback schema creation on failure
    try {
      await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${tenantSchema}" CASCADE;`
      );
      logger.info(`[SchemaManager] Rolled back schema ${tenantSchema}`, "prisma");
    } catch (rollbackError) {
      logger.error(
        `[SchemaManager] Failed to rollback schema ${tenantSchema}:`,
        "prisma",
        rollbackError
      );
    }

    throw error;
  }
};

/**
 * Factory function to get or create a Prisma client for a specific tenant
 */
export async function getTenantPrisma(
  orgId: string,
  skipOrgValidation = false
): Promise<TenantClient> {
  logger.debug(`[PRISMA] getTenantPrisma requested`, "prisma", {
    orgId,
    skipOrgValidation,
  });

  // Check if client already exists in cache
  let client = tenantClients.get(orgId);

  if (client) {
    logger.debug(`[PRISMA] Using cached tenant client`, "prisma", { orgId });
    return client;
  }

  const pendingClient = pendingTenantClients.get(orgId);
  if (pendingClient) {
    logger.debug(`[PRISMA] Awaiting pending tenant client initialization`, "prisma", {
      orgId,
    });
    return pendingClient;
  }

  const initializationPromise = (async (): Promise<TenantClient> => {
    const cachedClient = tenantClients.get(orgId);
    if (cachedClient) {
      return cachedClient;
    }

    // Validate organization exists (unless skipped)
    if (!skipOrgValidation) {
      let org;
      try {
        org = await prisma.organization.findUnique({
          where: { id: orgId },
          select: { id: true, name: true },
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`[PRISMA] Organization lookup failed`, "prisma", {
          orgId,
          error: errorMessage,
        });
        throw new PoolConnectionError(
          `Database error while looking up organization ${orgId}: ${errorMessage}`,
          err instanceof Error ? err : undefined
        );
      }

      if (!org) {
        const error = new TenantConnectionError(
          `Organization ${orgId} not found`,
          orgId
        );
        logger.warn(`[PRISMA] Organization not found during lookup`, "prisma", {
          orgId,
        });
        throw error;
      }
    }

    // Schema name follows the convention: org_{organizationId}
    const schemaName = `org_${orgId}`;

    try {
      // Build connection string with schema parameter
      const dbUrl = new URL(DATABASE_URL);
      dbUrl.searchParams.set("schema", schemaName);

      // Create Prisma adapter with the tenant schema
      const adapter = new PrismaPg(
        {
          connectionString: dbUrl.toString(),
          options: `-c search_path="${schemaName}"`,
        },
        { schema: schemaName }
      );

      // Create new Prisma client with the adapter
      const options: TenantPrisma.PrismaClientOptions = {
        adapter,
        log:
          process.env["NODE_ENV"] === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      };
      const initializedClient = new TenantClient(options);

      // Cache the client
      tenantClients.set(orgId, initializedClient);

      logger.info(`[PRISMA] Created new tenant client`, "prisma", {
        orgId,
        schemaName,
      });
      return initializedClient;
    } catch (err) {
      logger.error(`[PRISMA] Error creating tenant client`, "prisma", {
        orgId,
        schemaName,
        error: err,
      });

      // Re-throw known error types
      if (
        err instanceof TenantConnectionError ||
        err instanceof PoolConnectionError
      ) {
        throw err;
      }

      // Wrap unknown errors
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[PRISMA] Failed to create tenant client`, "prisma", {
        orgId,
        error: errorMessage,
      });

      throw new TenantConnectionError(
        `Failed to establish connection for organization ${orgId}: ${errorMessage}`,
        orgId,
        err instanceof Error ? err : undefined
      );
    }
  })();

  pendingTenantClients.set(orgId, initializationPromise);

  try {
    return await initializationPromise;
  } finally {
    if (pendingTenantClients.get(orgId) === initializationPromise) {
      pendingTenantClients.delete(orgId);
    }
  }
}

/**
 * Validates if a tenant client is still healthy
 */
export async function validateTenantConnection(
  orgId: string
): Promise<boolean> {
  const client = tenantClients.get(orgId);

  if (!client) {
    logger.debug(`[PRISMA] No cached client found for validation`, "prisma", { orgId });
    return false;
  }

  try {
    await client.$queryRaw`SELECT 1 as test`;
    logger.debug(`[PRISMA] Tenant connection validation successful`, "prisma", { orgId });
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`[PRISMA] Tenant connection validation failed`, "prisma", {
      orgId,
      error: errorMessage,
    });

    // Remove unhealthy client from cache
    tenantClients.delete(orgId);
    return false;
  }
}

/**
 * Forces removal of a tenant client from cache
 */
export function evictTenantClient(orgId: string): boolean {
  if (tenantClients.has(orgId)) {
    tenantClients.delete(orgId);
    logger.info(`[PRISMA] Tenant client manually evicted`, "prisma", { orgId });
    return true;
  }
  logger.debug(`[PRISMA] No cached client to evict`, "prisma", { orgId });
  return false;
}

/**
 * Get statistics about cached clients and pools
 */
export function getTenantStats() {
  return {
    cachedClients: tenantClients.size,
    maxClients: tenantClients.max,
  };
}

// ----- Graceful shutdown -----
let isShuttingDown = false;

async function gracefulShutdown() {
  // Prevent double shutdown
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("[PRISMA] Starting graceful shutdown", "prisma");

  try {
    // Disconnect public client
    await prisma.$disconnect();
    logger.info("[PRISMA] Public client disconnected", "prisma");

    // Disconnect all cached tenant clients
    const clients = Array.from(tenantClients.values());
    await Promise.all(
      clients.map((client) =>
        client
          .$disconnect()
          .catch((err) =>
            logger.error("[PRISMA] Error disconnecting tenant client:", err)
          )
      )
    );
    logger.info(`[PRISMA] Disconnected ${clients.length} tenant clients`, "prisma");

    // Clear caches
    tenantClients.clear();

    // Close public pool
    await publicPool.end();
    logger.info("[PRISMA] Public pool closed", "prisma");

    logger.info("[PRISMA] Graceful shutdown completed", "prisma");
  } catch (error) {
    logger.error("[PRISMA] Error during graceful shutdown:", "prisma", error);
  }
}

process.on("beforeExit", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
