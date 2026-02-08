import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Paywall } from "@/components/Paywall";

/**
 * MobilePaywall page for handling mobile app payment flow.
 *
 * With cookie-based auth, the mobile app should already have auth cookies set.
 * This page simply checks if the user is authenticated and shows the paywall.
 * If not authenticated, redirects to login.
 */
export default function MobilePaywallPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, restoreSession } = useAuth();

  useEffect(() => {
    // Restore session to ensure cookies are validated
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    // Redirect to login if not authenticated after loading
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Paywall>
      <div />
    </Paywall>
  );
}
