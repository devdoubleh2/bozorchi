import { Router } from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { ProductVariationsController } from "../controllers/productVariationsController";
import { Permission } from "../generated/public/client";

const router: Router = Router();
const controller = new ProductVariationsController();
const requireProductReadAccess = requirePermission([
  Permission.POS_ACCESS,
  Permission.MANAGE_PRODUCTS,
  Permission.MANAGE_INVENTORY,
]);

router.get(
  "/:id",
  createAuthMiddleware(),
  requireProductReadAccess,
  createAuthHandler(controller.getProductVariation)
);

export default router;
