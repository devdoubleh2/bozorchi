import { trace } from "@opentelemetry/api";
import {
    WebTracerProvider,
    BatchSpanProcessor
} from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import * as Device from "expo-device";
import Constants from "expo-constants";

const OTEL_ENDPOINT =
    Constants.expoConfig?.extra?.otelEndpoint || "http://localhost:4318";

let initialized = false;

/**
 * Initialize mobile telemetry
 */
export async function initMobileTelemetry() {
    if (initialized) return;

    try {
        const exporter = new OTLPTraceExporter({
            url: `${OTEL_ENDPOINT}/v1/traces`,
        });

        // v2.x API: spanProcessors in constructor
        const provider = new WebTracerProvider({
            spanProcessors: [new BatchSpanProcessor(exporter)],
        });

        provider.register();

        // Log device info on init
        const tracer = trace.getTracer("sp-mobile");
        const initSpan = tracer.startSpan("app.init");
        initSpan.setAttribute("service.name", "sp-mobile");
        initSpan.setAttribute("service.version", Constants.expoConfig?.version || "1.0.0");
        initSpan.setAttribute("device.id", Device.deviceName || "unknown");
        initSpan.setAttribute("device.manufacturer", Device.manufacturer || "unknown");
        initSpan.setAttribute("device.model", Device.modelName || "unknown");
        initSpan.setAttribute("device.os", Device.osName || "unknown");
        initSpan.setAttribute("device.os.version", Device.osVersion || "unknown");
        initSpan.end();

        initialized = true;
        console.log("📱 Mobile telemetry initialized");
    } catch (error) {
        console.error("Failed to initialize mobile telemetry:", error);
    }
}

/**
 * Track screen navigation
 */
export function trackScreen(screenName: string, params?: Record<string, string>) {
    const tracer = trace.getTracer("sp-mobile");
    const span = tracer.startSpan(`screen.${screenName}`);
    span.setAttribute("screen.name", screenName);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            span.setAttribute(`screen.params.${key}`, value);
        });
    }

    span.end();
}

/**
 * Track user interaction
 */
export function trackInteraction(
    action: string,
    target: string,
    metadata?: Record<string, string | number | boolean>
) {
    const tracer = trace.getTracer("sp-mobile");
    const span = tracer.startSpan(`interaction.${action}`);
    span.setAttribute("interaction.action", action);
    span.setAttribute("interaction.target", target);

    if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
            span.setAttribute(`interaction.${key}`, value);
        });
    }

    span.end();
}

/**
 * Track API call with timing
 */
export function trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    success: boolean,
    retryCount?: number
) {
    const tracer = trace.getTracer("sp-mobile");
    const span = tracer.startSpan(`api.${method.toLowerCase()}`);
    span.setAttribute("http.url", endpoint);
    span.setAttribute("http.method", method);
    span.setAttribute("http.duration_ms", duration);
    span.setAttribute("http.success", success);

    if (retryCount !== undefined) {
        span.setAttribute("http.retry_count", retryCount);
    }

    span.end();
}

/**
 * Track offline sync events
 */
export function trackSyncEvent(
    type: "start" | "complete" | "error",
    itemCount: number,
    duration?: number
) {
    const tracer = trace.getTracer("sp-mobile");
    const span = tracer.startSpan(`sync.${type}`);
    span.setAttribute("sync.type", type);
    span.setAttribute("sync.item_count", itemCount);

    if (duration !== undefined) {
        span.setAttribute("sync.duration_ms", duration);
    }

    span.end();
}
