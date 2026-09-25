import { Router, RequestHandler } from "express";
import { StaffController } from "../controllers/staffController";
import { InvitesController } from "../controllers/invitesController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { validateRequest, validateParams } from "../middleware/validation";
import {
  createInviteSchema,
  inviteIdParamSchema,
} from "../validators/inviteValidator";
import { approveAssignmentSchema } from "../validators/staffValidator";

const router: Router = Router();
const staffController = new StaffController();
const invitesController = new InvitesController();

router.use(createAuthMiddleware());
router.use(requireAdmin as unknown as RequestHandler);

router.post(
  "/invites",
  validateRequest(createInviteSchema),
  createAuthHandler((req, res) => invitesController.createInvite(req, res))
);

router.get(
  "/invites",
  createAuthHandler((req, res) => invitesController.listInvites(req, res))
);

router.delete(
  "/invites/:inviteId",
  validateParams(inviteIdParamSchema),
  createAuthHandler((req, res) => invitesController.revokeInvite(req, res))
);

router.get(
  "/assignments",
  createAuthHandler(staffController.listAssignments)
);

router.post(
  "/assignments/:assignmentId/approve",
  validateRequest(approveAssignmentSchema),
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
