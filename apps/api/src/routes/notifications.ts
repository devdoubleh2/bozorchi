import { Router } from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { NotificationsController } from "../controllers/notificationsController";

const router = Router();
const controller = new NotificationsController();

router.get("/unread-count", createAuthMiddleware(), createAuthHandler(controller.getUnreadCount.bind(controller)));

export default router;
