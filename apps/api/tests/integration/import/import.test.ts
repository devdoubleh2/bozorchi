import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Response } from "express";
import type { AuthRequest } from "../../../src/middleware/auth";
import type { ImportJobStatus } from "../../../src/lib/importQueue";

const enqueueImportJobMock = mock(async () => "job-123");
const getImportJobStatusMock = mock(
  async (_jobId: string): Promise<ImportJobStatus | null> => null
);
const isImportQueueAvailableMock = mock(() => true);
const getImportQueueUnavailableReasonMock = mock(
  () => "REDIS_URL/BullMQ unavailable"
);

class MockImportQueueUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportQueueUnavailableError";
  }
}

mock.module("../../../src/lib/importQueue", () => ({
  enqueueImportJob: enqueueImportJobMock,
  getImportJobStatus: getImportJobStatusMock,
  isImportQueueAvailable: isImportQueueAvailableMock,
  getImportQueueUnavailableReason: getImportQueueUnavailableReasonMock,
  ImportQueueUnavailableError: MockImportQueueUnavailableError,
}));

const { ImportController } = await import("../../../src/controllers/importController");

const createMockResponse = () => {
  let statusCode = 200;
  let body: unknown;

  const response = {
    status: mock((code: number) => {
      statusCode = code;
      return response as unknown as Response;
    }),
    json: mock((payload: unknown) => {
      body = payload;
      return response as unknown as Response;
    }),
  } as unknown as Response;

  return {
    response,
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
};

const buildValidProduct = (overrides?: Partial<Record<string, unknown>>) => ({
  productName: "Test Product",
  variationName: "Test Variation",
  barcode: "1234567890123",
  sku: "SKU-1",
  unitName: "pcs",
  price: 100,
  deliveryCost: 0,
  sellingPrice: 150,
  wholesalePrice: 120,
  initialStock: 5,
  color: "#4fc3f7",
  description: "Desc",
  productCategoryName: "Category",
  ...(overrides || {}),
});

const createTenantPrismaMock = () => ({
  productVariation: {
    findMany: mock(async () => []),
  },
});

const buildRequest = (
  body: Record<string, unknown>,
  tenantPrisma = createTenantPrismaMock()
) =>
  ({
    body,
    params: {},
    store: { id: "store-1" },
    organization: { id: "org-1" },
    tenantPrisma,
    userId: "user-1",
  } as unknown as AuthRequest);

describe("Import API Integration (controller-level)", () => {
  beforeEach(() => {
    enqueueImportJobMock.mockClear();
    getImportJobStatusMock.mockClear();
    isImportQueueAvailableMock.mockClear();
    getImportQueueUnavailableReasonMock.mockClear();

    enqueueImportJobMock.mockImplementation(async () => "job-123");
    getImportJobStatusMock.mockImplementation(async () => null);
    isImportQueueAvailableMock.mockImplementation(() => true);
    getImportQueueUnavailableReasonMock.mockImplementation(
      () => "REDIS_URL/BullMQ unavailable"
    );
  });

  it("POST /api/import/execute returns 202 with jobId", async () => {
    const controller = new ImportController();
    const req = buildRequest({ products: [buildValidProduct()] });
    const res = createMockResponse();

    await controller.executeImport(req, res.response);

    expect(res.getStatusCode()).toBe(202);
    expect(res.getBody()).toEqual({
      jobId: "job-123",
      status: "queued",
    });
    expect(enqueueImportJobMock).toHaveBeenCalledTimes(1);
  });

  it("GET /api/import/jobs/:jobId returns completed status with consistent counts", async () => {
    const controller = new ImportController();
    const req = buildRequest({});
    req.params = { jobId: "job-123" } as Record<string, string>;

    getImportJobStatusMock.mockImplementation(async () => ({
      jobId: "job-123",
      status: "completed",
      progress: {
        inputCount: 4,
        processedCount: 4,
        successCount: 3,
        failCount: 1,
      },
      result: {
        inputCount: 4,
        processedCount: 4,
        successCount: 3,
        failCount: 1,
        errors: [{ row: 5, product: "Test", error: "x" }],
        durationMs: 200,
      },
      ownership: {
        organizationId: "org-1",
        storeId: "store-1",
      },
    }));

    const res = createMockResponse();
    await controller.getImportJobStatus(req, res.response);

    expect(res.getStatusCode()).toBe(200);

    const body = res.getBody() as {
      result: {
        inputCount: number;
        successCount: number;
        failCount: number;
      };
    };

    expect(body.result.successCount + body.result.failCount).toBe(
      body.result.inputCount
    );
  });

  it("POST /api/import/validate-json rejects in-file dedupe-key duplicates", async () => {
    const controller = new ImportController();
    const req = buildRequest({
      products: [
        buildValidProduct({ barcode: "111111" }),
        buildValidProduct({ barcode: "222222" }),
      ],
    });

    const res = createMockResponse();
    await controller.validateJson(req, res.response);

    expect(res.getStatusCode()).toBe(200);

    const body = res.getBody() as {
      valid: boolean;
      errors: Array<{ field: string }>;
    };

    expect(body.valid).toBe(false);
    expect(body.errors.some((item) => item.field === "dedupeKey")).toBe(true);
  });

  it("POST /api/import/execute returns 503 when queue is unavailable", async () => {
    const controller = new ImportController();
    const req = buildRequest({ products: [buildValidProduct()] });
    const res = createMockResponse();

    isImportQueueAvailableMock.mockImplementation(() => false);
    getImportQueueUnavailableReasonMock.mockImplementation(
      () => "REDIS_URL/BullMQ unavailable"
    );

    await controller.executeImport(req, res.response);

    expect(res.getStatusCode()).toBe(503);
  });
});
