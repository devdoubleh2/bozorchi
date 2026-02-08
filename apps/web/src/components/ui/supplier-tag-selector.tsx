import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner"
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  store_id: string;
  created_at: string;
  updated_at: string;
}

type SupplierTagSelectorProps = {
  suppliers?: Supplier[];
  selectedSupplierId?: string;
  onSupplierSelect: (supplierId: string) => void;
  error?: string;
};

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  inn: z.string().regex(/^\d{9}$/, "INN must be 9 digits").optional().or(z.literal("")),
  bank_account: z.string().regex(/^\d{20}$/, "Account number must be 20 digits").optional().or(z.literal("")),
  mfo: z.string().regex(/^\d{5}$/, "MFO must be 5 digits").optional().or(z.literal("")),
  bank_name: z.string().optional(),
  director_name: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const initialSupplierForm: SupplierFormData = {
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
};

export default function SupplierTagSelector({
  suppliers,
  selectedSupplierId,
  onSupplierSelect,
  error,
}: SupplierTagSelectorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>(initialSupplierForm);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});


  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const res = await api.post<{ supplier: Supplier }>("/api/suppliers", data);
      return res.supplier;
    },
    onSuccess: (supplier: Supplier) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onSupplierSelect(supplier.id);
      resetForm();
      setIsAddSupplierOpen(false);
      toast(t("supplier.createSuccess"));
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const resetForm = () => {
    setSupplierForm(initialSupplierForm);
    setFormErrors({});
  };

  const handleCreateSupplier = () => {
    try {
      supplierSchema.parse(supplierForm);
      setFormErrors({});
      createSupplierMutation.mutate(supplierForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(newErrors);
        toast(t("common.validationError", { defaultValue: "Please check the form for errors" }));
      }
    }
  };

  const handleInputChange = (
    field: keyof SupplierFormData,
    value: string
  ) => {
    setSupplierForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {suppliers &&
          suppliers.map((supplier) => (
            <Badge
              key={supplier.id}
              variant={selectedSupplierId === supplier.id ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => onSupplierSelect(supplier.id)}
            >
              <Package size={12} className="mr-2" />
              {supplier.name}
            </Badge>
          ))}

        <Sheet open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-dashed border-primary text-primary hover:bg-primary/10"
            >
              <Plus size={14} className="mr-1" />
              {t("supplier.addSupplier")}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[900px] lg:w-[1000px] overflow-y-auto p-8">
            <SheetHeader>
              <SheetTitle>{t("supplier.addSupplier")}</SheetTitle>
              <SheetDescription>
                {t("supplier.createDescription", { defaultValue: "Add a new supplier to your database." })}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Basic Information Section */}
              <div className="space-y-4 pb-6 border-b">
                <div>
                  <h3 className="font-semibold text-sm mb-4">{t("supplier.basicInfo", { defaultValue: "Basic Information" })}</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-name">
                      {t("supplier.name")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="supplier-name"
                      value={supplierForm.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder={t("supplier.namePlaceholder")}
                      className={formErrors.name ? "border-destructive" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-destructive">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier-contact">{t("supplier.contact")}</Label>
                    <Input
                      id="supplier-contact"
                      value={supplierForm.contact}
                      onChange={(e) => handleInputChange("contact", e.target.value)}
                      placeholder={t("supplier.contactPlaceholder")}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier-director">{t("supplier.directorName", { defaultValue: "Director Name" })}</Label>
                    <Input
                      id="supplier-director"
                      value={supplierForm.director_name}
                      onChange={(e) => handleInputChange("director_name", e.target.value)}
                      placeholder={t("supplier.directorNamePlaceholder", { defaultValue: "Full name of the director" })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier-phone">{t("supplier.phone")}</Label>
                    <Input
                      id="supplier-phone"
                      value={supplierForm.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder={t("supplier.phonePlaceholder")}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier-email">{t("supplier.email")}</Label>
                    <Input
                      id="supplier-email"
                      value={supplierForm.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder={t("supplier.emailPlaceholder")}
                      className={formErrors.email ? "border-destructive" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-destructive">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier-address">{t("supplier.address")}</Label>
                    <Input
                      id="supplier-address"
                      value={supplierForm.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder={t("supplier.addressPlaceholder")}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information Section */}
              <div className="space-y-4 pb-6 border-b">
                <div>
                  <h3 className="font-semibold text-sm mb-4">{t("supplier.financialInfo", { defaultValue: "Financial Information" })}</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-inn">{t("supplier.inn", { defaultValue: "INN (STIR)" })}</Label>
                    <Input
                      id="supplier-inn"
                      value={supplierForm.inn}
                      onChange={(e) => handleInputChange("inn", e.target.value)}
                      placeholder="123456789"
                      maxLength={9}
                      className={formErrors.inn ? "border-destructive" : ""}
                    />
                    {formErrors.inn && (
                      <p className="text-sm text-destructive">{formErrors.inn}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier-mfo">{t("supplier.mfo", { defaultValue: "MFO" })}</Label>
                    <Input
                      id="supplier-mfo"
                      value={supplierForm.mfo}
                      onChange={(e) => handleInputChange("mfo", e.target.value)}
                      placeholder="00000"
                      maxLength={5}
                      className={formErrors.mfo ? "border-destructive" : ""}
                    />
                    {formErrors.mfo && (
                      <p className="text-sm text-destructive">{formErrors.mfo}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier-account">{t("supplier.bankAccount", { defaultValue: "Bank Account Number" })}</Label>
                    <Input
                      id="supplier-account"
                      value={supplierForm.bank_account}
                      onChange={(e) => handleInputChange("bank_account", e.target.value)}
                      placeholder="20208000..."
                      maxLength={20}
                      className={formErrors.bank_account ? "border-destructive" : ""}
                    />
                    {formErrors.bank_account && (
                      <p className="text-sm text-destructive">{formErrors.bank_account}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier-bank">{t("supplier.bankName", { defaultValue: "Bank Name" })}</Label>
                    <Input
                      id="supplier-bank"
                      value={supplierForm.bank_name}
                      onChange={(e) => handleInputChange("bank_name", e.target.value)}
                      placeholder={t("supplier.bankNamePlaceholder", { defaultValue: "e.g. Kapitalbank" })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-4">{t("supplier.additionalInfo", { defaultValue: "Additional Information" })}</h3>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="supplier-notes">{t("supplier.notes")}</Label>
                  <Textarea
                    id="supplier-notes"
                    value={supplierForm.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder={t("supplier.notesPlaceholder")}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSupplierOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateSupplier}
                  disabled={createSupplierMutation.isPending}
                >
                  {createSupplierMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t("common.saving")}
                    </>
                  ) : (
                    t("common.save")
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}