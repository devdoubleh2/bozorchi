import { Router } from "express";
import { InventoryController } from "../controllers/inventoryController";
import {
  AuthRequest,
  createAuthHandler,
  createAuthMiddleware,
} from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import {
  validateRequest,
  validateParams,
  validateQuery,
} from "../middleware/validation";
import { Permission } from "../generated/public/client";
import { z } from "zod";
import logger from "../../logs/log";

const router: Router = Router();
const inventoryController = new InventoryController();

const restockSchema = z.object({
  variationId: z.string().min(1, "Variation ID is required"),
  quantity: z.coerce.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  cost_price: z.coerce.number().min(0, "Cost price must be at least 0").optional(),
  price: z.coerce.number().min(0, "Price must be at least 0").optional(),
  delivery_cost: z.coerce.number().min(0, "Delivery cost must be at least 0").optional(),
  selling_price: z.coerce.number().min(0, "Selling price must be at least 0").optional(),
});

const inventoryIdParamSchema = z.object({
  id: z.string().min(1, "Inventory ID is required"),
});

const inventoryQuerySchema = z.object({
  storeId: z.string().optional(),
  productId: z.string().optional(),
  lowStock: z.string().transform((val) => val === 'true').optional(),
  stock_level: z.enum(["low", "out", "in_stock"]).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  price_min: z.coerce.number().min(0, "Minimum price must be at least 0").optional(),
  price_max: z.coerce.number().min(0, "Maximum price must be at least 0").optional(),
  page: z.coerce.number().int("Page must be an integer").min(1, "Page must be at least 1").optional(),
  limit: z.coerce.number().int("Limit must be an integer").min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").optional(),
  includeAll: z.string().transform((val) => val === 'true').optional(),
});

// All routes require authentication
router.use(createAuthMiddleware());
const requireManageInventory = requirePermission([Permission.MANAGE_INVENTORY]);

router.use((req, res, next) => {
  const startedAt = Date.now();
  const authReq = req as AuthRequest;

  void logger.debug("inventoryRoute", "Inventory request started", {
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
        "inventoryRoute",
        "Inventory request completed with server error",
        logPayload
      );
      return;
    }

    if (res.statusCode >= 400) {
      void logger.warn(
        "inventoryRoute",
        "Inventory request completed with client error",
        logPayload
      );
      return;
    }

    void logger.info(
      "inventoryRoute",
      "Inventory request completed successfully",
      logPayload
    );
  });

  next();
});

// Routes
router.get(
  "/",
  requireManageInventory,
  validateQuery(inventoryQuerySchema),
  createAuthHandler(inventoryController.getInventory)
);

router.get(
  "/stats",
  requireManageInventory,
  validateQuery(inventoryQuerySchema),
  createAuthHandler(inventoryController.getStockReport)
);

router.get(
  "/low-stock",
  requireManageInventory,
  validateQuery(inventoryQuerySchema),
  createAuthHandler(inventoryController.getLowStockItems)
);

router.get(
  "/:id",
  requireManageInventory,
  validateParams(inventoryIdParamSchema),
  createAuthHandler(inventoryController.getInventory)
);

router.post(
  "/restock",
  requireManageInventory,
  validateRequest(restockSchema),
  createAuthHandler(inventoryController.restock)
);

const transferSchema = z.object({
  items: z.array(
    z.object({
      variationId: z.string().min(1, "Variation ID is required"),
      quantity: z.coerce.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
    })
  ).min(1, "At least one item is required"),
  destinationStoreId: z.string().min(1, "Destination store ID is required"),
});

router.post(
  "/transfer",
  requireManageInventory,
  validateRequest(transferSchema),
  createAuthHandler(inventoryController.transfer)
);

export default router;
