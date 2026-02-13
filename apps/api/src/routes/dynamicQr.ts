/**
 * Dynamic QR Routes (Uzum Bank / Apelsin Pay)
 *
 * Routes for Dynamic QR payment operations.
 */

import { Router } from "express";
import { z } from "zod";
import { DynamicQrController } from "../controllers/dynamicQrController";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validation";
import { Permission } from "../generated/public/client";

const router: Router = Router();
const dynamicQrController = new DynamicQrController();

// All routes require authentication
router.use(createAuthMiddleware());
const requirePOSAccess = requirePermission([Permission.POS_ACCESS]);

// ==================== Validation Schemas ====================

const initiatePaymentSchema = z.object({
    body: z.object({
        amount: z.number().positive(),
        orderId: z.string().min(1),
        groupId: z.string().optional(),
        cashboxCode: z.string().optional(),
        otpData: z.string().optional(),
    }),
});

const checkStatusSchema = z.object({
    params: z.object({
        paymentId: z.string(),
    }),
});

const cancelPaymentSchema = z.object({
    params: z.object({
        orderId: z.string(),
    }),
    body: z.object({
        paymentId: z.string().optional(),
    }),
});

const pollStatusSchema = z.object({
    params: z.object({
        paymentId: z.string(),
    }),
    query: z.object({
        maxAttempts: z.string().optional(),
        intervalMs: z.string().optional(),
    }),
});

const generateQRSchema = z.object({
    body: z.object({
        paymentId: z.string(),
        amount: z.number().positive(),
        orderId: z.string(),
    }),
});

// ==================== Routes ====================

/**
 * POST /api/payments/dynamic-qr/initiate
 * Initiate a new Dynamic QR payment
 */
router.post(
    "/initiate",
    requirePOSAccess,
    validate(initiatePaymentSchema),
    createAuthHandler(dynamicQrController.initiatePayment)
);

/**
 * GET /api/payments/dynamic-qr/status/:paymentId
 * Check payment status
 */
router.get(
    "/status/:paymentId",
    requirePOSAccess,
    validate(checkStatusSchema),
    createAuthHandler(dynamicQrController.checkStatus)
);

/**
 * POST /api/payments/dynamic-qr/cancel/:orderId
 * Cancel/reverse a payment
 */
router.post(
    "/cancel/:orderId",
    requirePOSAccess,
    validate(cancelPaymentSchema),
    createAuthHandler(dynamicQrController.cancelPayment)
);

/**
 * GET /api/payments/dynamic-qr/poll/:paymentId
 * Poll for payment status until completion
 */
router.get(
    "/poll/:paymentId",
    requirePOSAccess,
    validate(pollStatusSchema),
    createAuthHandler(dynamicQrController.pollPaymentStatus)
);

/**
 * POST /api/payments/dynamic-qr/generate-qr
 * Generate QR code for receiving payment
 */
router.post(
    "/generate-qr",
    requirePOSAccess,
    validate(generateQRSchema),
    createAuthHandler(dynamicQrController.generateQR)
);

export default router;
