import { Router } from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { NotificationsController } from "../controllers/notificationsController";
import { validateRequest } from "../middleware/validation";
import {
  registerPushTokenSchema,
  sendTestNotificationSchema,
  unregisterPushTokenSchema,
} from "../validators/notificationsValidator";

const router: Router = Router();
const controller = new NotificationsController();

router.post(
  "/token",
  createAuthMiddleware({ requireStore: false }),
  validateRequest(registerPushTokenSchema),
  createAuthHandler(controller.registerPushToken.bind(controller))
);

router.post(
  "/token/remove",
  createAuthMiddleware({ requireStore: false }),
  validateRequest(unregisterPushTokenSchema),
  createAuthHandler(controller.unregisterPushToken.bind(controller))
);

router.post(
  "/test",
  createAuthMiddleware({ requireStore: false }),
  validateRequest(sendTestNotificationSchema),
  createAuthHandler(controller.sendTestNotification.bind(controller))
);

router.get("/unread-count", createAuthMiddleware(), createAuthHandler(controller.getUnreadCount.bind(controller)));

export default router;
