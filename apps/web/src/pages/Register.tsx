import React, { useEffect, useReducer } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
import type { UserStoreInfo } from "@/types/auth";

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
const PHONE_REGEX = /^(\+?998|8|)\s?-?\(?\d{2}\)?\s?-?\d{3}\s?-?\d{2}\s?-?\d{2}$/;

type Mode = "create" | "join";

// ============================================================================
// OWNER (CREATE STORE) TYPES
// ============================================================================

interface OwnerFields {
  orgName: string;
  storeName: string;
  address: string;
  phone: string;
  currency: string;
}

interface OwnerErrors {
  orgName?: string;
  storeName?: string;
  address?: string;
  phone?: string;
}

// ============================================================================
// CASHIER (JOIN STORE) TYPES
// ============================================================================

interface CashierFields {
  inviteToken: string;
}

interface CashierErrors {
  inviteToken?: string;
}

// ============================================================================
// SHARED TYPES
// ============================================================================

interface AccountFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AccountErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface FormErrors extends AccountErrors, OwnerErrors, CashierErrors {
  message?: string;
  details?: string[];
}

interface RegisterState {
  mode: Mode;
  account: AccountFields;
  owner: OwnerFields;
  cashier: CashierFields;
  errors: FormErrors;
  isSubmitting: boolean;
}

type RegisterAction =
  | { type: "SET_ACCOUNT_FIELD"; field: keyof AccountFields; value: string }
  | { type: "SET_OWNER_FIELD"; field: keyof OwnerFields; value: string }
  | { type: "SET_CASHIER_FIELD"; field: keyof CashierFields; value: string }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_ERRORS"; errors: FormErrors }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "PREFILL"; name?: string; email?: string };

const initialState: RegisterState = {
  mode: "create",
  account: { name: "", email: "", password: "", confirmPassword: "" },
  owner: { orgName: "", storeName: "", address: "", phone: "", currency: "UZS" },
  cashier: { inviteToken: "" },
  errors: {},
  isSubmitting: false,
};

function registerReducer(state: RegisterState, action: RegisterAction): RegisterState {
  switch (action.type) {
    case "SET_ACCOUNT_FIELD":
      return {
        ...state,
        account: { ...state.account, [action.field]: action.value },
      };
    case "SET_OWNER_FIELD":
      return {
        ...state,
        owner: { ...state.owner, [action.field]: action.value },
      };
    case "SET_CASHIER_FIELD":
      return {
        ...state,
        cashier: { ...state.cashier, [action.field]: action.value },
      };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.value };
    case "PREFILL":
      return {
        ...state,
        account: {
          ...state.account,
          name: state.account.name || action.name || "",
          email: state.account.email || action.email || "",
        },
      };
    default:
      return state;
  }
}

const resolveDefaultRoute = (userStore: UserStoreInfo | null): string => {
  if (!userStore || userStore.role === "admin") return "/dashboard";

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

type TFn = (key: string, options?: Record<string, unknown>) => string;

// ============================================================================
// OWNER (CREATE STORE) VALIDATION
// ============================================================================

function validateOwnerFields(fields: OwnerFields, t: TFn): OwnerErrors {
  const errors: OwnerErrors = {};

  if (!fields.orgName)
    errors.orgName = t("storeSetup.errors.organizationNameRequired", {
      defaultValue: "Organization name is required",
    });
  if (!fields.storeName)
    errors.storeName = t("storeSetup.errors.storeNameRequired", {
      defaultValue: "Store name is required",
    });
  if (!fields.address)
    errors.address = t("storeSetup.errors.addressRequired");
  if (!fields.phone) {
    errors.phone = t("storeSetup.errors.phoneRequired");
  } else if (!PHONE_REGEX.test(fields.phone.replace(/[\s-]/g, ""))) {
    errors.phone = t("storeSetup.errors.phoneInvalid");
  }

  return errors;
}

// ============================================================================
// CASHIER (JOIN STORE) VALIDATION
// ============================================================================

function validateCashierFields(fields: CashierFields, t: TFn): CashierErrors {
  const errors: CashierErrors = {};

  if (!fields.inviteToken.trim())
    errors.inviteToken = t("storeSetup.errors.inviteRequired", {
      defaultValue: "Invite code is required. Ask your manager for a new invite.",
    });

  return errors;
}

export function extractInviteToken(value: string): string {
  const trimmed = value.trim();
  const match = /[?&]invite=([^&]+)/.exec(trimmed);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return trimmed;
}

// ============================================================================
// SHARED ACCOUNT VALIDATION
// ============================================================================

function validateAccountFields(fields: AccountFields, t: TFn): AccountErrors {
  const errors: AccountErrors = {};

  if (!fields.name) errors.name = t("auth.nameRequired");

  if (!fields.email) {
    errors.email = t("auth.emailRequired");
  } else if (!/\S+@\S+\.\S+/.test(fields.email)) {
    errors.email = t("auth.invalidEmail");
  }

  if (!fields.password) {
    errors.password = t("auth.passwordRequired");
  } else if (fields.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = t("auth.passwordMinLength", {
      defaultValue: "Password must be at least 8 characters",
    });
  } else if (!PASSWORD_COMPLEXITY_REGEX.test(fields.password)) {
    errors.password = t("auth.passwordComplexity", {
      defaultValue:
        "Password must contain an uppercase letter, a lowercase letter, and a number",
    });
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = t("auth.confirmPasswordRequired");
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = t("auth.passwordsDoNotMatch");
  }

  return errors;
}

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signUpAsOwner, signUpAsCashier, getStore } = useAuth();
  const { t } = useTranslation();
  const oauthPrefill = (location.state as {
    oauthPrefill?: { name?: string; email?: string };
  } | null)?.oauthPrefill;

  const [state, dispatch] = useReducer(registerReducer, initialState);
  const { mode, account, owner, cashier, errors, isSubmitting } = state;

  const setAccountField = (field: keyof AccountFields) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => dispatch({ type: "SET_ACCOUNT_FIELD", field, value: e.target.value });

  const setOwnerField = (field: keyof OwnerFields) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => dispatch({ type: "SET_OWNER_FIELD", field, value: e.target.value });

  const setCashierField = (field: keyof CashierFields) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => dispatch({ type: "SET_CASHIER_FIELD", field, value: e.target.value });

  useEffect(() => {
    if (!oauthPrefill) {
      return;
    }

    dispatch({
      type: "PREFILL",
      name: oauthPrefill.name,
      email: oauthPrefill.email,
    });
  }, [oauthPrefill]);

  useEffect(() => {
    const invite = searchParams.get("invite");
    if (invite) {
      dispatch({ type: "SET_MODE", mode: "join" });
      dispatch({ type: "SET_CASHIER_FIELD", field: "inviteToken", value: invite });
    }
  }, [searchParams]);

  const validateForm = () => {
    const nextErrors: FormErrors = {
      ...validateAccountFields(account, t),
      ...(mode === "create"
        ? validateOwnerFields(owner, t)
        : validateCashierFields(cashier, t)),
    };

    dispatch({ type: "SET_ERRORS", errors: nextErrors });
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    dispatch({ type: "SET_SUBMITTING", value: true });
    dispatch({ type: "SET_ERRORS", errors: {} });

    try {
      let result;
      if (mode === "create") {
        result = await signUpAsOwner({
          name: account.name,
          email: account.email,
          password: account.password,
          orgName: owner.orgName,
          storeName: owner.storeName,
          address: owner.address,
          phone: owner.phone,
          currency: owner.currency,
        });
      } else {
        result = await signUpAsCashier({
          name: account.name,
          email: account.email,
          password: account.password,
          inviteToken: extractInviteToken(cashier.inviteToken),
        });
      }

      if (result.error) {
        throw new Error(result.error.message || "Registration failed");
      }

      // Refresh user store data
      const store = await getStore();
      const isPendingCashier =
        !result.user?.owned_organization &&
        !!result.user?.membership &&
        !result.user.membership.approved;
      navigate(isPendingCashier ? "/staff" : resolveDefaultRoute(store), {
        replace: true,
      });

    } catch (err: any) {
      console.error("Registration error:", err);
      dispatch({
        type: "SET_ERRORS",
        errors: {
          message: err.message || t("common.error"),
          details: err.details,
        },
      });
    } finally {
      dispatch({ type: "SET_SUBMITTING", value: false });
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
            <Tabs value={mode} onValueChange={(v) => dispatch({ type: "SET_MODE", mode: v as Mode })} className="w-full">
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
                    value={account.name}
                    onChange={setAccountField("name")}
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
                    value={account.email}
                    onChange={setAccountField("email")}
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
                      value={account.password}
                      onChange={setAccountField("password")}
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
                      value={account.confirmPassword}
                      onChange={setAccountField("confirmPassword")}
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
                      value={owner.orgName}
                      onChange={setOwnerField("orgName")}
                      aria-invalid={!!errors.orgName}
                    />
                    {errors.orgName && <p className="text-xs text-destructive">{errors.orgName}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="address">{t("storeSetup.address")}</Label>
                    <Input
                      id="address"
                      placeholder={t("storeSetup.address")}
                      value={owner.address}
                      onChange={setOwnerField("address")}
                      aria-invalid={!!errors.address}
                    />
                    {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                  </div>


                  <div className="space-y-1">
                    <Label htmlFor="storeName">{t("storeSetup.storeName")}</Label>
                    <Input
                      id="storeName"
                      placeholder={t("storeSetup.storeName")}
                      value={owner.storeName}
                      onChange={setOwnerField("storeName")}
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
                        value={owner.phone}
                        onChange={setOwnerField("phone")}
                        aria-invalid={!!errors.phone}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="currency">{t("storeSetup.currency.title")}</Label>
                      <Select value={owner.currency} onValueChange={(v) => dispatch({ type: "SET_OWNER_FIELD", field: "currency", value: v })}>
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
                    <Label htmlFor="inviteToken">
                      {t("storeSetup.inviteCode", { defaultValue: "Invite code" })}
                    </Label>
                    <Input
                      id="inviteToken"
                      placeholder={t("storeSetup.inviteCodePlaceholder", {
                        defaultValue: "Paste the invite code or link from your manager",
                      })}
                      value={cashier.inviteToken}
                      onChange={setCashierField("inviteToken")}
                      aria-invalid={!!errors.inviteToken}
                    />
                    {errors.inviteToken && <p className="text-xs text-destructive">{errors.inviteToken}</p>}
                    <p className="text-xs text-muted-foreground">
                      {t("storeSetup.inviteCodeHint", {
                        defaultValue:
                          "You join as pending until your manager approves you. If the code does not work, ask your manager for a new invite.",
                      })}
                    </p>
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
