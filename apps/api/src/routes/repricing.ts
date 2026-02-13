import express from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { RepricingController } from "../controllers/repricingController";
import { Permission } from "../generated/public/client";

const router: express.Router = express.Router();
const repricingController = new RepricingController();

// All routes require authentication
router.use(createAuthMiddleware());
const requireManageProducts = requirePermission([Permission.MANAGE_PRODUCTS]);

// POST /api/repricing/preview - Preview price changes
router.post(
  "/preview",
  requireManageProducts,
  createAuthHandler(repricingController.previewRepricing)
);

// POST /api/repricing/apply - Apply price changes
router.post(
  "/apply",
  requireManageProducts,
  createAuthHandler(repricingController.applyRepricing)
);

// GET /api/repricing/history - Get price change history
router.get(
  "/history",
  requireManageProducts,
  createAuthHandler(repricingController.getPriceHistory)
);

export default router;
