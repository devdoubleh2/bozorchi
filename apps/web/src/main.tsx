import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./lib/i18n";
import App from "./App.tsx";
import { queryClient } from "./lib/queryClient";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
          <App />
        </Suspense>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);
