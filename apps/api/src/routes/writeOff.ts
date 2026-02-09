import express from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { WriteOffController } from "../controllers/writeOffController";

const router: express.Router = express.Router();
const writeOffController = new WriteOffController();

// All routes require authentication
router.use(createAuthMiddleware());

// GET /api/write-offs - Get all write-offs with filters
router.get("/", createAuthHandler(writeOffController.getWriteOffs));

// POST /api/write-offs - Create new write-off
router.post("/", createAuthHandler(writeOffController.createWriteOff));

// GET /api/write-offs/summary - Get write-off summary statistics
router.get(
  "/summary",
  createAuthHandler(writeOffController.getWriteOffSummary)
);

// DELETE /api/write-offs/:id - Delete/reverse write-off (admin only, within 24 hours)
router.delete("/:id", createAuthHandler(writeOffController.deleteWriteOff));

export default router;
