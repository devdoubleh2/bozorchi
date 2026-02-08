import express from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { SupplierController } from "../controllers/supplierController";

const router = express.Router();
const supplierController = new SupplierController();

// All routes require authentication
router.use(createAuthMiddleware());

// GET /api/suppliers - Get all suppliers
router.get("/", createAuthHandler(supplierController.getSuppliers));

// GET /api/suppliers/stats - Get supplier statistics
router.get("/stats", createAuthHandler(supplierController.getStats));

// GET /api/suppliers/:id - Get supplier by ID
router.get("/:id", createAuthHandler(supplierController.getSupplier));

// POST /api/suppliers - Create new supplier
router.post("/", createAuthHandler(supplierController.createSupplier));

// PUT /api/suppliers/:id - Update supplier
router.put("/:id", createAuthHandler(supplierController.updateSupplier));

// DELETE /api/suppliers/:id - Delete supplier
router.delete("/:id", createAuthHandler(supplierController.deleteSupplier));

export default router;
