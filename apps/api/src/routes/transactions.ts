import { Router } from "express";
import { z } from "zod";
import { TransactionsController } from "../controllers/transactionsController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validation";
import {
  createTransactionSchema,
  getTransactionsSchema,
} from "../validators/transactionValidator";

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

// Routes
router.get(
  "/",
  validate(getTransactionsValidation),
  createAuthHandler(transactionsController.getTransactions)
);

router.get(
  "/stats",
  validate(getTransactionsValidation),
  createAuthHandler(transactionsController.getDashboardStats)
);

router.get(
  "/group/:groupId",
  validate(z.object({
    params: z.object({ groupId: z.string() }),
    query: z.object({ storeId: z.string() })
  })),
  createAuthHandler(transactionsController.getTransactionsByGroup)
);

router.get(
  "/:id",
  createAuthHandler(transactionsController.getTransaction)
);

router.delete(
  "/:id",
  validate(getTransactionValidation),
  createAuthHandler(transactionsController.deleteTransaction)
);

router.post(
  "/",
  validate(createTransactionValidation),
  createAuthHandler(transactionsController.createTransaction)
);

router.post(
  "/:id/return",
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
  validate(transferStockValidation),
  createAuthHandler(transactionsController.transferStock)
);

export default router;
