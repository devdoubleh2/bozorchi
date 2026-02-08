import winston from "winston";
import LokiTransport from "winston-loki";
import { trace } from "@opentelemetry/api";

const lokiHost = process.env["LOKI_HOST"] || "http://localhost:3100";
const enableLoki = process.env["ENABLE_LOKI"] === "true";

// Custom format to include trace context
const traceContextFormat = winston.format((info) => {
    const span = trace.getActiveSpan();
    if (span) {
        const spanContext = span.spanContext();
        info["traceId"] = spanContext.traceId;
        info["spanId"] = spanContext.spanId;
    }
    return info;
});

const transports: winston.transport[] = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: "HH:mm:ss" }),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
                const traceId = meta["traceId"] as string | undefined;
                const traceStr = traceId ? ` [${traceId.slice(0, 8)}]` : "";
                // Remove traceId and spanId from meta for cleaner output
                const { traceId: _t, spanId: _s, ...restMeta } = meta;
                const metaStr = Object.keys(restMeta).length ? ` ${JSON.stringify(restMeta)}` : "";
                return `${timestamp} ${level}${traceStr}: ${message}${metaStr}`;
            })
        ),
    }),
];

// Add Loki transport in production/staging
if (enableLoki) {
    transports.push(
        new LokiTransport({
            host: lokiHost,
            labels: {
                app: "sp-backend",
                env: process.env["NODE_ENV"] || "development",
            },
            json: true,
            batching: true,
            interval: 5,
            replaceTimestamp: true,
        })
    );
}

export const logger = winston.createLogger({
    level: process.env["LOG_LEVEL"] || "info",
    format: winston.format.combine(
        traceContextFormat(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: {
        service: "sp-backend",
        environment: process.env["NODE_ENV"],
    },
    transports,
});

/**
 * Create a child logger with tenant context
 */
export function createTenantLogger(orgId: string, storeId: string) {
    return logger.child({
        orgId,
        storeId,
        tenant: `org_${orgId}`,
    });
}

/**
 * Log structured request info
 */
export function logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    meta?: Record<string, unknown>
) {
    logger.info("HTTP Request", {
        method,
        path,
        statusCode,
        duration,
        ...meta,
    });
}
