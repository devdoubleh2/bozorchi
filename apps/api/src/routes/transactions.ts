import { Router } from "express";
import { z } from "zod";
import { TransactionsController } from "../controllers/transactionsController";
import {
  AuthRequest,
  createAuthHandler,
  createAuthMiddleware,
} from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validation";
import {
  createTransactionSchema,
  getTransactionsSchema,
} from "../validators/transactionValidator";
import { Permission } from "../generated/public/client";
import logger from "../../logs/log";

const router: Router = Router();
const transactionsController = new TransactionsController();

// Validation wrappers
const createTransactionValidation = z.object({
  body: createTransactionSchema,
});

const getTransactionsValidation = z.object({
  query: getTransactionsSchema,
});

const transactionIdParamSchema = z.object({
  id: z.string(),
});

const getTransactionValidation = z.object({
  params: transactionIdParamSchema,
});

const returnTransactionValidation = z.object({
  params: transactionIdParamSchema,
  body: z.object({
    quantity: z.number().positive().optional(),
  }),
});

// All routes require authentication
router.use(createAuthMiddleware());
const requirePOSAccess = requirePermission([Permission.POS_ACCESS]);
const requireViewAnalytics = requirePermission([Permission.VIEW_ANALYTICS]);
const requirePosOrAnalytics = requirePermission([
  Permission.POS_ACCESS,
  Permission.VIEW_ANALYTICS,
]);
const requireDashboardOrAnalytics = requirePermission([
  Permission.VIEW_DASHBOARD,
  Permission.VIEW_ANALYTICS,
]);
const requireManageInventory = requirePermission([Permission.MANAGE_INVENTORY]);

router.use((req, res, next) => {
  const startedAt = Date.now();
  const authReq = req as AuthRequest;

  void logger.debug("transactionsRoute", "Transactions request started", {
    method: req.method,
    path: req.originalUrl,
    userId: authReq.userId ?? null,
    storeId: authReq.store?.id ?? null,
    query: req.query,
  });

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const logPayload = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: authReq.userId ?? null,
      storeId: authReq.store?.id ?? null,
    };

    if (res.statusCode >= 500) {
      void logger.error(
        "transactionsRoute",
        "Transactions request completed with server error",
        logPayload
      );
      return;
    }

    if (res.statusCode >= 400) {
      void logger.warn(
        "transactionsRoute",
        "Transactions request completed with client error",
        logPayload
      );
      return;
    }

    void logger.info(
      "transactionsRoute",
      "Transactions request completed successfully",
      logPayload
    );
  });

  next();
});

// Routes
router.get(
  "/",
  requireViewAnalytics,
  validate(getTransactionsValidation),
  createAuthHandler(transactionsController.getTransactions)
);

router.get(
  "/stats",
  requireDashboardOrAnalytics,
  validate(getTransactionsValidation),
  createAuthHandler(transactionsController.getDashboardStats)
);

router.get(
  "/group/:groupId",
  requireViewAnalytics,
  validate(z.object({
    params: z.object({ groupId: z.string() }),
    query: z.object({ storeId: z.string() })
  })),
  createAuthHandler(transactionsController.getTransactionsByGroup)
);

router.get(
  "/:id",
  requirePosOrAnalytics,
  createAuthHandler(transactionsController.getTransaction)
);

router.delete(
  "/:id",
  requireViewAnalytics,
  validate(getTransactionValidation),
  createAuthHandler(transactionsController.deleteTransaction)
);

router.post(
  "/",
  requirePOSAccess,
  validate(createTransactionValidation),
  createAuthHandler(transactionsController.createTransaction)
);

router.post(
  "/:id/return",
  requirePOSAccess,
  validate(returnTransactionValidation),
  createAuthHandler(transactionsController.returnTransaction)
);






const exchangeTransactionValidation = z.object({
  params: transactionIdParamSchema,
  body: z.object({
    returnQuantity: z.number().positive(),
    newProductVariationId: z.string(),
    newQuantity: z.number().positive(),
    newUnitPrice: z.number().positive().optional(),
    paymentMethod: z.string().optional(),
  }),
});

router.post(
  "/:id/exchange",
  requirePOSAccess,
  validate(exchangeTransactionValidation),
  createAuthHandler(transactionsController.exchangeTransaction)
);

const repayDebtValidation = z.object({
  body: z.object({
    customerId: z.string(),
    amount: z.number().positive(),
    storeId: z.string(),
  }),
});

router.post(
  "/debt-repayment",
  requirePOSAccess,
  validate(repayDebtValidation),
  createAuthHandler(transactionsController.repayDebt)
);

const transferStockValidation = z.object({
  body: z.object({
    targetStoreId: z.string(),
    productVariationId: z.string(),
    quantity: z.number().positive(),
  }),
});

router.post(
  "/transfer",
  requireManageInventory,
  validate(transferStockValidation),
  createAuthHandler(transactionsController.transferStock)
);

export default router;
