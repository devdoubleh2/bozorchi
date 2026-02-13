import {
  Job,
  JobProgress,
  Queue,
  QueueEvents,
  Worker,
} from "bullmq";
import { redis } from "./redis";
import logger from "../../logs/log";
import { getTenantPrisma } from "./prisma";
import {
  executeImportRows,
  ImportExecutionResult,
  ImportProgressSnapshot,
  ProductRow,
} from "../services/importService";

export const IMPORT_QUEUE_NAME = "bulk-product-import";

export interface ImportJobPayload {
  organizationId: string;
  storeId: string;
  userId: string;
  products: ProductRow[];
  requestedAt: string;
}

export type ImportJobResult = ImportExecutionResult;

export type ImportJobState = "queued" | "running" | "completed" | "failed";

export interface ImportJobStatus {
  jobId: string;
  status: ImportJobState;
  progress: ImportProgressSnapshot;
  result?: ImportJobResult;
  failedReason?: string;
  ownership: {
    organizationId: string;
    storeId: string;
  };
}

export class ImportQueueUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportQueueUnavailableError";
  }
}

let queueConnection: typeof redis | null = null;
let workerConnection: typeof redis | null = null;
let queueEventsConnection: typeof redis | null = null;

let importQueue: Queue | null = null;
let importWorker: Worker<ImportJobPayload, ImportJobResult> | null = null;
let importQueueEvents: QueueEvents | null = null;

let queueAvailable = false;
let queueUnavailableReason =
  "REDIS_URL/BullMQ unavailable. Bulk import queue is not initialized.";

const defaultProgress = (inputCount: number): ImportProgressSnapshot => ({
  inputCount,
  processedCount: 0,
  successCount: 0,
  failCount: 0,
});

const mapBullState = (state: string): ImportJobState => {
  if (state === "active") {
    return "running";
  }

  if (state === "completed") {
    return "completed";
  }

  if (state === "failed") {
    return "failed";
  }

  return "queued";
};

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallback;
};

const normalizeProgress = (
  progress: JobProgress,
  fallbackInputCount: number
): ImportProgressSnapshot => {
  if (typeof progress === "number") {
    return {
      inputCount: fallbackInputCount,
      processedCount: toNumber(progress, 0),
      successCount: 0,
      failCount: 0,
    };
  }

  if (!progress || typeof progress !== "object") {
    return defaultProgress(fallbackInputCount);
  }

  const progressRecord = progress as Record<string, unknown>;

  const inputCount = toNumber(progressRecord["inputCount"], fallbackInputCount);
  const successCount = toNumber(progressRecord["successCount"], 0);
  const failCount = toNumber(progressRecord["failCount"], 0);
  const processedCount = toNumber(
    progressRecord["processedCount"],
    successCount + failCount
  );

  return {
    inputCount,
    processedCount,
    successCount,
    failCount,
  };
};

export const isImportQueueAvailable = (): boolean => queueAvailable;

export const getImportQueueUnavailableReason = (): string =>
  queueUnavailableReason;

export async function initializeImportQueue(): Promise<{
  available: boolean;
  message: string;
}> {
  if (queueAvailable && importQueue && importWorker && importQueueEvents) {
    return {
      available: true,
      message: "BullMQ import queue already initialized",
    };
  }

  const redisUrl = process.env["REDIS_URL"];
  if (!redisUrl) {
    queueAvailable = false;
    queueUnavailableReason =
      "REDIS_URL/BullMQ unavailable. REDIS_URL environment variable is not configured.";

    return {
      available: false,
      message: queueUnavailableReason,
    };
  }

  await closeImportQueue();

  try {
    if (!redis) {
      throw new Error("Redis client is not available");
    }

    queueConnection = redis;
    workerConnection = redis;
    queueEventsConnection = redis;

    importQueue = new Queue(IMPORT_QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions: {
        removeOnComplete: {
          age: 60 * 60 * 24,
          count: 1000,
        },
        removeOnFail: {
          age: 60 * 60 * 24,
          count: 1000,
        },
      },
    });

    importQueueEvents = new QueueEvents(IMPORT_QUEUE_NAME, {
      connection: queueEventsConnection,
    });

    importWorker = new Worker<ImportJobPayload, ImportJobResult>(
      IMPORT_QUEUE_NAME,
      async (job) => {
        const tenantPrisma = await getTenantPrisma(job.data.organizationId);

        const result = await executeImportRows({
          tenantPrisma,
          organizationId: job.data.organizationId,
          storeId: job.data.storeId,
          userId: job.data.userId,
          products: job.data.products,
          onProgress: async (progress) => {
            await job.updateProgress(progress);
          },
        });

        return result;
      },
      {
        connection: workerConnection,
        concurrency: 1,
      }
    );

    importQueueEvents.on("error", (error) => {
      logger.error("Import queue events error", "importQueue", error);
    });

    importWorker.on("error", (error) => {
      logger.error("Import queue worker error", "importQueue", error);
    });

    importWorker.on("failed", (job, error) => {
      logger.error("Import job failed", "importQueue", {
        jobId: job?.id,
        error: error.message,
      });
    });

    await Promise.all([
      importQueue.waitUntilReady(),
      importQueueEvents.waitUntilReady(),
      importWorker.waitUntilReady(),
    ]);

    queueAvailable = true;
    queueUnavailableReason = "";

    return {
      available: true,
      message: "BullMQ import queue initialized",
    };
  } catch (error) {
    queueAvailable = false;
    queueUnavailableReason =
      "REDIS_URL/BullMQ unavailable. Failed to initialize queue infrastructure.";

    logger.error("Failed to initialize import queue", "importQueue", error);
    await closeImportQueue();

    return {
      available: false,
      message: queueUnavailableReason,
    };
  }
}

export async function closeImportQueue(): Promise<void> {
  queueAvailable = false;

  await Promise.allSettled([
    importWorker?.close() ?? Promise.resolve(),
    importQueueEvents?.close() ?? Promise.resolve(),
    importQueue?.close() ?? Promise.resolve(),
  ]);

  importWorker = null;
  importQueueEvents = null;
  importQueue = null;

  workerConnection = null;
  queueEventsConnection = null;
  queueConnection = null;
}

const ensureQueue = (): Queue<ImportJobPayload, ImportJobResult> => {
  if (!queueAvailable || !importQueue) {
    throw new ImportQueueUnavailableError(getImportQueueUnavailableReason());
  }

  return importQueue as Queue<ImportJobPayload, ImportJobResult>;
};

export async function enqueueImportJob(
  payload: ImportJobPayload
): Promise<string> {
  const queue = ensureQueue();

  const job = await queue.add(IMPORT_QUEUE_NAME, payload, {
    attempts: 1,
  });

  return String(job.id);
}

const buildStatusFromJob = async (
  job: Job<ImportJobPayload, ImportJobResult>,
  fallbackJobId: string
): Promise<ImportJobStatus> => {
  const state = await job.getState();
  const status = mapBullState(state);
  const inputCount = job.data.products.length;

  let progress = normalizeProgress(job.progress, inputCount);
  let result: ImportJobResult | undefined;

  if (status === "completed") {
    result = job.returnvalue as ImportJobResult;
    if (result) {
      progress = {
        inputCount: result.inputCount,
        processedCount: result.processedCount,
        successCount: result.successCount,
        failCount: result.failCount,
      };
    }
  }

  return {
    jobId: String(job.id ?? fallbackJobId),
    status,
    progress,
    result,
    failedReason: status === "failed" ? job.failedReason || undefined : undefined,
    ownership: {
      organizationId: job.data.organizationId,
      storeId: job.data.storeId,
    },
  };
};

export async function getImportJobStatus(
  jobId: string
): Promise<ImportJobStatus | null> {
  const queue = ensureQueue();

  const job = await queue.getJob(jobId);
  if (!job) {
    return null;
  }

  return buildStatusFromJob(job, jobId);
}
