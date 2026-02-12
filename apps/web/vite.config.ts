import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // ES2022+ natively supports top-level await
  esbuild: {
    target: "es2022",
  },
  plugins: [
    wasm(),
    // topLevelAwait() removed - ES2022 target supports it natively
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      includeAssets: ["logo.svg"],
      manifest: {
        name: "Bozorchi",
        short_name: "Bozorchi",
        description: "Bozorchi POS System",
        theme_color: "#ffffff",
        icons: [
          {
            src: "logo.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 4000000,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "dist",
    target: "es2022",
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large dependencies to reduce peak memory
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover", "@radix-ui/react-select", "@radix-ui/react-tabs"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
});