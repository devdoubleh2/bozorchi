/**
 * Dynamic QR Controller (Uzum Bank / Apelsin Pay)
 *
 * HTTP controller for handling Dynamic QR payment operations.
 * Provides endpoints for initiating payments, checking status, and cancellations.
 */

import { Response } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import { AuthRequest } from "../middleware/auth";
import {
    DynamicQrService,
    createDynamicQrService,
    toTiyins,
    generateUUID,
    PaymentResponse,
    StatusResponse,
    ReversalResponse,
} from "../services/dynamicQr";
import { prisma as publicPrisma } from "../lib/prisma";
import { PaymentMethod, Prisma } from "../generated/tenant/client";
import { logger } from "../lib/logger";

// ==================== Validation Schemas ====================

const initiatePaymentSchema = z.object({
    body: z.object({
        amount: z.number().positive(), // Amount in soms
        orderId: z.string().min(1),
        groupId: z.string().optional(), // Transaction group ID for POS checkout
        cashboxCode: z.string().optional(), // Not used in new spec but kept for compat
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

// ==================== Helper Functions ====================

/**
 * Get Dynamic QR service for an organization
 */
async function getDynamicQrService(organizationId: string): Promise<DynamicQrService | null> {
    const organization = await publicPrisma.organization.findUnique({
        where: { id: organizationId },
        select: {
            uzum_fastpay_enabled: true,
            uzum_fastpay_merchant_id: true,
            uzum_fastpay_secret_key: true,
            uzum_fastpay_service_id: true,
            uzum_fastpay_merchant_service_user_id: true,
        },
    });

    if (!organization || !organization.uzum_fastpay_enabled) {
        return null;
    }

    if (
        !organization.uzum_fastpay_merchant_id ||
        !organization.uzum_fastpay_secret_key ||
        !organization.uzum_fastpay_service_id ||
        !organization.uzum_fastpay_merchant_service_user_id
    ) {
        logger.error(`[DynamicQrController] Incomplete Dynamic QR configuration for org ${organizationId}`);
        return null;
    }

    return createDynamicQrService({
        merchantId: organization.uzum_fastpay_merchant_id,
        secretKey: organization.uzum_fastpay_secret_key,
        serviceId: organization.uzum_fastpay_service_id,
        merchantServiceUserId: organization.uzum_fastpay_merchant_service_user_id,
    });
}

/**
 * Create a payment record in the database
 */
async function createPaymentRecord(
    tenantPrisma: AuthRequest["tenantPrisma"],
    data: {
        amount: number;
        orderId: string;
        paymentMethod: PaymentMethod;
        uzumPaymentId?: string | null;
        uzumOrderId?: string;
        uzumStatus?: string;
        transactionId?: string;
        groupId?: string;
        webhookData?: any;
    }
) {
    if (!tenantPrisma) {
        throw new Error("Tenant prisma client not available");
    }

    return await tenantPrisma.payment.create({
        data: {
            amount: new Prisma.Decimal(data.amount),
            payment_method: data.paymentMethod,
            order_id: data.orderId,
            uzum_payment_id: data.uzumPaymentId,
            uzum_order_id: data.uzumOrderId,
            uzum_status: data.uzumStatus,
            received_at: new Date(),
            webhook_data: data.webhookData,
        },
    });
}

/**
 * Update payment record with Dynamic QR status
 */
async function updatePaymentStatus(
    tenantPrisma: AuthRequest["tenantPrisma"],
    paymentId: string,
    status: string,
    additionalData?: Partial<{
        uzum_payment_id: string;
        error_message: string;
    }>
) {
    if (!tenantPrisma) {
        throw new Error("Tenant prisma client not available");
    }

    return await tenantPrisma.payment.update({
        where: { id: paymentId },
        data: {
            uzum_status: status,
            ...additionalData,
        },
    });
}

// ==================== Controller Functions ====================

export class DynamicQrController {
    /**
     * Initiate a new Dynamic QR payment
     * POST /api/payments/dynamic-qr/initiate
     */
    async initiatePayment(req: AuthRequest, res: Response) {
        const validation = initiatePaymentSchema.safeParse({
            body: req.body,
        });

        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request data",
                details: validation.error.issues,
            });
        }

        const { amount, orderId, groupId } = validation.data.body;

        if (!req.organization?.id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        if (!req.tenantPrisma) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        try {
            // Get Dynamic QR service for this organization
            const dynamicQrService = await getDynamicQrService(req.organization.id);

            if (!dynamicQrService) {
                return res.status(503).json({
                    error: "Dynamic QR is not configured for this organization",
                });
            }

            // Generate transaction ID (UUID)
            const transactionId = generateUUID();

            // Convert amount to tiyins
            const amountInTiyins = toTiyins(amount);

            // Create payment with Dynamic QR
            const paymentResult: PaymentResponse = await dynamicQrService.createPayment({
                amount: amountInTiyins,
                orderId,
                details: {
                    // We can add optional customer details here if needed
                }
            });

            if (!paymentResult.success) {
                logger.error("[DynamicQrController] Payment creation failed", {
                    errorCode: paymentResult.errorCode,
                    errorMessage: paymentResult.errorMessage,
                    orderId,
                });

                return res.status(400).json({
                    error: "Payment creation failed",
                    errorCode: paymentResult.errorCode,
                    errorMessage: paymentResult.errorMessage,
                });
            }

            // Create payment record in database
            // Note: We use orderId as the primary handle for now since we don't have uzum_payment_id yet
            // We do NOT save transactionId here because the transaction doesn't exist yet (FK violation).
            const paymentRecord = await createPaymentRecord(req.tenantPrisma, {
                amount,
                orderId,
                paymentMethod: PaymentMethod.dynamic_qr,
                uzumPaymentId: null, // We don't have it yet, will be populated on status check
                uzumOrderId: orderId,
                uzumStatus: "CREATED",
                // transactionId, // Do not separate transactionId to avoid FK constraint error
                groupId,
                webhookData: {
                    paymentLink: paymentResult.paymentLink
                }
            });

            logger.info("[DynamicQrController] Payment initiated successfully", {
                orderId,
                paymentLink: paymentResult.paymentLink
            });

            return res.json({
                success: true,
                payment: {
                    id: paymentRecord.id,
                    paymentId: orderId, // Return orderId as the handle for frontend polling
                    status: "CREATED",
                    amount,
                    orderId,
                    transactionId,
                },
            });
        } catch (error) {
            logger.error("[DynamicQrController] Error initiating payment", error);
            return res.status(500).json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    /**
     * Check payment status
     * GET /api/payments/dynamic-qr/status/:paymentId
     * Note: paymentId param acts as the orderId handle we sent to frontend
     */
    async checkStatus(req: AuthRequest, res: Response) {
        const validation = checkStatusSchema.safeParse({
            params: req.params,
        });

        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid payment ID",
                details: validation.error.issues,
            });
        }

        const { paymentId } = validation.data.params; // This is likely the orderId

        if (!req.organization?.id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        try {
            // Get Dynamic QR service for this organization
            const dynamicQrService = await getDynamicQrService(req.organization.id);

            if (!dynamicQrService) {
                return res.status(503).json({
                    error: "Dynamic QR is not configured for this organization",
                });
            }

            // Check status with Dynamic QR using orderId (passed as paymentId)
            const statusResult: StatusResponse = await dynamicQrService.getStatus({
                orderId: paymentId,
            });

            // Update payment record if we have a matching payment
            if (req.tenantPrisma && statusResult.success) {
                // Find by uzum_order_id or uzum_payment_id
                const payment = await req.tenantPrisma.payment.findFirst({
                    where: {
                        OR: [
                            { uzum_order_id: paymentId },
                            { uzum_payment_id: paymentId }
                        ]
                    },
                });

                if (payment) {
                    await updatePaymentStatus(
                        req.tenantPrisma,
                        payment.id,
                        statusResult.paymentStatus || "UNKNOWN",
                        {
                            uzum_payment_id: statusResult.paymentId
                        }
                    );
                }
            }

            return res.json({
                success: statusResult.success,
                paymentId: statusResult.paymentId || paymentId,
                status: statusResult.paymentStatus,
                errorCode: statusResult.errorCode,
                errorMessage: statusResult.errorMessage,
            });
        } catch (error) {
            logger.error("[DynamicQrController] Error checking payment status", error);
            return res.status(500).json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    /**
     * Cancel/reverse a payment
     * POST /api/payments/dynamic-qr/cancel/:orderId
     */
    async cancelPayment(req: AuthRequest, res: Response) {
        const validation = cancelPaymentSchema.safeParse({
            params: req.params,
            body: req.body,
        });

        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request data",
                details: validation.error.issues,
            });
        }

        const { orderId } = validation.data.params;
        let { paymentId } = validation.data.body;

        if (!req.organization?.id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        if (!req.tenantPrisma) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        try {
            // Get Dynamic QR service for this organization
            const dynamicQrService = await getDynamicQrService(req.organization.id);

            if (!dynamicQrService) {
                return res.status(503).json({
                    error: "Dynamic QR is not configured for this organization",
                });
            }

            // If we don't have paymentId in body, helper try to find it in DB
            if (!paymentId) {
                const payment = await req.tenantPrisma.payment.findFirst({
                    where: { uzum_order_id: orderId }
                });
                if (payment?.uzum_payment_id) {
                    paymentId = payment.uzum_payment_id;
                } else {
                    // Try to fetch status to get paymentId
                    const status = await dynamicQrService.getStatus({ orderId });
                    if (status.success && status.paymentId) {
                        paymentId = status.paymentId;
                    } else {
                        return res.status(400).json({
                            error: "Cannot reverse payment: payment_id not found",
                        });
                    }
                }
            }

            // Reverse payment with Dynamic QR
            const reversalResult: ReversalResponse = await dynamicQrService.reversePayment({
                paymentId,
            });

            if (!reversalResult.success) {
                logger.error("[DynamicQrController] Payment reversal failed", {
                    errorCode: reversalResult.errorCode,
                    errorMessage: reversalResult.errorMessage,
                    orderId,
                    paymentId,
                });

                return res.status(400).json({
                    error: "Payment reversal failed",
                    errorCode: reversalResult.errorCode,
                    errorMessage: reversalResult.errorMessage,
                });
            }

            // Update payment record
            if (req.tenantPrisma) {
                const payment = await req.tenantPrisma.payment.findFirst({
                    where: { uzum_payment_id: paymentId },
                });

                if (payment) {
                    await updatePaymentStatus(
                        req.tenantPrisma,
                        payment.id,
                        "REVERSED"
                    );
                }
            }

            logger.info("[DynamicQrController] Payment reversed successfully", {
                orderId,
                paymentId,
            });

            return res.json({
                success: true,
                paymentId: reversalResult.paymentId,
                status: reversalResult.paymentStatus,
            });
        } catch (error) {
            logger.error("[DynamicQrController] Error cancelling payment", error);
            return res.status(500).json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    /**
     * Poll for payment status until completion
     * GET /api/payments/dynamic-qr/poll/:paymentId
     */
    async pollPaymentStatus(req: AuthRequest, res: Response) {
        const validation = checkStatusSchema.safeParse({
            params: req.params,
        });

        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid payment ID",
                details: validation.error.issues,
            });
        }

        const { paymentId } = validation.data.params; // This is the orderID
        const maxAttempts = Math.min(parseInt(req.query['maxAttempts'] as string) || 30, 60);
        const intervalMs = Math.min(parseInt(req.query['intervalMs'] as string) || 2000, 5000);

        if (!req.organization?.id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        try {
            const dynamicQrService = await getDynamicQrService(req.organization.id);

            if (!dynamicQrService) {
                return res.status(503).json({
                    error: "Dynamic QR is not configured for this organization",
                });
            }

            // Poll for status using orderId (paymentId)
            const statusResult = await dynamicQrService.pollForStatus(paymentId, maxAttempts, intervalMs);

            // Update payment record
            if (req.tenantPrisma && statusResult.success) {
                const payment = await req.tenantPrisma.payment.findFirst({
                    where: {
                        OR: [
                            { uzum_order_id: paymentId },
                            { uzum_payment_id: paymentId }
                        ]
                    },
                });

                if (payment) {
                    await updatePaymentStatus(
                        req.tenantPrisma,
                        payment.id,
                        statusResult.paymentStatus || "UNKNOWN",
                        {
                            uzum_payment_id: statusResult.paymentId
                        }
                    );
                }
            }

            return res.json({
                success: statusResult.success,
                paymentId: statusResult.paymentId,
                status: statusResult.paymentStatus,
                errorCode: statusResult.errorCode,
                errorMessage: statusResult.errorMessage,
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes("timed out")) {
                return res.status(408).json({
                    error: "Payment status polling timed out",
                    paymentId,
                });
            }

            logger.error("[DynamicQrController] Error polling payment status", error);
            return res.status(500).json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    /**
     * Generate QR code for receiving payment
     * POST /api/payments/dynamic-qr/generate-qr
     */
    async generateQR(req: AuthRequest, res: Response) {
        const validation = z.object({
            body: z.object({
                paymentId: z.string(), // This is the order ID passed from frontend
                amount: z.number().positive(),
                orderId: z.string(),
            }),
        }).safeParse({
            body: req.body,
        });

        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request data",
                details: validation.error.issues,
            });
        }

        const { paymentId, amount, orderId } = validation.data.body;

        if (!req.tenantPrisma) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        try {
            // Find the payment record to get the link
            const payment = await req.tenantPrisma.payment.findFirst({
                where: {
                    uzum_order_id: orderId
                }
            });

            let paymentLink: string | null = null;
            if (payment && payment.webhook_data && typeof payment.webhook_data === 'object') {
                paymentLink = (payment.webhook_data as any).paymentLink;
            }

            if (!paymentLink) {
                // Fallback: If we couldn't find the link, we can't generate the QR.
                // This shouldn't happen if initiatePayment succeeded.
                // Unless the payment was created before this change.
                return res.status(404).json({ error: "Payment link not found for this order" });
            }

            // Generate QR code as base64 data URL from the link
            const qrCodeDataUrl = await QRCode.toDataURL(paymentLink, {
                width: 300,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#FFFFFF",
                },
            });

            return res.json({
                success: true,
                qrCode: qrCodeDataUrl,
                paymentId,
                orderId,
                amount,
            });
        } catch (error) {
            logger.error("[DynamicQrController] Error generating QR code", error);
            return res.status(500).json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
