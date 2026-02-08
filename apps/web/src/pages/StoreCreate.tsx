import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

interface StoreFormData {
  name: string;
  address: string;
  phone: string;
  currency: string;
}

const PHONE_REGEX =
  /^(\+?998|8|)\s?-?\(?\d{2}\)?\s?-?\d{3}\s?-?\d{2}\s?-?\d{2}$/;

export default function StoreCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, getStore, userStore } = useAuth();

  const [formData, setFormData] = useState<StoreFormData>({
    name: "",
    address: "",
    phone: "",
    currency: "UZS",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof StoreFormData | "submit", string>>
  >({});

  const currencies = [
    { code: "UZS", label: t("currency.UZS") },
    { code: "USD", label: t("currency.USD") },
    { code: "EUR", label: t("currency.EUR") },
    { code: "RUB", label: t("currency.RUB") },
  ];

  useEffect(() => {
    // Redirect if user is not an admin and already has stores (i.e., is a seller/employee)
    // We check stores.length > 0 to allow initial onboarding
    if (user && userStore && userStore.role !== "admin") {
      navigate("/");
    }
  }, [user, userStore, navigate]);

  const updateField = (field: keyof StoreFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof StoreFormData, string>> = {};

    if (!formData.name.trim())
      newErrors.name = t("storeSetup.errors.nameRequired");
    if (!formData.address.trim())
      newErrors.address = t("storeSetup.errors.addressRequired");
    if (!formData.phone.trim()) {
      newErrors.phone = t("storeSetup.errors.phoneRequired");
    } else if (!PHONE_REGEX.test(formData.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = t("storeSetup.errors.phoneInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not found");

      // Get organization ID from user's membership
      const organizationId =
        user.membership?.organization?.id || user.owned_organization?.id;
      if (!organizationId) {
        throw new Error("No organization found. Please contact support.");
      }

      const response = await api.post<{ store: { id: string } }>(
        "/api/stores/create",
        {
          name: formData.name.trim(),
          currency: formData.currency,
          address: formData.address.trim(),
          phone: formData.phone.replace(/\D/g, ""),
          userId: user.id,
          organizationId,
          role: "admin",
        }
      );
      return response.store;
    },
    onSuccess: async () => {
      await getStore(); // Refresh user store list
      navigate("/"); // Go to dashboard (switcher will show new store)
    },
    onError: (error) => {
      console.error("Store creation failed:", error);
      setErrors((prev) => ({
        ...prev,
        submit: t("storeSetup.error.createFailed"),
      }));
    },
  });

  const handleSubmit = () => {
    if (validate()) {
      createMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("storeSetup.create", { defaultValue: "Create New Store" })}
          </h1>
          <p className="text-muted-foreground">
            {t("storeSetup.subtitle", {
              defaultValue: "Set up your business profile",
            })}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {t("storeSetup.basicInfo.title", {
                defaultValue: "Store Details",
              })}
            </CardTitle>
            <CardDescription>
              {t("storeSetup.basicInfo.description", {
                defaultValue: "Enter your store information",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t("storeSetup.storeName")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={t("storeSetup.storeName")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">
                {t("storeSetup.phone")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+998 90 123 45 67"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">
                {t("storeSetup.address")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder={t("storeSetup.address")}
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            {/* Currency */}
            <div className="grid gap-2">
              <Label>{t("storeSetup.currency.title")}</Label>
              <ToggleGroup
                type="single"
                value={formData.currency}
                onValueChange={(value) =>
                  value && updateField("currency", value)
                }
                className="justify-start"
              >
                {currencies.map((currency) => (
                  <ToggleGroupItem key={currency.code} value={currency.code}>
                    {currency.code}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {errors.submit && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {errors.submit}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("common.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
