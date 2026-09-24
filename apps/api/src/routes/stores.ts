import { Router, RequestHandler } from "express";
import { StoresController } from "../controllers/storesController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { validateRequest, validateQuery } from "../middleware/validation";
import { z } from "zod";

const router: Router = Router();
const storesController = new StoresController();

const updateStoreSchema = z.object({
  name: z
    .string()
    .min(1, "Store name must not be empty")
    .max(100, "Store name must be less than 100 characters")
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be exactly 3 characters")
    .toUpperCase()
    .optional(),
  unit_id: z.string().optional(),
  loyalty_cashback_percentage: z.coerce
    .number()
    .min(0, "Cashback percentage cannot be negative")
    .max(100, "Cashback percentage cannot exceed 100")
    .optional(),
  // E-commerce fields
  online_store_enabled: z.boolean().optional(),
  online_store_slug: z.string().optional(),
  bopis_enabled: z.boolean().optional(),
  online_order_prefix: z.string().optional(),
});

const storeQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional(),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .optional(),
});

const storeSearchSchema = z.object({
  q: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(100, "Search query must be less than 100 characters"),
});

const createStoreSchema = updateStoreSchema.extend({
  name: z
    .string()
    .min(1, "Store name must not be empty")
    .max(100, "Store name must be less than 100 characters"),
  currency: z.enum(["USD", "UZS", "EUR", "RUB"], {
    message: "Currency must be one of: USD, EUR, UZS, RUB",
  }),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .max(15, "Phone number must be less than 15 characters"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters"),
});

router.post(
  "/create",
  createAuthMiddleware({ requireStore: false }),
  validateRequest(createStoreSchema),
  createAuthHandler(storesController.createStore)
);

// Identity read for the waiting UI: pending members are allowed through so
// they can see their store while blocked from every other protected surface.
router.get(
  "/my-store",
  createAuthMiddleware({ requireStore: false, allowPending: true }),
  createAuthHandler(storesController.getStore)
);

// Auth middleware that doesn't require an active store (for store creation/listing)
router.use(createAuthMiddleware());

router.get(
  "/search",
  validateQuery(storeSearchSchema),
  createAuthHandler(storesController.searchStores)
);

const switchStoreSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
});

// Session-based store switch (returns new token with activeStoreId)
router.post(
  "/switch",
  validateRequest(switchStoreSchema),
  createAuthHandler(storesController.switchStore)
);

// Legacy GET endpoint for fetching store details
router.get("/switch/:id", createAuthHandler(storesController.getStoreById));

// Routes that don't strictly require a store (for onboarding/list)
router.get(
  "/",
  validateQuery(storeQuerySchema),
  createAuthHandler(storesController.getStores)
);

router.get("/stats", createAuthHandler(storesController.getStoreStats));

router.get(
  "/history",
  createAuthHandler(storesController.getSubscriptionHistory)
);

router.put(
  "/",
  requireAdmin as unknown as RequestHandler,
  validateRequest(updateStoreSchema),
  createAuthHandler(storesController.updateStore)
);

router.delete(
  "/",
  requireAdmin as unknown as RequestHandler,
  createAuthHandler(storesController.deleteStore)
);

// Get store by ID
router.get("/:id", createAuthHandler(storesController.getStoreById));



export default router;
