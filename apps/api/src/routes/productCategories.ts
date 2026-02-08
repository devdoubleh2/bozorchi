import { Router } from "express";
import { ProductCategoriesController } from "../controllers/productCategoriesController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { validateParams, validateRequest } from "../middleware/validation";
import { z } from "zod";

const router = Router();
const productCategoriesController = new ProductCategoriesController();

// Validation schemas
const createProductCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name must be at least 1 character long")
    .max(255, "Name must not exceed 255 characters"),
  color: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "Color must be a valid hex color code"
    )
    .optional(),
});

const updateProductCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name must be at least 1 character long")
    .max(255, "Name must not exceed 255 characters")
    .optional(),
  color: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "Color must be a valid hex color code"
    )
    .optional(),
});

const productCategoryIdParamSchema = z.object({
  id: z.string().min(1, "Product category ID is required"),
});

// All routes require authentication
router.use(createAuthMiddleware());

// Routes
router.get(
  "/names",
  createAuthHandler(productCategoriesController.getCategoryNames)
);

router.get(
  "/",
  createAuthHandler(productCategoriesController.getProductCategories)
);

router.post(
  "/",
  validateRequest(createProductCategorySchema),
  createAuthHandler(productCategoriesController.createProductCategory)
);

router.put(
  "/:id",
  validateParams(productCategoryIdParamSchema),
  validateRequest(updateProductCategorySchema),
  createAuthHandler(productCategoriesController.updateProductCategory)
);

router.delete(
  "/:id",
  validateParams(productCategoryIdParamSchema),
  createAuthHandler(productCategoriesController.deleteProductCategory)
);

export default router;
