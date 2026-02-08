import { Component, type ErrorInfo, type ReactNode } from "react";
import { useAuthStore } from "@/context/AuthStore";

interface Props {
  children: ReactNode;
  /** Fallback UI to show on error. If not provided, shows default error UI. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for auth-related errors.
 *
 * Catches errors during rendering and provides recovery options:
 * - Try Again: Attempts to restore the session
 * - Sign Out: Clears auth state and redirects to login
 *
 * Usage:
 * ```tsx
 * <AuthErrorBoundary>
 *   <ProtectedContent />
 * </AuthErrorBoundary>
 * ```
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error("AuthErrorBoundary caught error:", error, errorInfo);
  }

  handleRetry = async () => {
    this.setState({ hasError: false, error: null });
    try {
      await useAuthStore.getState().restoreSession();
    } catch {
      // If restore fails, the error boundary will catch it again
    }
  };

  handleSignOut = async () => {
    await useAuthStore.getState().signOut();
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg
              className="h-12 w-12 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground max-w-md">
              We encountered an error while loading your session. Please try
              again or sign out and sign back in.
            </p>
          </div>

          {this.state.error && (
            <details className="max-w-md text-sm text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={this.handleSignOut}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
