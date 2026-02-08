import { trace, SpanStatusCode } from "@opentelemetry/api";
import type { Request, Response, NextFunction } from "express";

const tracer = trace.getTracer("sp-backend");

// Extended request interface matching the auth middleware pattern
interface AuthenticatedRequest extends Request {
    tenantPrisma?: unknown;
    store?: {
        id: string;
        org_id: string;
        name: string;
    };
    user?: {
        id: string;
        email: string;
    };
}

/**
 * Middleware to enrich spans with tenant and user context
 */
export function tracingMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const span = trace.getActiveSpan();
    const authReq = req as AuthenticatedRequest;

    if (span) {
        // Add tenant context to spans
        if (authReq.store) {
            span.setAttribute("tenant.org_id", authReq.store.org_id);
            span.setAttribute("tenant.store_id", authReq.store.id);
            span.setAttribute("tenant.store_name", authReq.store.name);
        }

        if (authReq.user) {
            span.setAttribute("user.id", authReq.user.id);
            span.setAttribute("user.email", authReq.user.email);
        }

        // Add request context
        span.setAttribute("http.user_agent", req.get("user-agent") || "unknown");
        span.setAttribute("http.client_ip", req.ip || "unknown");
    }

    next();
}

/**
 * Helper to wrap async operations in a span
 */
export async function withSpan<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    return tracer.startActiveSpan(name, async (span) => {
        try {
            if (attributes) {
                Object.entries(attributes).forEach(([key, value]) => {
                    span.setAttribute(key, value);
                });
            }
            const result = await fn();
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (error) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
            span.recordException(error as Error);
            throw error;
        } finally {
            span.end();
        }
    });
}

/**
 * Get trace context for log correlation
 */
export function getTraceContext(): { traceId?: string; spanId?: string } {
    const span = trace.getActiveSpan();
    if (span) {
        const context = span.spanContext();
        return {
            traceId: context.traceId,
            spanId: context.spanId,
        };
    }
    return {};
}
