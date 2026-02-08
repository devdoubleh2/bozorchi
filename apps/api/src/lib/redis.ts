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
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3) return null; // Stop retrying after 3 attempts
                return Math.min(times * 100, 2000);
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

        console.log(`[REDIS] Initializing: ${redisUrl.replace(/:\/\/.*@/, "://***@")}`);
    } catch (error) {
        console.warn("[REDIS] ⚠️ Failed to initialize client - caching disabled:", error);
        redis = null;
    }
} else {
    console.log("[REDIS] ⚠️ REDIS_URL not set - caching disabled");
}

export { redis, redisEnabled };
