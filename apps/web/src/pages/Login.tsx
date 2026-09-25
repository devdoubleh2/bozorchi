import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { UserStoreInfo } from "@/types/auth";
import { Chrome } from "lucide-react";

const resolveDefaultRoute = (userStore: UserStoreInfo | null): string => {
  if (!userStore || userStore.role === "owner") return "/dashboard";

  const permissions = userStore.permissions ?? [];
  if (permissions.includes("VIEW_DASHBOARD")) return "/dashboard";
  if (permissions.includes("POS_ACCESS")) return "/pos";
  if (
    permissions.includes("MANAGE_PRODUCTS") ||
    permissions.includes("MANAGE_INVENTORY")
  ) {
    return "/inventory";
  }
  if (permissions.includes("VIEW_ANALYTICS")) return "/transactions";
  return "/account";
};

export default function Login() {
  const navigate = useNavigate();

  const {
    signIn,
    signInWithGoogle,
    getStore,
    isAuthenticated,
    userStore,
    isLoading: isAuthLoading,
  } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    message?: string;
    details?: string[];
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);



  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t("auth.invalidEmail");
    }

    if (!password) {
      errors.password = t("auth.passwordRequired");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    const result = await signIn(email.trim(), password);

    if (result.error) {
      setFormErrors({
        message: result.error.message,
        details: result.error.details,
      });
      setIsSubmitting(false);
      return;
    }

    if (result.user) {
      const store = await getStore();
      navigate(resolveDefaultRoute(store), { replace: true });
    }


    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId || typeof window === "undefined" || !("google" in window)) {
      setFormErrors({
        message: "Google sign-in is not configured.",
      });
      return;
    }

    setIsGoogleSubmitting(true);
    setFormErrors({});

    try {
      const google = (window as Window & {
        google: {
          accounts: {
            id: {
              initialize: (config: {
                client_id: string;
                callback: (response: { credential?: string }) => void;
              }) => void;
              prompt: () => void;
            };
          };
        };
      }).google;

      const credential = await new Promise<string>((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              resolve(response.credential);
              return;
            }
            reject(new Error("Google sign-in did not return a credential."));
          },
        });
        google.accounts.id.prompt();
      });

      const result = await signInWithGoogle(credential);
      if (result.error) {
        setFormErrors({ message: result.error.message, details: result.error.details });
        return;
      }

      if (result.needsOnboarding && result.user) {
        navigate("/register", {
          replace: true,
          state: {
            oauthPrefill: {
              name: result.user.name ?? "",
              email: result.user.email,
            },
          },
        });
        return;
      }

      const store = await getStore();
      navigate(resolveDefaultRoute(store), { replace: true });
    } catch (error) {
      setFormErrors({
        message: error instanceof Error ? error.message : "Google sign-in failed.",
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {t("auth.welcome")}
          </CardTitle>
          <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={Boolean(formErrors.email)}
                aria-describedby={formErrors.email ? "email-error" : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {formErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-invalid={Boolean(formErrors.password)}
                aria-describedby={
                  formErrors.password ? "password-error" : undefined
                }
              />
              {formErrors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {formErrors.password}
                </p>
              )}
            </div>
            {formErrors.message && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p>{formErrors.message}</p>
                {formErrors.details?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                    {formErrors.details.map((detail, index) => (
                      <li key={`${detail}-${index}`}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isAuthLoading}
            >
              {isSubmitting ? t("common.loading") : t("auth.signIn")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isGoogleSubmitting || isAuthLoading}
              onClick={handleGoogleSignIn}
            >
              <Chrome className="h-4 w-4" />
              {isGoogleSubmitting ? t("common.loading") : "Continue with Google"}
            </Button>
            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary hover:underline text-center"
            >
              {t("auth.forgotPassword", "Forgot password?")}
            </Link>
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.dontHaveAccount")}{" "}
              <Link to="/register" className="text-primary hover:underline">
                {t("auth.register")}
              </Link>
            </p>
            {isAuthenticated && userStore && (
              <p className="text-xs text-muted-foreground text-center">
                {t("auth.alreadySignedIn")}
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
