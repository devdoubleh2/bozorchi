import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { isOwner } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DEFAULT_CURRENCIES = ["UZS", "USD", "RUB", "EUR"];

type ProfileErrors = {
  email?: string;
  storeName?: string;
  loyaltyPercentage?: string;
};

const getAvatarInitials = (email?: string | null) => {
  if (!email) return "?";
  const parts = email
    .split("@")[0]
    ?.split(/[.\-_]/)
    .filter(Boolean);
  if (parts && parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
};

export default function AccountEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userStore, fetchProfile, getStore } = useAuth();

  const [formData, setFormData] = useState({
    email: user?.email ?? "",
    storeName: userStore?.store?.name ?? "",
    currency: userStore?.store?.currency ?? DEFAULT_CURRENCIES[0],
    loyaltyPercentage: String(
      userStore?.store?.loyalty_cashback_percentage ?? 0
    ),
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storeEditable = userStore?.role === "admin";

  useEffect(() => {
    setFormData((prev) => ({
      email: user?.email ?? "",
      storeName: userStore?.store?.name ?? "",
      currency:
        userStore?.store?.currency ?? prev.currency ?? DEFAULT_CURRENCIES[0],
      loyaltyPercentage: String(
        userStore?.store?.loyalty_cashback_percentage ??
        Number.parseFloat(prev.loyaltyPercentage || "0") ??
        0
      ),
    }));
  }, [
    user?.email,
    userStore?.store?.name,
    userStore?.store?.currency,
    userStore?.store?.loyalty_cashback_percentage,
  ]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const avatarInitials = useMemo(
    () => getAvatarInitials(user?.email),
    [user?.email]
  );

  const memberSince = useMemo(() => {
    if (!user?.created_at) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(user.created_at));
  }, [user?.created_at]);

  const roleLabel = useMemo(() => {
    if (isOwner(user)) return t("profile.roleOwner", { defaultValue: "Owner" });
    if (userStore?.role === "admin") return t("profile.roleAdmin");
    if (userStore?.role === "cashier") return t("profile.roleCashier", { defaultValue: "Cashier" });
    return userStore?.role ?? t("common.notSpecified");
  }, [user, userStore?.role, t]);

  const currencyOptions = useMemo(() => {
    const merged = [...DEFAULT_CURRENCIES];
    if (formData.currency && !merged.includes(formData.currency)) {
      merged.unshift(formData.currency);
    }
    return Array.from(new Set(merged));
  }, [formData.currency]);

  const hasChanges = useMemo(() => {
    const emailChanged = formData.email.trim() !== (user?.email ?? "");
    const storeNameChanged =
      storeEditable &&
      formData.storeName.trim() !== (userStore?.store?.name ?? "");
    const currencyChanged =
      storeEditable &&
      formData.currency !==
      (userStore?.store?.currency ?? DEFAULT_CURRENCIES[0]);
    const currentCashback = userStore?.store?.loyalty_cashback_percentage ?? 0;
    const parsedCashback = Number.parseFloat(formData.loyaltyPercentage || "0");
    const loyaltyPercentageChanged = storeEditable
      ? Number.isNaN(parsedCashback) ||
      Math.abs(parsedCashback - currentCashback) > 0.001
      : false;

    return (
      emailChanged ||
      storeNameChanged ||
      currencyChanged ||
      loyaltyPercentageChanged
    );
  }, [
    formData.email,
    formData.storeName,
    formData.currency,
    formData.loyaltyPercentage,
    storeEditable,
    user?.email,
    userStore?.store?.name,
    userStore?.store?.currency,
    userStore?.store?.loyalty_cashback_percentage,
  ]);

  const validateEmail = useCallback(
    (email: string) => {
      if (!email.trim()) {
        setErrors((prev) => ({
          ...prev,
          email: t("auth.emailRequired"),
        }));
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrors((prev) => ({
          ...prev,
          email: t("auth.invalidEmail"),
        }));
        return false;
      }
      setErrors((prev) => ({ ...prev, email: undefined }));
      return true;
    },
    [t]
  );

  const handleFieldChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handlePasswordFieldChange = useCallback(
    (field: keyof typeof passwordForm, value: string) => {
      setPasswordForm((prev) => ({ ...prev, [field]: value }));
      setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const showSuccess = () => {
    setShowSuccessBanner(true);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = setTimeout(() => {
      setShowSuccessBanner(false);
    }, 2400);
  };

  const handleSave = useCallback(async () => {
    const trimmedEmail = formData.email.trim();
    const trimmedStoreName = formData.storeName.trim();
    const trimmedLoyaltyPercentage = formData.loyaltyPercentage.trim();

    if (!hasChanges) {
      toast.info(
        t("profile.noChanges", { defaultValue: "No changes to save." })
      );
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      return;
    }

    if (storeEditable && trimmedStoreName.length === 0) {
      setErrors((prev) => ({
        ...prev,
        storeName: t("profile.storeNameRequired"),
      }));
      return;
    }

    let parsedLoyaltyPercentage =
      userStore?.store?.loyalty_cashback_percentage ?? 0;
    if (storeEditable) {
      if (!trimmedLoyaltyPercentage) {
        setErrors((prev) => ({
          ...prev,
          loyaltyPercentage: t("settings.loyaltyCashbackRequired", {
            defaultValue: "Enter a cashback percentage between 0 and 100.",
          }),
        }));
        return;
      }

      const numericPercentage = Number.parseFloat(trimmedLoyaltyPercentage);
      if (Number.isNaN(numericPercentage)) {
        setErrors((prev) => ({
          ...prev,
          loyaltyPercentage: t("settings.loyaltyCashbackInvalid", {
            defaultValue: "Cashback percentage must be a valid number.",
          }),
        }));
        return;
      }
      if (numericPercentage < 0 || numericPercentage > 100) {
        setErrors((prev) => ({
          ...prev,
          loyaltyPercentage: t("settings.loyaltyCashbackRange", {
            defaultValue: "Cashback percentage must be between 0 and 100.",
          }),
        }));
        return;
      }
      parsedLoyaltyPercentage = numericPercentage;
      setErrors((prev) => ({ ...prev, loyaltyPercentage: undefined }));
    }

    setIsSaving(true);
    setErrors({});

    try {
      const operations: Array<Promise<unknown>> = [];

      if (trimmedEmail !== (user?.email ?? "")) {
        operations.push(
          api.put<{ user: typeof user }>("/api/auth/profile", {
            email: trimmedEmail,
          })
        );
      }

      if (
        storeEditable &&
        userStore?.store &&
        (trimmedStoreName !== userStore.store.name ||
          formData.currency !==
          (userStore.store.currency ?? DEFAULT_CURRENCIES[0]) ||
          Math.abs(
            parsedLoyaltyPercentage -
            (userStore.store.loyalty_cashback_percentage ?? 0)
          ) > 0.001)
      ) {
        operations.push(
          api.put("/api/stores", {
            name: trimmedStoreName,
            currency: formData.currency,
            loyalty_cashback_percentage: parsedLoyaltyPercentage,
          })
        );
      }

      if (operations.length === 0) {
        toast.info(
          t("profile.noChanges", { defaultValue: "No changes to save." })
        );
        setIsSaving(false);
        return;
      }

      await Promise.all(operations);

      // Refresh profile and store data from server
      await fetchProfile();
      await getStore();
      showSuccess();
      toast.info(t("profile.profileUpdated"));
    } catch (error) {
      console.error("AccountEdit", error);
      toast.error(
        t("profile.updateFailed", {
          defaultValue: "Failed to update your profile.",
        })
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    formData.currency,
    formData.email,
    formData.storeName,
    formData.loyaltyPercentage,
    getStore,
    hasChanges,
    fetchProfile,
    storeEditable,
    toast,
    t,
    user?.email,
    userStore?.store,
    userStore?.store?.loyalty_cashback_percentage,
    validateEmail,
  ]);

  const handleSavePassword = useCallback(async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    const newErrors: typeof passwordErrors = {};
    if (!trimmedCurrent) {
      newErrors.currentPassword = t("profile.currentPasswordRequired");
    }
    if (!trimmedNew) {
      newErrors.newPassword = t("profile.newPasswordRequired");
    } else if (trimmedNew.length < 8) {
      newErrors.newPassword = t("auth.passwordLength", {
        defaultValue: "Password must be at least 8 characters.",
      });
    } else if (
      !/[A-Z]/.test(trimmedNew) ||
      !/[a-z]/.test(trimmedNew) ||
      !/\d/.test(trimmedNew)
    ) {
      newErrors.newPassword = t("auth.passwordRequirements", {
        defaultValue:
          "Password must include uppercase, lowercase letters and a number.",
      });
    }
    if (!trimmedConfirm) {
      newErrors.confirmPassword = t("profile.confirmPassword", {
        defaultValue: "Confirm password",
      });
    } else if (trimmedConfirm !== trimmedNew) {
      newErrors.confirmPassword = t("auth.passwordsDoNotMatch", {
        defaultValue: "Passwords do not match.",
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setPasswordErrors({});
    setIsSavingPassword(true);
    try {
      await api.put("/api/auth/password", {
        currentPassword: trimmedCurrent,
        newPassword: trimmedNew,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success(t("profile.passwordChanged"));
    } catch (error) {
      console.error("Password change", error);
      toast.error(
        t("profile.passwordChangeFailed", {
          defaultValue: "Could not update password.",
        })
      );
    } finally {
      setIsSavingPassword(false);
    }
  }, [passwordForm, t, toast]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      {showSuccessBanner && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {t("profile.profileUpdated")}
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold leading-tight text-foreground">
            {t("settings.editProfile", { defaultValue: "Edit profile" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("settings.editProfileSubtitle", {
              defaultValue:
                "Update your contact details, store preferences, and account info.",
            })}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {t("common.back")}
        </Button>
      </header>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:text-left">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                {avatarInitials}
              </div>
              <Badge className="absolute -bottom-1 -right-1 border border-background px-2 py-0 text-xs uppercase">
                {roleLabel.charAt(0)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {user?.email ?? "—"}
              </p>
              <Badge variant="secondary">{roleLabel}</Badge>
            </div>
          </div>
          <div className="grid w-full gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="font-medium">{t("profile.memberSince")}</p>
              <p className="text-foreground">{memberSince}</p>
            </div>
            <div>
              <p className="font-medium">{t("profile.accountStatus")}</p>
              <Badge className="mt-1 bg-emerald-500/15 text-emerald-700">
                {t("profile.active")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>
            {storeEditable
              ? t("profile.editStoreInfo")
              : t("profile.storeInfo")}
          </CardTitle>
          <CardDescription>
            {storeEditable
              ? t("settings.editProfileSubtitle", {
                defaultValue:
                  "Manage store details that appear in POS and reports.",
              })
              : t("profile.accountInfo")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {storeEditable && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("settings.storeName")}
                </label>
                <Input
                  value={formData.storeName}
                  onChange={(event) =>
                    handleFieldChange("storeName", event.target.value)
                  }
                  disabled={isSaving}
                  placeholder={t("settings.storeName")}
                />
                {errors.storeName && (
                  <p className="text-sm text-destructive">{errors.storeName}</p>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("settings.currency")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {currencyOptions.map((currency) => (
                    <button
                      key={currency}
                      type="button"
                      onClick={() => handleFieldChange("currency", currency)}
                      disabled={isSaving}
                      className={cn(
                        "rounded-full border px-4 py-1 text-sm font-medium transition",
                        formData.currency === currency
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-transparent text-muted-foreground hover:border-foreground"
                      )}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("settings.loyaltyCashback", {
                    defaultValue: "Loyalty cashback (%)",
                  })}
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.loyaltyPercentage}
                  onChange={(event) =>
                    handleFieldChange("loyaltyPercentage", event.target.value)
                  }
                  disabled={isSaving}
                  placeholder={t("settings.loyaltyCashbackPlaceholder", {
                    defaultValue: "e.g. 5",
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.loyaltyCashbackHint", {
                    defaultValue:
                      "Customers earn this percentage of each sale as redeemable balance.",
                  })}
                </p>
                {errors.loyaltyPercentage && (
                  <p className="text-sm text-destructive">
                    {errors.loyaltyPercentage}
                  </p>
                )}
              </div>
            </>
          )}

          {!storeEditable && userStore?.store && (
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="font-medium">{t("settings.storeName")}</p>
                <p className="text-foreground">{userStore.store.name}</p>
              </div>
              <div>
                <p className="font-medium">{t("settings.currency")}</p>
                <p className="text-foreground">
                  {userStore.store.currency ?? "—"}
                </p>
              </div>
              <div>
                <p className="font-medium">
                  {t("settings.loyaltyCashback", {
                    defaultValue: "Loyalty cashback",
                  })}
                </p>
                <p className="text-foreground">
                  {new Intl.NumberFormat(undefined, {
                    maximumFractionDigits: 2,
                  }).format(userStore.store.loyalty_cashback_percentage ?? 0)}
                  %
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="font-medium">{t("profile.yourRole")}</p>
              <p className="text-foreground">{roleLabel}</p>
            </div>
            <div>
              <p className="font-medium">
                {t("settings.storeId", { defaultValue: "Store ID" })}
              </p>
              <p className="break-all text-foreground">
                {userStore?.store?.id ?? "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("profile.editPersonalInfo")}</CardTitle>
          <CardDescription>
            {t("profile.personalInfo", {
              defaultValue: "Update the email you sign in with.",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("auth.email")}
            </label>
            <Input
              value={formData.email}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              disabled={isSaving}
              onChange={(event) =>
                handleFieldChange("email", event.target.value)
              }
              placeholder="name@company.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
            {t("profile.emailChangeWarning")}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("profile.changePassword")}</CardTitle>
          <CardDescription>
            {t("profile.changePasswordAlert", {
              defaultValue:
                "Set a strong password with at least 8 characters, including upper, lower case letters and a number.",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("profile.currentPassword")}
            </label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                handlePasswordFieldChange("currentPassword", event.target.value)
              }
              disabled={isSavingPassword}
              placeholder="••••••••"
            />
            {passwordErrors.currentPassword && (
              <p className="text-sm text-destructive">
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("profile.newPassword")}
              </label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  handlePasswordFieldChange("newPassword", event.target.value)
                }
                disabled={isSavingPassword}
                placeholder="••••••••"
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("profile.confirmPassword")}
              </label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  handlePasswordFieldChange(
                    "confirmPassword",
                    event.target.value
                  )
                }
                disabled={isSavingPassword}
                placeholder="••••••••"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSavePassword}
              disabled={isSavingPassword}
              className="flex-1 justify-center sm:flex-none"
            >
              {isSavingPassword
                ? t("settings.saving", { defaultValue: "Saving..." })
                : t("profile.changePassword")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 justify-center gap-1 sm:flex-none"
        >
          {isSaving
            ? t("settings.saving", { defaultValue: "Saving..." })
            : t("common.save")}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isSaving}
          className="flex-1 justify-center sm:flex-none"
        >
          {t("common.cancel")}
        </Button>
      </div>

      <div className="rounded-md border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        {t("settings.editProfileHelp", {
          defaultValue:
            "Need help updating your account? Email support@bozorchi.store and we will take care of it.",
        })}
      </div>
    </div>
  );
}
