import express from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { AuditController } from "../controllers/auditController";
import { Permission } from "../generated/public/client";

const router: express.Router = express.Router();
const auditController = new AuditController();
const requireManageInventory = requirePermission([Permission.MANAGE_INVENTORY]);

// All routes require authentication

// GET /api/audit/history - Get all audits
router.get(
  "/history",
  createAuthMiddleware(),
  requireManageInventory,
  createAuthHandler(auditController.getAudits)
);

// GET /api/audit/:id - Get audit by ID
router.get(
  "/:id",
  createAuthMiddleware(),
  requireManageInventory,
  createAuthHandler(auditController.getAudit)
);

// POST /api/audit/start - Start new audit
router.post(
  "/start",
  createAuthMiddleware(),
  requireManageInventory,
  createAuthHandler(auditController.startAudit)
);

// POST /api/audit/:id/scan - Scan item during audit
router.post(
  "/:id/scan",
  createAuthMiddleware(),
  requireManageInventory,
  createAuthHandler(auditController.scanItem)
);

// PUT /api/audit/:id/item - Update audit item manually
router.put(
  "/:id/item",
  createAuthMiddleware(),
  requireManageInventory,
  createAuthHandler(auditController.updateAuditItem)
);

// POST /api/audit/:id/complete - Complete audit
router.post(
  "/:id/complete",
  createAuthMiddleware(),
  requireManageInventory,
  createAuthHandler(auditController.completeAudit)
);

// PUT /api/audit/:id/cancel - Cancel audit
router.put(
  "/:id/cancel",
  createAuthMiddleware(),
  requireManageInventory,
  createAuthHandler(auditController.cancelAudit)
);

export default router;
