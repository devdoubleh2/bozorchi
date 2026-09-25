import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { z } from "zod";

const router: Router = Router();
const authController = new AuthController();

const assignStoreSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  role: z.enum(["owner", "cashier"]).optional(),
});

router.use(createAuthMiddleware({ requireStore: false }));

router.post(
  "/assign-store",
  validateRequest(assignStoreSchema),
  createAuthHandler(authController.assignStore)
);

router.delete("/me", createAuthHandler(authController.deleteMe));

export default router;
