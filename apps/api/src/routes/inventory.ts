import { Router } from "express";
import { InventoryController } from "../controllers/inventoryController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import {
  validateRequest,
  validateParams,
  validateQuery,
} from "../middleware/validation";
import { z } from "zod";

const router: Router = Router();
const inventoryController = new InventoryController();

const restockSchema = z.object({
  variationId: z.string().min(1, "Variation ID is required"),
  quantity: z.coerce.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  cost_price: z.coerce.number().min(0, "Cost price must be at least 0").optional(),
  price: z.coerce.number().min(0, "Price must be at least 0").optional(),
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

// Routes
router.get(
  "/",
  validateQuery(inventoryQuerySchema),
  createAuthHandler(inventoryController.getInventory)
);

router.get(
  "/stats",
  validateQuery(inventoryQuerySchema),
  createAuthHandler(inventoryController.getStockReport)
);

router.get(
  "/low-stock",
  validateQuery(inventoryQuerySchema),
  createAuthHandler(inventoryController.getLowStockItems)
);

router.get(
  "/:id",
  validateParams(inventoryIdParamSchema),
  createAuthHandler(inventoryController.getInventory)
);

router.post(
  "/restock",
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
  validateRequest(transferSchema),
  createAuthHandler(inventoryController.transfer)
);

export default router;
