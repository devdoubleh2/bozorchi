import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate password requirements
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    matches: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid =
    passwordValidation.minLength &&
    passwordValidation.hasUppercase &&
    passwordValidation.hasLowercase &&
    passwordValidation.hasNumber &&
    passwordValidation.matches;

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      navigate("/forgot-password", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError(
        t("auth.passwordRequirements", "Please meet all password requirements")
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/api/auth/reset-password", {
        token,
        password,
      });
      setIsSuccess(true);
      toast.success(
        t("auth.passwordResetSuccess", "Password reset successfully!")
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
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
              {t("auth.passwordReset", "Password reset!")}
            </CardTitle>
            <CardDescription>
              {t(
                "auth.passwordResetDescription",
                "Your password has been reset successfully. You can now log in with your new password."
              )}
            </CardDescription>
          </CardHeader>

          <CardFooter>
            <Link to="/login" className="w-full">
              <Button className="w-full">
                {t("auth.goToLogin", "Go to login")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {t("auth.resetPasswordTitle", "Reset your password")}
          </CardTitle>
          <CardDescription>
            {t("auth.resetPasswordSubtitle", "Enter your new password below.")}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password">
                {t("auth.newPassword", "New password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">
                {t("auth.confirmPassword", "Confirm password")}
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {/* Password requirements checklist */}
            <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t("auth.passwordMustHave", "Password must have:")}
              </p>
              <ul className="space-y-1 text-xs">
                <PasswordRequirement
                  met={passwordValidation.minLength}
                  text={t("auth.min8Chars", "At least 8 characters")}
                />
                <PasswordRequirement
                  met={passwordValidation.hasUppercase}
                  text={t("auth.oneUppercase", "One uppercase letter")}
                />
                <PasswordRequirement
                  met={passwordValidation.hasLowercase}
                  text={t("auth.oneLowercase", "One lowercase letter")}
                />
                <PasswordRequirement
                  met={passwordValidation.hasNumber}
                  text={t("auth.oneNumber", "One number")}
                />
                <PasswordRequirement
                  met={passwordValidation.matches}
                  text={t("auth.passwordsMatch", "Passwords match")}
                />
              </ul>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isPasswordValid}
            >
              {isSubmitting
                ? t("common.loading", "Loading...")
                : t("auth.resetPassword", "Reset password")}
            </Button>
            <Link
              to="/login"
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              {t("auth.backToLogin", "Back to login")}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-muted-foreground" />
      )}
      <span
        className={
          met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        }
      >
        {text}
      </span>
    </li>
  );
}
