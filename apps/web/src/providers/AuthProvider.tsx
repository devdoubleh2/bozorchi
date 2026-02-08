import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/context/AuthStore";
import { useTranslation } from "react-i18next";

interface AuthProviderProps {
  children: ReactNode;
  /**
   * Custom loading component to show while auth is initializing.
   * Defaults to a centered spinner.
   */
  LoadingComponent?: React.ComponentType;
}

/**
 * Default loading spinner shown during auth initialization.
 */
const DefaultLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    </div>
  );
};

/**
 * AuthProvider wraps the application to handle auth initialization.
 *
 * This component:
 * 1. Waits for Zustand store hydration from localStorage
 * 2. Shows a loading state while auth is being restored
 * 3. Only renders children once auth state is determined
 *
 * Usage:
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({
  children,
  LoadingComponent = DefaultLoader,
}: AuthProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Wait for Zustand persist hydration
  useEffect(() => {
    // Zustand persist middleware calls onRehydrateStorage after hydration
    // We track this separately to ensure we don't flash content before hydration
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Check if already hydrated (e.g., on hot reload)
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Show loading while hydrating or restoring session
  if (!isHydrated || isLoading) {
    return <LoadingComponent />;
  }

  return <>{children}</>;
}

export default AuthProvider;
