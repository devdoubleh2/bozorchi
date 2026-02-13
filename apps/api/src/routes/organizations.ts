import { Router, Request, Response, NextFunction } from "express";
import Decimal from "decimal.js";
import { OrganizationsController } from "../controllers/organizationsController";
import { createAuthHandler, createAuthMiddleware, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { z } from "zod";
import { getTenantPrisma, prisma } from "../lib/prisma";
import { logger as log } from "../lib/logger";
import { TelegramController } from "../controllers/telegramController";
import { createPendingOrder } from "../services/ecommerceOrders";

const router: Router = Router();
const organizationsController = new OrganizationsController();
const telegramController = new TelegramController();

/**
 * Wraps public handlers with proper error handling and type safety.
 * Used for e-commerce endpoints that don't require authentication.
 */
const publicHandler = (
  handler: (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => Promise<Response | void> | Response | void
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await handler(req as AuthRequest, res, next);
    } catch (error) {
      log.error("OrganizationsRoute", "Public handler error", error);
      next(error);
    }
  };
};

/**
 * Validation schema for e-commerce transaction creation.
 * Enforces strict type checking for incoming order data.
 */
const ecommerceTransactionSchema = z.object({
  params: z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
  }),
  body: z.object({
    product_variation_id: z.string().min(1, "Product variation ID is required"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    unit_price: z.number().min(0, "Unit price cannot be negative"),
    total_amount: z.number().min(0, "Total amount cannot be negative"),
    transaction_type: z.enum(["export"]),
    phone_number: z.string().min(5, "Phone number is required"),
    remarks: z.string().max(500, "Remarks too long").optional(),
    group_id: z.string().max(100, "Group ID too long").optional(),
    currency: z.string().optional(),
  })
});

router.get(
    "/",
    createAuthMiddleware({ requireStore: false }),
    createAuthHandler(organizationsController.getMyOrganization)
);

// Protected route to update e-commerce status
router.patch(
    "/ecommerce-status",
    createAuthMiddleware({ requireStore: false }),
    createAuthHandler(organizationsController.updateEcommerceStatus)
);

// Public routes for e-commerce catalog
router.get(
    "/by-name/:slug",
    publicHandler(organizationsController.getBySlug)
);

router.get(
    "/:organizationId/products",
    publicHandler(organizationsController.getProducts)
);

// Public endpoint for e-commerce orders (no authentication required)
router.post(
    "/:organizationId/transactions",
    validate(ecommerceTransactionSchema),
    publicHandler(async (req: AuthRequest, res: Response) => {
        const { organizationId } = req.params;
        const {
            product_variation_id,
            quantity,
            total_amount,
            phone_number,
            remarks,
            group_id,
            currency,
        } = req.body;

        // Fetch organization with e-commerce configuration and associated store
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization) {
            log.warn("OrganizationsRoute", "Organization not found", { organizationId });
            return res.status(404).json({
                error: "Organization not found",
                code: "ORG_NOT_FOUND",
            });
        }

        if (!organization.ecommerce_enabled) {
            log.warn("OrganizationsRoute", "E-commerce not enabled", {
                organizationId,
                organizationName: organization.name,
            });
            return res.status(403).json({
                error: "E-commerce is not enabled for this organization",
                code: "ECOMMERCE_DISABLED",
            });
        }

        const tenantPrisma = await getTenantPrisma(organization.id);
        const stores = await tenantPrisma.store.findMany({
            where: { organization_id: organizationId },
        });

        if (!stores || stores.length === 0) {
            log.error("OrganizationsRoute", "No store found for organization", {
                organizationId,
                organizationName: organization.name,
            });
            return res.status(404).json({
                error: "No store configured for this organization",
                code: "STORE_NOT_FOUND",
            });
        }

        const store = stores[0];
        if (!store) {
            return res.status(404).json({
                error: "Store not available",
                code: "STORE_NOT_FOUND",
            });
        }

        // Load product variation from DB to compute prices server-side
        const productVariation = await tenantPrisma.productVariation.findUnique({
            where: { id: product_variation_id },
        });

        if (!productVariation) {
            log.error("OrganizationsRoute", "Product variation not found", {
                product_variation_id,
                organizationId,
            });
            return res.status(404).json({
                error: "Product not found",
                code: "PRODUCT_NOT_FOUND",
            });
        }

        // Compute prices server-side using authoritative product data with Decimal precision
        const priceValue =
          typeof productVariation.selling_price === "number"
            ? productVariation.selling_price
            : productVariation.selling_price?.toNumber?.() || 0;
        const computedUnitPriceDecimal = new Decimal(priceValue);
        const computedTotalAmountDecimal = computedUnitPriceDecimal.mul(new Decimal(quantity));
        const computedCurrency = currency || "UZS";

        // Validate client-sent totals match server-computed values (allow 1% tolerance for rounding)
        const clientTotalDecimal = new Decimal(total_amount);
        const tolerance = computedTotalAmountDecimal.mul(new Decimal('0.01'));
        const difference = clientTotalDecimal.sub(computedTotalAmountDecimal).abs();
        
        if (difference.greaterThan(tolerance)) {
            log.warn("OrganizationsRoute", "Client total_amount mismatch detected", {
                clientTotal: total_amount,
                computedTotal: computedTotalAmountDecimal.toNumber(),
                product_variation_id,
            });
            return res.status(400).json({
                error: "Total amount mismatch. Server-computed total differs from client value",
                code: "PRICE_MISMATCH",
                expected: computedTotalAmountDecimal.toNumber(),
                received: total_amount,
            });
        }

        const order = createPendingOrder({
            organizationId: organization.id,
            storeId: store.id,
            phoneNumber: phone_number,
            items: [
                {
                    product_variation_id,
                    quantity,
                    unit_price: computedUnitPriceDecimal.toNumber(),
                    total_amount: computedTotalAmountDecimal.toNumber(),
                    remarks,
                },
            ],
            totalAmount: computedTotalAmountDecimal.toNumber(),
            currency: computedCurrency,
            groupId: group_id,
        });

        // Wrap notification with error handling and retry fallback
        try {
            await telegramController.notifyEcommerceOrderPending({
                orderId: order.id,
                organizationId: organization.id,
                storeName: store.name,
                phoneNumber: order.phoneNumber,
                items: order.items,
                totalAmount: order.totalAmount,
                currency: order.currency,
            });
        } catch (notifyError) {
            log.warn("OrganizationsRoute", "Failed to notify owner about pending order", {
                orderId: order.id,
                organizationId: organization.id,
                error: (notifyError as Error).message,
            });
            // Mark order with pending notification flag for retry
            // TODO: Implement retry job or mark order.pendingNotification = true
        }

        return res.status(202).json({
            message: "Order received and pending approval",
            orderId: order.id,
            status: order.status,
        });
    })
);

export default router;
