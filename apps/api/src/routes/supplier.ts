import express from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { SupplierController } from "../controllers/supplierController";
import { Permission } from "../generated/public/client";

const router: express.Router = express.Router();
const supplierController = new SupplierController();

// All routes require authentication
router.use(createAuthMiddleware());
const requireManageProducts = requirePermission([Permission.MANAGE_PRODUCTS]);

// GET /api/suppliers - Get all suppliers
router.get(
  "/",
  requireManageProducts,
  createAuthHandler(supplierController.getSuppliers)
);

// GET /api/suppliers/stats - Get supplier statistics
router.get(
  "/stats",
  requireManageProducts,
  createAuthHandler(supplierController.getStats)
);

// GET /api/suppliers/:id - Get supplier by ID
router.get(
  "/:id",
  requireManageProducts,
  createAuthHandler(supplierController.getSupplier)
);

// POST /api/suppliers - Create new supplier
router.post(
  "/",
  requireManageProducts,
  createAuthHandler(supplierController.createSupplier)
);

// PUT /api/suppliers/:id - Update supplier
router.put(
  "/:id",
  requireManageProducts,
  createAuthHandler(supplierController.updateSupplier)
);

// DELETE /api/suppliers/:id - Delete supplier
router.delete(
  "/:id",
  requireManageProducts,
  createAuthHandler(supplierController.deleteSupplier)
);

export default router;
