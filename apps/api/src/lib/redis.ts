/**
 * Redis Client Configuration
 *
 * Uses ioredis - the industry-standard Redis client.
 * Gracefully handles missing Redis - returns null client if unavailable.
 */

import Redis from "ioredis";

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    PRODUCTS: 60, // 1 min - frequently changing
    CATEGORIES: 300, // 5 min - rarely changes
    UNITS: 3600, // 1 hour - almost never changes
    INVENTORY: 30, // 30 sec - changes with sales
    STORES: 300, // 5 min
};

// Initialize Redis client
let redis: Redis | null = null;
let redisEnabled = false;

const redisUrl = process.env["REDIS_URL"];

if (redisUrl) {
    try {
        redis = new Redis(redisUrl, {
            // Cache is best-effort, so fail fast when Redis isn't ready.
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                // Keep reconnecting indefinitely so transient outages recover
                // without requiring an API process restart.
                return Math.min(times * 200, 5000);
            },
            lazyConnect: false,
        });

        redis.on("connect", () => {
            console.log("[REDIS] ✅ Connected successfully");
            redisEnabled = true;
        });

        redis.on("error", (err) => {
            console.error("[REDIS] ❌ Connection error:", err.message);
            redisEnabled = false;
        });

        redis.on("close", () => {
            console.log("[REDIS] Connection closed");
            redisEnabled = false;
        });

        redis.on("reconnecting", (ms: number) => {
            console.log(`[REDIS] Reconnecting in ${ms}ms`);
        });

        redis.on("end", () => {
            console.log("[REDIS] Connection ended");
            redisEnabled = false;
        });

        console.log(`[REDIS] Initializing: ${redisUrl.replace(/:\/\/.*@/, "://***@")}`);
    } catch (error) {
        console.warn("[REDIS] ⚠️ Failed to initialize client - caching disabled:", error);
        redis = null;
    }
} else {
    console.log("[REDIS] ⚠️ REDIS_URL not set - caching disabled");
}

export { redis, redisEnabled };
