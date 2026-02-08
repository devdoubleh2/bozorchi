import { Router } from "express";
import { UnitsController } from "../controllers/unitsController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import {
  validateRequest,
  validateParams,
  validateQuery,
} from "../middleware/validation";
import { z } from "zod";

const router: Router = Router();
const unitsController = new UnitsController();

// Validation schemas
const unitSchema = z.object({
  name: z.string().min(1, "Unit name must not be empty").max(50, "Unit name must be less than 50 characters"),
});

const unitIdParamSchema = z.object({
  id: z.string().min(1, "Unit ID is required"),
});

const unitQuerySchema = z.object({
  search: z.string().max(50, "Search term must be less than 50 characters").optional(),
  page: z.coerce.number().int("Page must be an integer").min(1, "Page must be at least 1").optional(),
  limit: z.coerce.number().int("Limit must be an integer").min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").optional(),
});

// All routes require authentication
router.use(createAuthMiddleware());

// Routes
router.get(
  "/",
  validateQuery(unitQuerySchema),
  createAuthHandler(unitsController.getAllUnits)
);

router.post(
  "/",
  validateRequest(unitSchema),
  createAuthHandler(unitsController.createUnit)
);

router.get(
  "/:id",
  validateParams(unitIdParamSchema),
  createAuthHandler(unitsController.getUnit)
);

router.put(
  "/:id",
  validateParams(unitIdParamSchema),
  validateRequest(unitSchema),
  createAuthHandler(unitsController.updateUnit)
);

router.delete(
  "/:id",
  validateParams(unitIdParamSchema),
  createAuthHandler(unitsController.deleteUnit)
);

export default router;
