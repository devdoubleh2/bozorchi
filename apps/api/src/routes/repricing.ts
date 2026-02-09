import express from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { RepricingController } from "../controllers/repricingController";

const router: express.Router = express.Router();
const repricingController = new RepricingController();

// All routes require authentication
router.use(createAuthMiddleware());

// POST /api/repricing/preview - Preview price changes
router.post(
  "/preview",
  createAuthHandler(repricingController.previewRepricing)
);

// POST /api/repricing/apply - Apply price changes
router.post("/apply", createAuthHandler(repricingController.applyRepricing));

// GET /api/repricing/history - Get price change history
router.get("/history", createAuthHandler(repricingController.getPriceHistory));

export default router;
