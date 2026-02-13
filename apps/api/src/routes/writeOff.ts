import express from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { WriteOffController } from "../controllers/writeOffController";
import { Permission } from "../generated/public/client";

const router: express.Router = express.Router();
const writeOffController = new WriteOffController();

// All routes require authentication
router.use(createAuthMiddleware());
const requireManageInventory = requirePermission([Permission.MANAGE_INVENTORY]);

// GET /api/write-offs - Get all write-offs with filters
router.get(
  "/",
  requireManageInventory,
  createAuthHandler(writeOffController.getWriteOffs)
);

// POST /api/write-offs - Create new write-off
router.post(
  "/",
  requireManageInventory,
  createAuthHandler(writeOffController.createWriteOff)
);

// GET /api/write-offs/summary - Get write-off summary statistics
router.get(
  "/summary",
  requireManageInventory,
  createAuthHandler(writeOffController.getWriteOffSummary)
);

// DELETE /api/write-offs/:id - Delete/reverse write-off (admin only, within 24 hours)
router.delete(
  "/:id",
  requireManageInventory,
  createAuthHandler(writeOffController.deleteWriteOff)
);

export default router;
