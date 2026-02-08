import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const MIN_PASSWORD_LENGTH = 6;
const PHONE_REGEX = /^(\+?998|8|)\s?-?\(?\d{2}\)?\s?-?\d{3}\s?-?\d{2}\s?-?\d{2}$/;

export default function Register() {
  const navigate = useNavigate();
  const { signUp, getStore } = useAuth();
  const { t } = useTranslation();

  const [mode, setMode] = useState<"create" | "join">("create");

  // User fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Store fields
  const [orgName, setOrgName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("UZS");
  const [storeName, setStoreName] = useState("");

  // Join fields
  const [storeId, setStoreId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    orgName?: string;
    address?: string;
    phone?: string;
    storeId?: string;
    storeName?: string;
    message?: string;
    details?: string[];
  }>({});


  const validateForm = () => {
    const nextErrors: typeof errors = {};

    if (!name) nextErrors.name = t("auth.nameRequired");

    if (!email) {
      nextErrors.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = t("auth.invalidEmail");
    }

    if (!password) {
      nextErrors.password = t("auth.passwordRequired");
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = t("auth.passwordMinLength");
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t("auth.confirmPasswordRequired");
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = t("auth.passwordsDoNotMatch");
    }

    if (mode === "create") {
      if (!orgName) nextErrors.orgName = t("storeSetup.errors.organizationNameRequired", { defaultValue: "Organization name is required" });
      if (!address) nextErrors.address = t("storeSetup.errors.addressRequired");
      if (!phone) {
        nextErrors.phone = t("storeSetup.errors.phoneRequired");
      } else if (!PHONE_REGEX.test(phone.replace(/[\s-]/g, ""))) {
        nextErrors.phone = t("storeSetup.errors.phoneInvalid");
      }
    } else {
      if (!storeId) nextErrors.storeId = t("storeSetup.errors.storeRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Single unified registration API call
      const result = await signUp({
        name,
        email: email.trim(),
        password,
        role: mode === "create" ? "admin" : "user",
        ...(mode === "create" ? {
          organization_name: orgName.trim(),
          address: address.trim(),
          phone: phone.replace(/\D/g, ""),
          currency,
          store_name: storeName.trim()
        } : {
          store_id: storeId,
        })
      });

      if (result.error) {
        throw new Error(result.error.message || "Registration failed");
      }

      // Refresh user store data
      await getStore();
      navigate("/dashboard", { replace: true });

    } catch (err: any) {
      console.error("Registration error:", err);
      setErrors({
        message: err.message || t("common.error"),
        details: err.details,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg border-border/60 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {t("auth.register")}
          </CardTitle>
          <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "create" | "join")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="create">{t("storeSetup.create", { defaultValue: "Create Store" })}</TabsTrigger>
                <TabsTrigger value="join">{t("storeSetup.join", { defaultValue: "Join Store" })}</TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                {/* Common Fields */}
                <div className="space-y-1">
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("auth.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      aria-invalid={!!errors.password}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      aria-invalid={!!errors.confirmPassword}
                    />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <TabsContent value="create" className="space-y-4 mt-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label htmlFor="orgName">{t("storeSetup.organization.name", { defaultValue: "Organization / Store Name" })}</Label>
                    <Input
                      id="orgName"
                      placeholder="My Organization"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      aria-invalid={!!errors.orgName}
                    />
                    {errors.orgName && <p className="text-xs text-destructive">{errors.orgName}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="address">{t("storeSetup.address")}</Label>
                    <Input
                      id="address"
                      placeholder={t("storeSetup.address")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      aria-invalid={!!errors.address}
                    />
                    {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                  </div>


                  <div className="space-y-1">
                    <Label htmlFor="storeName">{t("storeSetup.storeName")}</Label>
                    <Input
                      id="storeName"
                      placeholder={t("storeSetup.storeName")}
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      aria-invalid={!!errors.storeName}
                    />
                    {errors.storeName && <p className="text-xs text-destructive">{errors.storeName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="phone">{t("storeSetup.phone")}</Label>
                      <Input
                        id="phone"
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        aria-invalid={!!errors.phone}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="currency">{t("storeSetup.currency.title")}</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UZS">{t("currency.UZS")}</SelectItem>
                          <SelectItem value="USD">{t("currency.USD")}</SelectItem>
                          <SelectItem value="EUR">{t("currency.EUR")}</SelectItem>
                          <SelectItem value="RUB">{t("currency.RUB")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="join" className="space-y-4 mt-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label htmlFor="storeId">{t("storeSetup.storeId", { defaultValue: "Store ID" })}</Label>
                    <Input
                      id="storeId"
                      placeholder="Enter Store ID"
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      aria-invalid={!!errors.storeId}
                    />
                    {errors.storeId && <p className="text-xs text-destructive">{errors.storeId}</p>}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {errors.message && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p>{errors.message}</p>
                {errors.details?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                    {errors.details.map((detail, index) => (
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
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? t("common.loading") : t("auth.signUp")}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link to="/login" className="text-primary hover:underline">
                {t("auth.signIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
