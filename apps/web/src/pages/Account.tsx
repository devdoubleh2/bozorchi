import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { usePOSStore, type PaymentMethodConfig } from "@/context/POSStore";
import { Copy, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userStore, organization, signOut } = useAuth();

  const { paymentMethods, updatePaymentMethods } = usePOSStore();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isOnlineOrderingEnabled, setIsOnlineOrderingEnabled] = useState(false);
  const [isUpdatingEcommerce, setIsUpdatingEcommerce] = useState(false);

  // Load e-commerce status from organization
  useEffect(() => {
    if (organization?.ecommerce_enabled !== undefined) {
      setIsOnlineOrderingEnabled(organization.ecommerce_enabled);
    }
  }, [organization]);

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">
            {t("settings.account", { defaultValue: "Account" })}
          </h1>
          <p className="text-muted-foreground">
            {t("settings.accountSubtitle", {
              defaultValue:
                "Manage your profile, store details, and preferences.",
            })}
          </p>
        </header>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>
              {t("settings.profile", { defaultValue: "Profile" })}
            </CardTitle>
            <CardDescription>
              {t("settings.profileSummary", {
                defaultValue: "Your personal information and store metadata.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("common.name", { defaultValue: "Name" })}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {user?.name ?? t("common.notSpecified")}
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                {t("settings.role", { defaultValue: "Owner" })}
              </Badge>
            </div>
            <Separator />
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("common.email", { defaultValue: "Email" })}
                </p>
                <p className="text-foreground">{user?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("settings.storeName", { defaultValue: "Store" })}
                </p>
                <p className="text-foreground">
                  {userStore?.store?.name ??
                    t("settings.storeName", { defaultValue: "Store name" })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("settings.currency", { defaultValue: "Currency" })}
                </p>
                <p className="text-foreground">
                  {userStore?.store?.currency ?? t("common.notSpecified")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("settings.storeId", { defaultValue: "Store ID" })}
                </p>
                <p className="text-foreground break-all">
                  {userStore?.store?.id ?? "—"}
                </p>
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => navigate("/account/edit")}
              className="w-fit"
            >
              {t("settings.editProfile", { defaultValue: "Edit profile" })}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>
              {t("settings.support", { defaultValue: "Support" })}
            </CardTitle>
            <CardDescription>
              {t("settings.supportSubtitle", {
                defaultValue:
                  "Need help? Reach out to our success team anytime.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              {t("settings.supportEmail", {
                defaultValue: "Email: dev.ismoiljon@gmail.com",
              })}
            </p>
            <p>
              {t("settings.supportPhone", {
                defaultValue: "Phone: +998907591226",
              })}
            </p>
            <p>
              {t("settings.supportTelegram", {
                defaultValue: "Telegram: @d0ubleh",
              })}
            </p>
            <p>
              {t("settings.supportAvailability", {
                defaultValue: "Available Monday to Friday, 9:00–18:00 (GMT+5).",
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>
              {t("settings.storeSettings", { defaultValue: "Store Settings" })}
            </CardTitle>
            <CardDescription>
              {t("settings.storeSettingsDescription", {
                defaultValue: "Configure your store preferences.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("settings.paymentMethods", {
                  defaultValue: "Payment Methods",
                })}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(paymentMethods) as (keyof PaymentMethodConfig)[]).map(
                  (method) => (
                    <Button
                      key={method}
                      variant={paymentMethods[method] ? "default" : "outline"}
                      onClick={() =>
                        updatePaymentMethods({
                          [method]: !paymentMethods[method],
                        })
                      }
                      className="capitalize"
                    >
                      {t(`pos.${method}`, { defaultValue: method })}
                    </Button>
                  )
                )}
              </div>
            </div>

            <Separator className="my-4" />
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">
                  {t("settings.onlineOrdering", { defaultValue: "Online ordering" })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.onlineOrderingDescription", {
                    defaultValue: "Allow customers to place orders online.",
                  })}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isOnlineOrderingEnabled ? "default" : "outline"}
                aria-pressed={isOnlineOrderingEnabled}
                disabled={isUpdatingEcommerce}
                onClick={async () => {
                  const newValue = !isOnlineOrderingEnabled;
                  setIsUpdatingEcommerce(true);
                  try {
                    await api.patch("/api/organizations/ecommerce-status", {
                      enabled: newValue,
                    });
                    setIsOnlineOrderingEnabled(newValue);
                    toast.success(
                      newValue
                        ? t("settings.ecommerceEnabledSuccess", {
                            defaultValue: "E-commerce store enabled",
                          })
                        : t("settings.ecommerceDisabledSuccess", {
                            defaultValue: "E-commerce store disabled",
                          })
                    );
                  } catch (error) {
                    console.error("Error updating e-commerce status:", error);
                    toast.error(
                      t("settings.ecommerceUpdateError", {
                        defaultValue: "Failed to update e-commerce status",
                      })
                    );
                  } finally {
                    setIsUpdatingEcommerce(false);
                  }
                }}
              >
                {isUpdatingEcommerce
                  ? t("common.updating", { defaultValue: "Updating..." })
                  : isOnlineOrderingEnabled
                  ? t("settings.onlineOrderingEnabled", { defaultValue: "Enabled" })
                  : t("settings.onlineOrderingDisabled", { defaultValue: "Disabled" })}
              </Button>
            </div>
            
            {/* E-commerce Store URL */}
            {organization?.slug && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("settings.ecommerceUrl", { defaultValue: "Your Online Store URL" })}
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/${organization.slug}`}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${organization.slug}`
                      );
                      toast.success(
                        t("common.copiedToClipboard", {
                          defaultValue: "Copied to clipboard",
                        })
                      );
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `${window.location.origin}/${organization.slug}`,
                        "_blank"
                      );
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">
                  {t("settings.receiptDesign", { defaultValue: "Receipt Design" })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.receiptDesignDescription", {
                    defaultValue: "Customize your receipt layout.",
                  })}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/account/receipt-design")}>
                {t("common.customize", { defaultValue: "Customize" })}
              </Button>
            </div>

          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>
              {t("settings.dangerZone", { defaultValue: "Danger zone" })}
            </CardTitle>
            <CardDescription>
              {t("settings.dangerZoneDescription", {
                defaultValue:
                  "Delete your store and account. This action cannot be undone.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("settings.deleteAccountConfirmation", {
                defaultValue:
                  "Deleting your account removes your store, inventory, transactions, and customers permanently.",
              })}
            </p>
            <Button
              variant="destructive"
              className="w-fit"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              {t("settings.deleteAccount", { defaultValue: "Delete account" })}
            </Button>
          </CardContent>
        </Card>
      </div >
      <ConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={async () => {
          try {
            await api.delete("/api/users/me");
            toast.success(
              t("settings.deleteAccountSuccess", {
                defaultValue: "Account deleted successfully.",
              })
            );
            await signOut();
            navigate("/login");
          } catch (error) {
            toast.error(
              t("settings.deleteAccountError", {
                defaultValue: "Failed to delete account. Please try again.",
              })
            );
          } finally {
            setShowDeleteConfirmation(false);
          }
        }}
        title={t("settings.deleteAccount", {
          defaultValue: "Delete Account",
        })}
        description={t("settings.deleteAccountConfirmation", {
          defaultValue:
            "Are you sure you want to delete your account? This action cannot be undone.",
        })}
        confirmText={t("settings.deleteAccount", {
          defaultValue: "Delete account",
        })}
      />
    </>
  );
}
