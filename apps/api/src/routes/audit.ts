import express from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { AuditController } from "../controllers/auditController";

const router: express.Router = express.Router();
const auditController = new AuditController();

// All routes require authentication

// GET /api/audit/history - Get all audits
router.get(
  "/history",
  createAuthMiddleware(),
  createAuthHandler(auditController.getAudits)
);

// GET /api/audit/:id - Get audit by ID
router.get(
  "/:id",
  createAuthMiddleware(),
  createAuthHandler(auditController.getAudit)
);

// POST /api/audit/start - Start new audit
router.post(
  "/start",
  createAuthMiddleware(),
  createAuthHandler(auditController.startAudit)
);

// POST /api/audit/:id/scan - Scan item during audit
router.post(
  "/:id/scan",
  createAuthMiddleware(),
  createAuthHandler(auditController.scanItem)
);

// PUT /api/audit/:id/item - Update audit item manually
router.put(
  "/:id/item",
  createAuthMiddleware(),
  createAuthHandler(auditController.updateAuditItem)
);

// POST /api/audit/:id/complete - Complete audit
router.post(
  "/:id/complete",
  createAuthMiddleware(),
  createAuthHandler(auditController.completeAudit)
);

// PUT /api/audit/:id/cancel - Cancel audit
router.put(
  "/:id/cancel",
  createAuthMiddleware(),
  createAuthHandler(auditController.cancelAudit)
);

export default router;
