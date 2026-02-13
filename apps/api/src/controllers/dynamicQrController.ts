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
        organizationId: string;
        storeId: string;
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
            webhook_data: {
                ...(typeof data.webhookData === "object" && data.webhookData
                    ? data.webhookData
                    : {}),
                organization_id: data.organizationId,
                store_id: data.storeId,
                group_id: data.groupId ?? null,
            },
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

type ScopedPaymentRecord = Prisma.PaymentGetPayload<{
    include: {
        transaction: {
            select: {
                store_id: true;
            };
        };
    };
}>;

const extractStoreIdFromWebhookData = (
    webhookData: Prisma.JsonValue | null
): string | null => {
    if (!webhookData || typeof webhookData !== "object" || Array.isArray(webhookData)) {
        return null;
    }

    const storeId = (webhookData as Record<string, unknown>)["store_id"];
    return typeof storeId === "string" ? storeId : null;
};

const paymentBelongsToStore = (
    payment: Pick<ScopedPaymentRecord, "transaction" | "webhook_data">,
    storeId: string
): boolean => {
    if (payment.transaction?.store_id) {
        return payment.transaction.store_id === storeId;
    }

    const storeIdFromMetadata = extractStoreIdFromWebhookData(payment.webhook_data);
    return storeIdFromMetadata === storeId;
};

async function findScopedPaymentRecord(
    tenantPrisma: AuthRequest["tenantPrisma"],
    identifier: string,
    storeId: string
): Promise<ScopedPaymentRecord | null> {
    if (!tenantPrisma) {
        return null;
    }

    const paymentById = await tenantPrisma.payment.findUnique({
        where: { id: identifier },
        include: {
            transaction: {
                select: {
                    store_id: true,
                },
            },
        },
    });

    if (paymentById) {
        return paymentBelongsToStore(paymentById, storeId) ? paymentById : null;
    }

    const candidates = await tenantPrisma.payment.findMany({
        where: {
            OR: [
                { uzum_order_id: identifier },
                { uzum_payment_id: identifier },
                { order_id: identifier },
            ],
        },
        include: {
            transaction: {
                select: {
                    store_id: true,
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
        take: 20,
    });

    return (
        candidates.find((candidate) => paymentBelongsToStore(candidate, storeId)) ||
        null
    );
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

        if (!req.store?.id) {
            return res.status(400).json({ error: "Store ID is required" });
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
                organizationId: req.organization.id,
                storeId: req.store.id,
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
                    paymentId: paymentRecord.id, // Return unique local payment ID for scoped polling
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
     * paymentId is the local payment record ID returned by initiatePayment.
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

        const { paymentId } = validation.data.params;

        if (!req.organization?.id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        if (!req.store?.id) {
            return res.status(400).json({ error: "Store ID is required" });
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

            const payment = await findScopedPaymentRecord(
                req.tenantPrisma,
                paymentId,
                req.store.id
            );

            if (!payment) {
                return res.status(404).json({
                    error: "Payment not found for this store",
                });
            }

            const orderIdForStatus = payment.uzum_order_id || payment.order_id;
            if (!orderIdForStatus) {
                return res.status(400).json({
                    error: "Payment is missing provider order reference",
                });
            }

            // Check status with Dynamic QR using provider orderId
            const statusResult: StatusResponse = await dynamicQrService.getStatus({
                orderId: orderIdForStatus,
            });

            await updatePaymentStatus(
                req.tenantPrisma,
                payment.id,
                statusResult.paymentStatus || "UNKNOWN",
                {
                    uzum_payment_id: statusResult.paymentId
                }
            );

            return res.json({
                success: statusResult.success,
                paymentId: payment.id,
                providerPaymentId: statusResult.paymentId,
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
        const { paymentId } = validation.data.body;

        if (!req.organization?.id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        if (!req.store?.id) {
            return res.status(400).json({ error: "Store ID is required" });
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

            const paymentHandle = paymentId || orderId;
            const paymentRecord = await findScopedPaymentRecord(
                req.tenantPrisma,
                paymentHandle,
                req.store.id
            );

            if (!paymentRecord) {
                return res.status(404).json({
                    error: "Payment not found for this store",
                });
            }

            let providerPaymentId = paymentRecord.uzum_payment_id || undefined;

            if (!providerPaymentId) {
                const orderIdForStatus = paymentRecord.uzum_order_id || paymentRecord.order_id;
                if (!orderIdForStatus) {
                    return res.status(400).json({
                        error: "Cannot reverse payment: payment order reference missing",
                    });
                }

                const status = await dynamicQrService.getStatus({ orderId: orderIdForStatus });
                if (status.success && status.paymentId) {
                    providerPaymentId = status.paymentId;
                    await updatePaymentStatus(
                        req.tenantPrisma,
                        paymentRecord.id,
                        status.paymentStatus || paymentRecord.uzum_status || "UNKNOWN",
                        {
                            uzum_payment_id: providerPaymentId,
                        }
                    );
                } else {
                    return res.status(400).json({
                        error: "Cannot reverse payment: payment_id not found",
                    });
                }
            }

            // Reverse payment with Dynamic QR
            const reversalResult: ReversalResponse = await dynamicQrService.reversePayment({
                paymentId: providerPaymentId,
            });

            if (!reversalResult.success) {
                logger.error("[DynamicQrController] Payment reversal failed", {
                    errorCode: reversalResult.errorCode,
                    errorMessage: reversalResult.errorMessage,
                    orderId,
                    paymentId: providerPaymentId,
                });

                return res.status(400).json({
                    error: "Payment reversal failed",
                    errorCode: reversalResult.errorCode,
                    errorMessage: reversalResult.errorMessage,
                });
            }

            await updatePaymentStatus(
                req.tenantPrisma,
                paymentRecord.id,
                "REVERSED",
                {
                    uzum_payment_id: reversalResult.paymentId || providerPaymentId,
                }
            );

            logger.info("[DynamicQrController] Payment reversed successfully", {
                orderId,
                paymentId: providerPaymentId,
            });

            return res.json({
                success: true,
                paymentId: paymentRecord.id,
                providerPaymentId: reversalResult.paymentId,
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

        const { paymentId } = validation.data.params;
        const maxAttempts = Math.min(parseInt(req.query['maxAttempts'] as string) || 30, 60);
        const intervalMs = Math.min(parseInt(req.query['intervalMs'] as string) || 2000, 5000);

        if (!req.organization?.id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        if (!req.store?.id) {
            return res.status(400).json({ error: "Store ID is required" });
        }

        if (!req.tenantPrisma) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        try {
            const dynamicQrService = await getDynamicQrService(req.organization.id);

            if (!dynamicQrService) {
                return res.status(503).json({
                    error: "Dynamic QR is not configured for this organization",
                });
            }

            const payment = await findScopedPaymentRecord(
                req.tenantPrisma,
                paymentId,
                req.store.id
            );

            if (!payment) {
                return res.status(404).json({
                    error: "Payment not found for this store",
                });
            }

            const orderIdForStatus = payment.uzum_order_id || payment.order_id;
            if (!orderIdForStatus) {
                return res.status(400).json({
                    error: "Payment is missing provider order reference",
                });
            }

            // Poll for status using provider orderId
            const statusResult = await dynamicQrService.pollForStatus(
                orderIdForStatus,
                maxAttempts,
                intervalMs
            );

            await updatePaymentStatus(
                req.tenantPrisma,
                payment.id,
                statusResult.paymentStatus || "UNKNOWN",
                {
                    uzum_payment_id: statusResult.paymentId
                }
            );

            return res.json({
                success: statusResult.success,
                paymentId: payment.id,
                providerPaymentId: statusResult.paymentId,
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
                paymentId: z.string(),
                amount: z.number().positive(),
                orderId: z.string().optional(),
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

        if (!req.store?.id) {
            return res.status(400).json({ error: "Store ID is required" });
        }

        if (!req.tenantPrisma) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        try {
            const payment = await findScopedPaymentRecord(
                req.tenantPrisma,
                paymentId,
                req.store.id
            );

            const fallbackPayment =
                !payment && orderId
                    ? await findScopedPaymentRecord(req.tenantPrisma, orderId, req.store.id)
                    : null;

            const scopedPayment = payment || fallbackPayment;

            let paymentLink: string | null = null;
            if (
                scopedPayment?.webhook_data &&
                typeof scopedPayment.webhook_data === "object" &&
                !Array.isArray(scopedPayment.webhook_data)
            ) {
                const paymentLinkValue = (scopedPayment.webhook_data as Record<string, unknown>)[
                    "paymentLink"
                ];
                paymentLink =
                    typeof paymentLinkValue === "string" ? paymentLinkValue : null;
            }

            if (!paymentLink) {
                return res.status(404).json({ error: "Payment link not found for this payment" });
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
                paymentId: scopedPayment?.id || paymentId,
                orderId: scopedPayment?.uzum_order_id || orderId || null,
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
