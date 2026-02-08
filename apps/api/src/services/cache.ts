/**
 * Cache Service
 *
 * Provides tenant-aware caching utilities using ioredis.
 * All keys are prefixed with org/store IDs for multi-tenant isolation.
 * 
 * Gracefully handles missing Redis - operations become no-ops if Redis unavailable.
 * Only logs slow operations (>10ms) to reduce log volume.
 */

import { redis, CACHE_TTL } from "@/lib/redis";
import logger from "../../logs/log";

// Only log operations slower than this threshold (in ms)
const SLOW_QUERY_THRESHOLD_MS = 10;

export const cache = {
    /**
     * Check if Redis is available
     */
    get isEnabled(): boolean {
        return redis !== null && redis.status === "ready";
    },

    /**
     * Get cached data by key
     */
    async get<T>(key: string): Promise<T | null> {
        if (!redis) return null;

        const start = performance.now();
        try {
            const data = await redis.get(key);
            const ms = performance.now() - start;

            if (ms > SLOW_QUERY_THRESHOLD_MS) {
                logger.warn("[CACHE] Slow GET", "cache", { key, ms: `${ms.toFixed(2)}ms` });
            }

            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            const ms = performance.now() - start;
            logger.error("[CACHE] GET error", "cache", { key, ms: `${ms.toFixed(2)}ms`, error });
            return null;
        }
    },

    /**
     * Set data in cache with TTL
     */
    async set(key: string, data: unknown, ttlSeconds: number): Promise<void> {
        if (!redis) return;

        const start = performance.now();
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(data));
            const ms = performance.now() - start;

            if (ms > SLOW_QUERY_THRESHOLD_MS) {
                logger.warn("[CACHE] Slow SET", "cache", { key, ttl: `${ttlSeconds}s`, ms: `${ms.toFixed(2)}ms` });
            }
        } catch (error) {
            const ms = performance.now() - start;
            logger.error("[CACHE] SET error", "cache", { key, ms: `${ms.toFixed(2)}ms`, error });
        }
    },

    /**
     * Delete a specific key
     */
    async del(key: string): Promise<void> {
        if (!redis) return;

        const start = performance.now();
        try {
            await redis.del(key);
            const ms = performance.now() - start;

            if (ms > SLOW_QUERY_THRESHOLD_MS) {
                logger.warn("[CACHE] Slow DEL", "cache", { key, ms: `${ms.toFixed(2)}ms` });
            }
        } catch (error) {
            const ms = performance.now() - start;
            logger.error("[CACHE] DEL error", "cache", { key, ms: `${ms.toFixed(2)}ms`, error });
        }
    },

    /**
     * Tenant-aware cache key builders
     */
    key: {
        products: (orgId: string, storeId: string) =>
            `org:${orgId}:store:${storeId}:products`,
        productSearch: (orgId: string, storeId: string, query: string) =>
            `org:${orgId}:store:${storeId}:products:search:${query}`,
        categories: (orgId: string) => `org:${orgId}:categories`,
        units: (orgId: string) => `org:${orgId}:units`,
        inventory: (orgId: string, storeId: string) =>
            `org:${orgId}:store:${storeId}:inventory`,
    },
};

export { CACHE_TTL };
