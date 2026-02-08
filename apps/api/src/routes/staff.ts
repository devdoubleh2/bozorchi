import { Router, RequestHandler } from "express";
import { StaffController } from "../controllers/staffController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";

const router: Router = Router();
const staffController = new StaffController();

router.use(createAuthMiddleware());
router.use(requireAdmin as unknown as RequestHandler);

router.get(
  "/assignments",
  createAuthHandler(staffController.listAssignments)
);

router.post(
  "/assignments/:assignmentId/approve",
  createAuthHandler(staffController.approveAssignment)
);

router.put(
  "/assignments/:assignmentId",
  createAuthHandler(staffController.updateAssignment)
);

router.delete(
  "/assignments/:assignmentId",
  createAuthHandler(staffController.removeAssignment)
);

export default router;
