import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  // Uzbekistan specific fields
  inn: z.string().regex(/^\d{9}$/, "INN must be 9 digits").optional().or(z.literal("")),
  bank_account: z.string().regex(/^\d{20}$/, "Account number must be 20 digits").optional().or(z.literal("")),
  mfo: z.string().regex(/^\d{5}$/, "MFO must be 5 digits").optional().or(z.literal("")),
  bank_name: z.string().optional(),
  director_name: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SupplierCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userStore } = useAuth();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    inn: "",
    bank_account: "",
    mfo: "",
    bank_name: "",
    director_name: "",
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      if (!userStore?.store_id) throw new Error("No store selected");
      return api.post("/api/suppliers", {
        ...data,
        store_id: userStore.store_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers-summary"] });
      toast.success(t("supplier.createSuccess"));
      navigate("/suppliers");
    },
    onError: (error) => {
      console.error(error);
      toast.error(t("common.error"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      supplierSchema.parse(formData);
      setErrors({});
      createSupplierMutation.mutate(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        // Zod v3+ uses .issues, but we'll check for both just in case
        const issues = error.issues || (error as any).errors || [];

        issues.forEach((err: any) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error(t("common.validationError", { defaultValue: "Please check the form for errors" }));
      } else {
        console.error("Form submission error:", error);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/suppliers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("supplier.addSupplier")}</h1>
          <p className="text-muted-foreground">
            {t("supplier.createDescription", { defaultValue: "Add a new supplier to your database." })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("supplier.basicInfo", { defaultValue: "Basic Information" })}</CardTitle>
            <CardDescription>
              {t("supplier.basicInfoDescription", { defaultValue: "General details about the supplier." })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="name">
                {t("supplier.name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("supplier.namePlaceholder")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact">{t("supplier.contact")}</Label>
              <Input
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder={t("supplier.contactPlaceholder")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="director_name">{t("supplier.directorName", { defaultValue: "Director Name" })}</Label>
              <Input
                id="director_name"
                name="director_name"
                value={formData.director_name}
                onChange={handleChange}
                placeholder={t("supplier.directorNamePlaceholder", { defaultValue: "Full name of the director" })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">{t("supplier.phone")}</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t("supplier.phonePlaceholder")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">{t("supplier.email")}</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("supplier.emailPlaceholder")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="address">{t("supplier.address")}</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t("supplier.addressPlaceholder")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("supplier.financialInfo", { defaultValue: "Financial Information" })}</CardTitle>
            <CardDescription>
              {t("supplier.financialInfoDescription", { defaultValue: "Bank details and tax information (Uzbekistan)." })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="inn">{t("supplier.inn", { defaultValue: "INN (STIR)" })}</Label>
              <Input
                id="inn"
                name="inn"
                value={formData.inn}
                onChange={handleChange}
                placeholder="123456789"
                maxLength={9}
                className={errors.inn ? "border-destructive" : ""}
              />
              {errors.inn && (
                <p className="text-sm text-destructive">{errors.inn}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mfo">{t("supplier.mfo", { defaultValue: "MFO" })}</Label>
              <Input
                id="mfo"
                name="mfo"
                value={formData.mfo}
                onChange={handleChange}
                placeholder="00000"
                maxLength={5}
                className={errors.mfo ? "border-destructive" : ""}
              />
              {errors.mfo && (
                <p className="text-sm text-destructive">{errors.mfo}</p>
              )}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="bank_account">{t("supplier.bankAccount", { defaultValue: "Bank Account Number" })}</Label>
              <Input
                id="bank_account"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                placeholder="20208000..."
                maxLength={20}
                className={errors.bank_account ? "border-destructive" : ""}
              />
              {errors.bank_account && (
                <p className="text-sm text-destructive">{errors.bank_account}</p>
              )}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="bank_name">{t("supplier.bankName", { defaultValue: "Bank Name" })}</Label>
              <Input
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder={t("supplier.bankNamePlaceholder", { defaultValue: "e.g. Kapitalbank" })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("supplier.additionalInfo", { defaultValue: "Additional Information" })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="notes">{t("supplier.notes")}</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t("supplier.notesPlaceholder")}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/suppliers")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={createSupplierMutation.isPending}>
            {createSupplierMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
