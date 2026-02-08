/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

// Declare proper types for the Service Worker scope
declare let self: ServiceWorkerGlobalScope;

// Cleanup old caches
cleanupOutdatedCaches();

// Precache resources derived from the build (HTML/JS/CSS/Images)
precacheAndRoute(self.__WB_MANIFEST);

// ---------------------------------------------------------------------------
// Navigation Fallback - Critical for Offline Page Refresh
// ---------------------------------------------------------------------------
// For any navigation request (page load/refresh), serve the cached index.html.
// This allows the SPA to bootstrap and React Router to handle the route.
// API data caching is handled by React Query's default caching.

const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
    // Exclude API routes
    denylist: [/^\/_/, /\/api\//],
});
registerRoute(navigationRoute);

// ---------------------------------------------------------------------------
// Offline functionality has been removed.
// The app now requires an active network connection to function.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 2. Periodic Sync for Data Freshness
// ---------------------------------------------------------------------------
// Allows the app to update critical data (like products) in the background.
// Note: This requires the 'periodicsync' permission and is browser/OS dependent.

// Listen for the 'periodicsync' event
self.addEventListener('periodicsync', (event: any) => {
    if (event.tag === 'update-products') {
        event.waitUntil(updateProductsCache());
    }
});

async function updateProductsCache() {
    const cacheName = 'product-data-cache';
    const productsUrl = '/api/products'; // Ensure this matches your actual API endpoint

    try {
        // Fetch the latest data from the network
        const response = await fetch(productsUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const cache = await caches.open(cacheName);
        await cache.put(productsUrl, response.clone());
        console.log('[SW] Products cache updated via periodic sync');
    } catch (error) {
        console.error('[SW] Periodic sync failed:', error);
    }
}

// ---------------------------------------------------------------------------
// 3. Skip Waiting (Optional but recommended for rapid updates)
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
