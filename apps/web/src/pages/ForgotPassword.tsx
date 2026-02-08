import { useState } from "react";
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
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError(t("auth.invalidEmail", "Please enter a valid email address"));
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setIsSuccess(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      // Backend handles this, but we do it client-side too
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-md border-border/60 shadow-lg shadow-primary/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              {t("auth.checkEmail", "Check your email")}
            </CardTitle>
            <CardDescription>
              {t(
                "auth.resetEmailSent",
                "If an account exists with that email, we've sent a password reset link."
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center text-sm text-muted-foreground">
            <p>
              {t(
                "auth.resetEmailNote",
                "The link will expire in 1 hour. If you don't see the email, check your spam folder."
              )}
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.backToLogin", "Back to login")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {t("auth.forgotPasswordTitle", "Forgot your password?")}
          </CardTitle>
          <CardDescription>
            {t(
              "auth.forgotPasswordSubtitle",
              "Enter your email and we'll send you a link to reset your password."
            )}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">{t("auth.email", "Email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder", "you@example.com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 mt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? t("common.loading", "Loading...")
                : t("auth.sendResetLink", "Send reset link")}
            </Button>
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary hover:underline text-center"
            >
              {t("auth.backToLogin", "Back to login")}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
