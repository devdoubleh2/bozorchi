import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("sp-backend");

// Business metrics
export const transactionCounter = meter.createCounter("pos_transactions_total", {
    description: "Total number of POS transactions",
});

export const transactionAmount = meter.createHistogram("pos_transaction_amount", {
    description: "Distribution of transaction amounts",
    unit: "UZS",
});

export const syncLatency = meter.createHistogram("sync_latency_ms", {
    description: "Time taken to sync data between mobile and backend",
    unit: "ms",
});

export const activeUsersCounter = meter.createUpDownCounter("active_users", {
    description: "Currently active users",
});

export const apiLatency = meter.createHistogram("api_latency_ms", {
    description: "API endpoint latency",
    unit: "ms",
});

export const dbQueryLatency = meter.createHistogram("db_query_latency_ms", {
    description: "Database query latency",
    unit: "ms",
});

export const cacheHitCounter = meter.createCounter("cache_hits_total", {
    description: "Total cache hits",
});

export const cacheMissCounter = meter.createCounter("cache_misses_total", {
    description: "Total cache misses",
});

// Record a POS transaction
export function recordTransaction(
    amount: number,
    storeId: string,
    paymentMethod: string
) {
    transactionCounter.add(1, {
        store_id: storeId,
        payment_method: paymentMethod,
    });
    transactionAmount.record(amount, {
        store_id: storeId,
    });
}

// Record API latency
export function recordApiLatency(
    duration: number,
    path: string,
    method: string,
    statusCode: number
) {
    apiLatency.record(duration, {
        path,
        method,
        status_code: statusCode.toString(),
    });
}

// Record cache operations
export function recordCacheHit(key: string) {
    cacheHitCounter.add(1, { key_prefix: key.split(":")[0] });
}

export function recordCacheMiss(key: string) {
    cacheMissCounter.add(1, { key_prefix: key.split(":")[0] });
}
