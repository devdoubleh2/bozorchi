import { Router } from "express";
import { ProductsController } from "../controllers/productsController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validateRequest, validateParams } from "../middleware/validation";
import fileUploadService from "../services/fileUpload";
import { Permission } from "../generated/public/client";
import { z } from "zod";

const router: Router = Router();
const productsController = new ProductsController();

router.use(createAuthMiddleware());

const requireProductReadAccess = requirePermission([
  Permission.POS_ACCESS,
  Permission.MANAGE_PRODUCTS,
  Permission.MANAGE_INVENTORY,
]);
const requireManageProducts = requirePermission([Permission.MANAGE_PRODUCTS]);

const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name must not be empty")
    .max(200, "Product name must be less than 200 characters"),
  category_id: z.string().optional().nullable(),
  product_category_id: z.string().min(1, "Product category ID is required"),
  image_url: z.string().optional().nullable(),
  type: z.enum(["simple", "variable", "service"]).default("simple"),
  variations: z
    .array(
      z.object({
        name: z.string().min(1, "Variation name must not be empty"),
        description: z.string().optional().nullable(),
        barcode: z.string().optional().nullable(),
        sku: z.string().optional().nullable(),
        price: z.coerce.number().min(0, "Price must be non-negative"),
        selling_price: z.coerce.number().min(0),
        // delivery_cost is optional for legacy clients (mobile) that don't send it
        delivery_cost: z.coerce.number().min(0).optional().default(0),
        wholesale_price: z.coerce.number().min(0).optional().default(0),
        cost_price: z.coerce.number().min(0).optional().default(0),
        unit_id: z.string().min(1, "Unit ID is required"),
        color: z.string().optional().nullable(),
        initial_stock: z.coerce.number().min(0).optional().default(0),
        image_url: z.string().optional().nullable(),
      })
    )
    .min(1, "At least one variation is required"),
}).superRefine((data, ctx) => {
  // For non-service products, barcode is required and must be at least 4 characters
  if (data.type !== "service") {
    data.variations.forEach((variation, index) => {
      if (!variation.barcode || variation.barcode.trim().length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Barcode must be at least 4 characters",
          path: ["variations", index, "barcode"],
        });
      } else if (variation.barcode.trim().length > 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Barcode must be less than 32 characters",
          path: ["variations", index, "barcode"],
        });
      }
    });
  }
});

const updateProductSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Product name must not be empty")
    .max(200, "Product name must be less than 200 characters")
    .optional(),
  category_id: z.string().optional(),
  product_category_id: z.string().optional(),
  image_url: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  variations: z
    .array(
      z.object({
        id: z.string().optional(),
        price: z.coerce.number().min(0).optional(),
        selling_price: z.coerce.number().min(0).optional(),
        delivery_cost: z.coerce.number().min(0).optional(),
        wholesale_price: z.coerce.number().min(0).optional(),
        unit_id: z.string().optional(),
        image_url: z.string().optional().nullable(),
      })
    )
    .optional(),
});

const productIdParamSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
});

// schema for bulk deleting
const bulkDeleteSchema = z.object({
  ids: z.string().array()
})

// Schema for bulk update - validates request body
const bulkUpdateSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variationId: z.string().min(1),
      productImageUrl: z.string().optional().nullable(),
      variationImageUrl: z.string().optional().nullable(),
      productCategoryId: z.string().optional().nullable(),
      sellingPrice: z.coerce.number().min(0).optional(),
      price: z.coerce.number().min(0).optional(),
      deliveryCost: z.coerce.number().min(0).optional(),
      supplierId: z.string().optional().nullable(),
      unitId: z.string().optional().nullable(),
    })
  ).min(1, "At least one item is required"),
});

router.get(
  "/list",
  requireProductReadAccess,
  createAuthHandler(productsController.getProducts)
);

router.get(
  "/search",
  requireProductReadAccess,
  createAuthHandler(productsController.searchProducts)
);

router.get(
  "/barcode/:barcode",
  requireProductReadAccess,
  createAuthHandler(productsController.getProductByBarcode)
);

router.get(
  "/:id",
  requireProductReadAccess,
  createAuthHandler(productsController.getProduct)
);

router.post(
  "/",
  createAuthMiddleware(),
  requireManageProducts,
  async (req, res, next) => {
    try {
      if (req.file) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            error: "Invalid file type",
            details: ["Only JPEG, PNG, GIF, and WebP images are allowed"],
          });
        }

        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
          return res.status(400).json({
            error: "File too large",
            details: ["File size must be less than 5MB"],
          });
        }

        const imageUrl = await fileUploadService.uploadImage(
          req.file.buffer,
          req.file.originalname
        );
        req.body.image_url = imageUrl;
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        error: "Failed to process image",
        details: ["An error occurred while processing the uploaded image"],
      });
    }
  },
  validateRequest(createProductSchema),
  createAuthHandler(productsController.createProduct)
);

// Bulk update products/variations
router.put(
  "/bulk-update",
  requireManageProducts,
  validateRequest(bulkUpdateSchema),
  createAuthHandler(productsController.bulkUpdateProducts)
);

router.put(
  "/:id",
  createAuthMiddleware(),
  requireManageProducts,
  async (req, res, next) => {
    try {
      if (req.file) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            error: "Invalid file type",
            details: ["Only JPEG, PNG, GIF, and WebP images are allowed"],
          });
        }

        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
          return res.status(400).json({
            error: "File too large",
            details: ["File size must be less than 5MB"],
          });
        }

        const imageUrl = await fileUploadService.uploadImage(
          req.file.buffer,
          req.file.originalname
        );
        req.body.image_url = imageUrl;
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        error: "Failed to process image",
        details: ["An error occurred while processing the uploaded image"],
      });
    }
  },
  validateRequest(updateProductSchema),
  createAuthHandler(productsController.updateProduct)
);

// bulk delete - must be defined before /:id to avoid being matched as an ID
router.delete(
  "/bulk",
  requireManageProducts,
  validateRequest(bulkDeleteSchema),
  createAuthHandler(productsController.bulkDeleteProducts)
);

router.delete(
  "/:id",
  requireManageProducts,
  validateParams(productIdParamSchema),
  createAuthHandler(productsController.deleteProduct)
);



export default router;
