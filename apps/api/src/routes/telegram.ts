import { Router } from "express";
import { TelegramController } from "../controllers/telegramController";

const router: Router = Router();
const telegramController = new TelegramController();

/**
 * Webhook endpoint for Telegram bot
 * POST /api/telegram/webhook
 */
router.post("/webhook", (req, res) =>
  telegramController.handleWebhook(req, res)
);

export default router;
