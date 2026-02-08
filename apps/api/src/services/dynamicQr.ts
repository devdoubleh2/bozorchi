/**
 * Dynamic QR Service (Uzum Bank / Apelsin Pay)
 *
 * Client for integrating with Uzum Bank's Dynamic QR payment system.
 * Handles payment creation, status checks, reversals, and fiscal receipt submission.
 *
 * API Base URL: https://mobile.apelsin.uz/api/apelsin-pay/merchant
 */

import { z } from "zod";
import crypto from "crypto";
import { logger } from "../lib/logger";

// ==================== Configuration ====================

const DynamicQrConfigSchema = z.object({
    baseUrl: z.string().url().default("https://mobile.apelsin.uz/api/apelsin-pay/merchant"),
    merchantId: z.string(),
    secretKey: z.string(),
    serviceId: z.string(),
    merchantServiceUserId: z.string(),
    timeout: z.number().default(30000), // 30 seconds
    retryAttempts: z.number().default(3),
    retryDelay: z.number().default(5000), // 5 seconds base delay
});

export type DynamicQrConfig = z.infer<typeof DynamicQrConfigSchema>;

// ==================== Request/Response Types ====================

export interface CreatePaymentParams {
    amount: number; // Amount in tiyins (1/100 of UZS)
    orderId: string; // Unique order ID in partner's system
    details?: {
        fio?: string;
        [key: string]: any;
    };
}

export interface PaymentResponse {
    success: boolean;
    paymentLink?: string;
    errorCode: number;
    errorMessage?: string;
}

export interface StatusRequest {
    orderId: string;
}

export interface StatusResponse {
    success: boolean;
    paymentId?: string;
    paymentStatus?: "CREATED" | "SUCCESS" | "FAILED" | "HOLD" | "REVERSE_PENDING" | "REVERSED" | "PARTIAL_CANCELLED" | "CANCELLED";
    errorCode: number;
    errorMessage?: string;
    clientPhoneNumber?: string;
    processingReferenceNumber?: string;
    cardType?: number;
}

export interface ReversalRequest {
    paymentId: string;
}

export interface ReversalResponse {
    success: boolean;
    paymentId?: string;
    paymentStatus?: "REVERSE_PENDING" | "REVERSED";
    errorCode: number;
    errorMessage?: string;
}

export interface FiscalRequest {
    paymentId: string;
    fiscalUrl: string; // Link to fiscal receipt
}

export interface FiscalResponse {
    success: boolean;
    paymentId?: string;
    paymentStatus?: "SUCCESS" | "FAILED" | "HOLD" | "REVERSE_PENDING" | "REVERSED" | "PARTIAL_CANCELLED";
    errorCode: number;
    errorMessage?: string;
}

// ==================== Error Classes ====================

export class DynamicQrError extends Error {
    constructor(
        message: string,
        public code: number,
        public isRetryable: boolean = false
    ) {
        super(message);
        this.name = "DynamicQrError";
    }
}

export class DynamicQrAuthError extends DynamicQrError {
    constructor(message: string = "Authentication failed") {
        super(message, 401, false);
        this.name = "DynamicQrAuthError";
    }
}

export class DynamicQrTimeoutError extends DynamicQrError {
    constructor(message: string = "Request timeout") {
        super(message, 403, true);
        this.name = "DynamicQrTimeoutError";
    }
}

// ==================== Helper Functions ====================

/**
 * Generate authentication header for Dynamic QR API
 * Format: user_id:hash:timestamp
 * Where hash = SHA1(timestamp + secret_key)
 */
export function generateAuthHeader(
    merchantServiceUserId: string,
    secretKey: string
): string {
    // Get current timestamp in milliseconds for UTC+5 (Tashkent time)
    const now = new Date();
    // Convert to UTC+5
    const utc5Time = new Date(now.getTime() + (5 * 60 * 60 * 1000));
    const timestamp = utc5Time.getTime().toString();

    // Generate SHA1 hash of timestamp + secret_key
    const hashInput = timestamp + secretKey;
    const hash = crypto.createHash("sha1").update(hashInput).digest("hex");

    return `${merchantServiceUserId}:${hash}:${timestamp}`;
}

/**
 * Convert amount from soms to tiyins (multiply by 100)
 */
export function toTiyins(amountInSoms: number): number {
    return Math.round(amountInSoms * 100);
}

/**
 * Convert amount from tiyins to soms (divide by 100)
 */
export function fromTiyins(amountInTiyins: number): number {
    return amountInTiyins / 100;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
    return crypto.randomUUID();
}

// ==================== Main Service Class ====================

export class DynamicQrService {
    private config: DynamicQrConfig;

    constructor(config: DynamicQrConfig) {
        this.config = DynamicQrConfigSchema.parse(config);
    }

    /**
     * Make an authenticated request to Dynamic QR API
     */
    private async makeRequest<T>(
        endpoint: string,
        method: "GET" | "POST" | "PUT" = "POST",
        body?: Record<string, unknown>
    ): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;
        const authHeader = generateAuthHeader(
            this.config.merchantServiceUserId,
            this.config.secretKey
        );

        const headers: Record<string, string> = {
            "Authorization": authHeader,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        const options: RequestInit = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        };

        logger.info(`[DynamicQR] ${method} ${endpoint}`, {
            orderId: body?.['order_id'],
            paymentId: body?.['payment_id']
        });

        try {
            const response = await fetch(url, options);
            const data = await response.json() as T;
            return data;
        } catch (error) {
            logger.error(`[DynamicQR] Request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * Create a new payment (order)
     * POST /payment/create
     */
    async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
        const body = {
            amount: params.amount,
            order_id: params.orderId,
            service_id: parseInt(this.config.serviceId, 10),
            details: params.details
        };

        const response = await this.makeRequest<{
            payment_link?: string;
            error_code: number;
            error_message?: string;
        }>("/payment/create", "POST", body);

        const result: PaymentResponse = {
            success: response.error_code === 0,
            paymentLink: response.payment_link,
            errorCode: response.error_code,
            errorMessage: response.error_message,
        };

        if (!result.success) {
            logger.error("[DynamicQR] Payment creation failed", {
                errorCode: result.errorCode,
                errorMessage: result.errorMessage,
                orderId: params.orderId,
            });

            // Handle specific error codes
            if (result.errorCode === 401) {
                throw new DynamicQrAuthError(result.errorMessage);
            }
            if (result.errorCode === 503) {
                // Service unavailable
                throw new DynamicQrError(result.errorMessage || "Service unavailable", 503);
            }
        }

        return result;
    }

    /**
     * Check payment status by order ID
     * POST /payment/status-by-order
     */
    async getStatus(params: StatusRequest): Promise<StatusResponse> {
        const body = {
            order_id: params.orderId,
            service_id: parseInt(this.config.serviceId, 10),
        };

        const response = await this.makeRequest<{
            payment_id?: string;
            payment_status?: "CREATED" | "SUCCESS" | "FAILED" | "HOLD" | "REVERSE_PENDING" | "REVERSED" | "PARTIAL_CANCELLED" | "CANCELLED";
            error_code: number;
            error_message?: string;
            client_phone_number?: string;
            processingReferenceNumber?: string;
            cardType?: number;
        }>("/payment/status-by-order", "POST", body);

        const result: StatusResponse = {
            success: response.error_code === 0,
            paymentId: response.payment_id,
            paymentStatus: response.payment_status,
            errorCode: response.error_code,
            errorMessage: response.error_message,
            clientPhoneNumber: response.client_phone_number,
            processingReferenceNumber: response.processingReferenceNumber,
            cardType: response.cardType
        };

        if (!result.success) {
            logger.error("[DynamicQR] Status check failed", {
                errorCode: result.errorCode,
                errorMessage: result.errorMessage,
                orderId: params.orderId,
            });
        }

        return result;
    }

    /**
     * Reverse (cancel) a payment
     * POST /payment/reversal
     */
    async reversePayment(params: ReversalRequest): Promise<ReversalResponse> {
        const body = {
            service_id: parseInt(this.config.serviceId, 10),
            payment_id: params.paymentId,
        };

        // Note: YAML uses POST for reversal
        const response = await this.makeRequest<{
            payment_id?: string;
            payment_status?: "REVERSE_PENDING" | "REVERSED";
            error_code: number;
            error_message?: string;
        }>("/payment/reversal", "POST", body);

        const result: ReversalResponse = {
            success: response.error_code === 0,
            paymentId: response.payment_id,
            paymentStatus: response.payment_status,
            errorCode: response.error_code,
            errorMessage: response.error_message,
        };

        if (!result.success) {
            logger.error("[DynamicQR] Reversal failed", {
                errorCode: result.errorCode,
                errorMessage: result.errorMessage,
                paymentId: params.paymentId,
            });
        }

        return result;
    }

    /**
     * Submit fiscal receipt URL
     * POST /payment/fiscal
     */
    async submitFiscal(params: FiscalRequest): Promise<FiscalResponse> {
        const body = {
            payment_id: params.paymentId,
            service_id: parseInt(this.config.serviceId, 10),
            fiscal_url: params.fiscalUrl,
        };

        const response = await this.makeRequest<{
            payment_id?: string;
            payment_status?: "SUCCESS" | "FAILED" | "HOLD" | "REVERSE_PENDING" | "REVERSED" | "PARTIAL_CANCELLED";
            error_code: number;
            error_message?: string;
        }>("/payment/fiscal", "POST", body);

        const result: FiscalResponse = {
            success: response.error_code === 0,
            paymentId: response.payment_id,
            paymentStatus: response.payment_status,
            errorCode: response.error_code,
            errorMessage: response.error_message,
        };

        if (!result.success) {
            logger.error("[DynamicQR] Fiscal submission failed", {
                errorCode: result.errorCode,
                errorMessage: result.errorMessage,
                paymentId: params.paymentId,
            });
        }

        return result;
    }

    /**
     * Poll for payment status until success, failure, or timeout
     */
    async pollForStatus(
        orderId: string,
        maxAttempts: number = 30,
        intervalMs: number = 2000
    ): Promise<StatusResponse> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const status = await this.getStatus({
                orderId,
            });

            if (status.success) {
                if (status.paymentStatus === "SUCCESS") {
                    return status;
                }
                if (status.paymentStatus === "FAILED" || status.paymentStatus === "REVERSED" || status.paymentStatus === "CANCELLED") {
                    return status;
                }
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        throw new DynamicQrError(
            "Payment status polling timed out",
            408,
            true
        );
    }
}

// ==================== Factory Function ====================

/**
 * Create Dynamic QR service from organization configuration
 */
export function createDynamicQrService(config: {
    merchantId: string;
    secretKey: string;
    serviceId: string;
    merchantServiceUserId: string;
    baseUrl?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}): DynamicQrService {
    return new DynamicQrService({
        merchantId: config.merchantId,
        secretKey: config.secretKey,
        serviceId: config.serviceId,
        merchantServiceUserId: config.merchantServiceUserId,
        baseUrl: config.baseUrl || "https://mobile.apelsin.uz/api/apelsin-pay/merchant",
        timeout: config.timeout || 30000,
        retryAttempts: config.retryAttempts || 3,
        retryDelay: config.retryDelay || 5000,
    });
}
