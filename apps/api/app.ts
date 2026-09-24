// Initialize OpenTelemetry FIRST before any other imports
import type { Server } from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import timeout from "connect-timeout";
import cookie from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { prisma } from "./src/lib/prisma";
import authRouter from "./src/routes/auth";
import storesRouter from "./src/routes/stores";
import productsRouter from "./src/routes/products";
import productCategoriesRouter from "./src/routes/productCategories";
import inventoryRouter from "./src/routes/inventory";
import transactionsRouter from "./src/routes/transactions";
import unitsRouter from "./src/routes/units";
import filesRouter from "./src/routes/files";
import usersRouter from "./src/routes/users";
import customersRouter from "./src/routes/customers";
import checkoutRouter from "./src/routes/checkout";
import webhookRouter from "./src/routes/webhook";
import supplierRouter from "./src/routes/supplier";
import writeOffRouter from "./src/routes/writeOff";
import auditRouter from "./src/routes/audit";
import importRouter from "./src/routes/import";
import repricingRouter from "./src/routes/repricing";
import staffRouter from "./src/routes/staff";
import productVariationsRouter from "./src/routes/productVariations";
import notificationsRouter from "./src/routes/notifications";
import organizationsRouter from "./src/routes/organizations";
import reportsRouter from "./src/routes/reports";
import dynamicQrRouter from "./src/routes/dynamicQr";
import telegramRouter from "./src/routes/telegram";
import backupRouter from "./src/routes/backup";

import currenciesRouter from "./src/routes/currencies";
import { sanitizeInput } from "./src/middleware/sanitization";
import { log } from "./logs/log";
import { initializeBackupScheduler } from "./src/lib/backupScheduler";
import { closeImportQueue, initializeImportQueue } from "./src/lib/importQueue";
import { AppError } from "./src/utils/AppError";
import { ZodError } from "zod";
import { openApiDocument } from "./src/docs/openapi";


const app: express.Application = express();
const PORT = Number(process.env["PORT"] ?? 4000);
let server: Server | null = null;
let shuttingDown = false;
const isApiDocsEnabled =
  process.env["ENABLE_API_DOCS"] === "true" ||
  process.env["NODE_ENV"] !== "production";
const isOpenApiJsonEnabled = process.env["ENABLE_OPENAPI_JSON"] === "true";

// Validate required environment variables in production
if (process.env["NODE_ENV"] === "production") {
  const requiredEnvVars = [
    "JWT_SECRET",
    "CORS_ORIGIN",
    "MINIO_ACCESS_KEY",
    "MINIO_SECRET_KEY",
    "MINIO_ENDPOINT",
  ];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      log.debug(`Required environment variable ${envVar} is not set`, "app.ts");
      process.exit(1);
    }
  }
}

// Configure helmet with security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: isApiDocsEnabled ? ["'self'", "'unsafe-inline'"] : ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

app.set("trust proxy", 1);

// CORS configuration with strict origin validation
const corsOrigin = process.env["CORS_ORIGIN"];
if (!corsOrigin && process.env["NODE_ENV"] === "production") {
  console.error("CORS_ORIGIN must be set in production");
  process.exit(1);
}

const allowLocalhostOrigins =
  process.env["ALLOW_LOCALHOST_ORIGINS"] !== "false";

const defaultDevOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:3000",
];

const exactAllowedOrigins = corsOrigin
  ? corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin && !origin.includes("*"))
  : [];

const wildcardAllowedOrigins = corsOrigin
  ? corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.includes("*"))
    .map(
      (pattern) =>
        new RegExp(
          "^" +
          pattern
            .replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&")
            .replace(/\\\*/g, ".*") +
          "$"
        )
    )
  : [];

const bozorchiDomainRegex = /^https?:\/\/([a-z0-9-]+\.)*bozorchi\.store$/i;

const isAllowedCorsOrigin = (origin: string): boolean => {
  const isDevEnvironment = process.env["NODE_ENV"] !== "production";
  const isDevOrigin = isDevEnvironment && defaultDevOrigins.includes(origin);
  const isExactMatch = exactAllowedOrigins.includes(origin);
  const matchesWildcard = wildcardAllowedOrigins.some((regex) =>
    regex.test(origin)
  );
  const isBozorchiDomain = bozorchiDomainRegex.test(origin);
  const isLocalhost =
    allowLocalhostOrigins &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  return (
    isExactMatch ||
    matchesWildcard ||
    isDevOrigin ||
    isBozorchiDomain ||
    isLocalhost
  );
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isAllowedCorsOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Global rate limiter
const rateLimitWindowMs = parseInt(
  process.env["RATE_LIMIT_WINDOW_MS"] || "60000",
  10
);
const rateLimitMaxRequests = parseInt(
  process.env["RATE_LIMIT_MAX_REQUESTS"] || "100",
  10
);
const rateLimitSkipSuccessfulRequests =
  process.env["RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS"] !== "false";

const isTestEnv = process.env["NODE_ENV"] === "test";

const limiter = rateLimit({
  windowMs: rateLimitWindowMs, // 1 minute by default
  max: rateLimitMaxRequests,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: rateLimitSkipSuccessfulRequests,
  handler: (req, res, _next, options) => {
   log.warn("rateLimit", "Rate limit exceeded", {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,
      forwardedFor: req.headers["x-forwarded-for"] || null,
      windowMs: rateLimitWindowMs,
      maxRequests: rateLimitMaxRequests,
      skipSuccessfulRequests: rateLimitSkipSuccessfulRequests,
      statusCode: options.statusCode,
    });

    return res.status(options.statusCode).json(options.message);
  },
});

if (!isTestEnv) {
  app.use(limiter);
}

app.use(cookie());

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

app.use(compression());

// Request timeout
app.use(timeout("1m"));

if (process.env["NODE_ENV"] === "development") {
  app.use(morgan("dev"));
} else if (!isTestEnv) {
  app.use(morgan("combined"));
}

// Mount webhook routes BEFORE body parsers so we can use express.raw()
app.use("/api/webhook", webhookRouter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize all inputs to prevent XSS
app.use(sanitizeInput);

// Halt on timeout middleware
function haltOnTimedout(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  if (!(req as typeof req & { timedout?: boolean }).timedout) next();
}

app.use(haltOnTimedout);

// Apply strict rate limiting to auth routes
if (!isTestEnv) {
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
}

app.use("/api/auth", authRouter);
app.use("/api/stores", storesRouter);
app.use("/api/products", productsRouter);
app.use("/api/product-categories", productCategoriesRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/units", unitsRouter);
app.use("/api/files", filesRouter);
app.use("/api/users", usersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/write-offs", writeOffRouter);
app.use("/api/audit", auditRouter);
app.use("/api/import", importRouter);
app.use("/api/repricing", repricingRouter);
app.use("/api/staff", staffRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/product-variations", productVariationsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/reports", reportsRouter);

app.use("/api/currencies", currenciesRouter);
app.use("/api/payments/dynamic-qr", dynamicQrRouter);
app.use("/api/telegram", telegramRouter);
app.use("/api/backup", backupRouter);

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env["NODE_ENV"],
  });
});

app.get("/api", (_req, res) => {
  res.json({
    message: "SP Backend API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      stores: "/api/stores",
      products: "/api/products",
      categories: "/api/categories",
      inventory: "/api/inventory",
      transactions: "/api/transactions",
      units: "/api/units",
      files: "/api/files",
      customers: "/api/customers",
      notifications: "/api/notifications",
      reports: "/api/reports",
      suppliers: "/api/suppliers",
      writeOffs: "/api/write-offs",
      audit: "/api/audit",
      import: "/api/import",
      repricing: "/api/repricing",
      print: "/api/print",
      reservations: "/api/reservations",
    },
    documentation: "/api/docs",
    openapi: "/api/openapi.json",
  });
});

if (isApiDocsEnabled) {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      explorer: true,
      customSiteTitle: "Bozorchi API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    })
  );
}

if (isOpenApiJsonEnabled) {
  app.get("/api/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });
}

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    status: "fail",
    message: "Resource not found",
  });
});

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    const isDev = process.env["NODE_ENV"] === "development";

    // Log the error
   log.error("errorHandler", err.message, {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      errorName: err.name,
      stack: isDev ? err.stack : undefined,
    });

    // Handle known operational errors (AppError)
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        ...(isDev && { stack: err.stack }),
      });
    }

    // Handle Zod validation errors
    if (err instanceof ZodError) {
      const issues = err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors: issues,
      });
    }

    // Handle Prisma errors — don't leak internals in production
    if (err.name?.startsWith("Prisma")) {
      return res.status(500).json({
        status: "error",
        message: isDev ? err.message : "Database error",
        ...(isDev && { stack: err.stack }),
      });
    }

    // Handle CORS errors
    if (err.message?.includes("Not allowed by CORS")) {
      return res.status(403).json({
        status: "fail",
        message: err.message,
      });
    }

    // Handle timeout errors
    if (err.message?.includes("timeout")) {
      return res.status(408).json({
        status: "fail",
        message: "Request timeout",
      });
    }

    // Handle generic errors — never leak stack in production
    return res.status(500).json({
      status: "error",
      message: isDev ? err.message : "Something went wrong",
      ...(isDev && { stack: err.stack }),
    });
  }
);

async function startServer() {
  try {
    // Connect to database first
    await prisma.$connect();
    console.log("✅ Prisma connected to database");

    // Initialize database backup scheduler
    initializeBackupScheduler();
    console.log("✅ Database backup scheduler initialized");

    const queueStartup = await initializeImportQueue();
    if (queueStartup.available) {
      console.log("✅ BullMQ import queue initialized");
    } else {
      console.warn(`⚠️ ${queueStartup.message}`);
    }

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://0.0.0.0:${PORT}/api`);
      console.log(`Health Check: http://0.0.0.0:${PORT}/health`);
      console.log(`Environment: ${process.env["NODE_ENV"]}`);
    });

    const handleShutdown = async (signal: string) => {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      console.log(`Received ${signal}, shutting down gracefully...`);

      await closeImportQueue().catch((error: unknown) => {
        console.error("Failed to close import queue:", error);
      });

      await prisma.$disconnect().catch((error: unknown) => {
        console.error("Failed to disconnect Prisma:", error);
      });

      if (server) {
        await new Promise<void>((resolve) => {
          server?.close(() => resolve());
        });
      }

      process.exit(0);
    };

    process.once("SIGINT", () => {
     handleShutdown("SIGINT");
    });

    process.once("SIGTERM", () => {
     handleShutdown("SIGTERM");
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
}

// Only start server if this file is the main entry point
if (import.meta.main) {
  startServer();
}

export default app;
