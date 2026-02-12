import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  // ES2022+ natively supports top-level await
  esbuild: {
    target: "es2022",
  },
  plugins: [
    wasm(),
    react({
      babel: process.env.NODE_ENV === "production" ? undefined : {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  preview: {
    allowedHosts: ["pos.bozorchi.store"],
  },
  build: {
    outDir: "dist",
    target: "es2022",
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      maxParallelFileOps: 1,
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
        },
      },
    },
  },
});
