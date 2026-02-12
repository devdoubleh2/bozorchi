import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, UserPlus, Truck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { toast } from 'sonner'
import { api } from "@/lib/api";

type QuickAddAction = "product" | "supplier" | "customer";

interface ProductCategory {
  id: string;
  name: string;
  color: string | null;
}

interface Unit {
  id: string;
  title: string;
  unit_values: string;
}

export function QuickAddButton() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { userStore, getStore } = useAuth();

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QuickAddAction>("product");

  const [productForm, setProductForm] = useState({
    name: "",
    productCategoryId: "",
    variationName: "",
    barcode: "",
    sku: "",
    price: "",
    deliveryCost: "",
    unitId: "",
    initialStock: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const storeQuery = useQuery({
    queryKey: ["quick-add-store"],
    queryFn: async () => getStore(),
    initialData: userStore ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeQuery.data?.store?.id;

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const response = await api.get<{ productCategories: ProductCategory[] }>(
        "/api/product-categories"
      );
      return response.productCategories ?? [];
    },
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await api.get<{ units: Unit[] }>("/api/units");
      return response.units ?? [];
    },
    enabled: open,
    staleTime: 1000 * 60 * 10,
  });



  const addProductMutation = useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error(t("products.noStoresAvailable"));
      }

      if (!productForm.name.trim()) {
        throw new Error(t("products.nameRequired"));
      }
      if (!productForm.barcode.trim()) {
        throw new Error(t("products.barcodeRequired"));
      }
      if (!productForm.price.trim()) {
        throw new Error(t("products.sellingPriceRequired"));
      }
      if (!productForm.unitId) {
        throw new Error(t("products.unitRequired"));
      }

      const priceValue = Number.parseFloat(productForm.price);
      const deliveryCostValue = Number.parseFloat(productForm.deliveryCost);
      const stockValue = Number.parseFloat(productForm.initialStock);

      if (Number.isNaN(priceValue) || priceValue <= 0) {
        throw new Error(t("products.sellingPriceRequired"));
      }

      const payload = {
        name: productForm.name.trim(),
        product_category_id: productForm.productCategoryId || undefined,
        variations: [
          {
            name:
              productForm.variationName.trim() || productForm.name.trim(),
            description: "",
            barcode: productForm.barcode.trim(),
            sku: productForm.sku.trim(),
            delivery_cost: Number.isFinite(deliveryCostValue)
              ? deliveryCostValue
              : 0,
            selling_price: priceValue,
            unit_id: productForm.unitId,
            color: "",
            initial_stock: Number.isFinite(stockValue) ? stockValue : 0,
            image_url: "",
          },
        ],
      };

      await api.post("/api/products", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["pos-inventory", storeId] }),
      ]);
      toast.success(t("products.productAddedSuccessfully"));
      setProductForm({
        name: "",
        productCategoryId: "",
        variationName: "",
        barcode: "",
        sku: "",
        price: "",
        deliveryCost: "",
        unitId: "",
        initialStock: "",
      });
      setOpen(false);
    },
    onError: (error: unknown) => {
      console.error("Quick add product failed", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t("errors.productCreationFailed"));
      }
    },
  });

  const addSupplierMutation = useMutation({
    mutationFn: async () => {
      if (!supplierForm.name.trim()) {
        throw new Error(t("supplier.nameRequired"));
      }

      await api.post("/api/suppliers", {
        name: supplierForm.name.trim(),
        contact: supplierForm.contact.trim() || undefined,
        phone: supplierForm.phone.trim() || undefined,
        email: supplierForm.email.trim() || undefined,
        address: supplierForm.address.trim() || undefined,
        notes: supplierForm.notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(t("supplier.createSuccess"));
      setSupplierForm({
        name: "",
        contact: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
      setOpen(false);
    },
    onError: (error: unknown) => {
      console.error("Quick add supplier failed", error);
      toast.error(error instanceof Error ? error.message : t("common.error"));
    },
  });

  const addCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error(t("pos.noStoreSelected"));
      }
      if (!customerForm.name.trim()) {
        throw new Error(t("customers.nameRequired"));
      }

      await api.post("/api/customers", {
        name: customerForm.name.trim(),
        email: customerForm.email.trim() || undefined,
        phone: customerForm.phone.trim() || undefined,
        store_id: storeId,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["pos-customers", storeId] }),
      ]);
      toast.success(t("customers.customerAdded"));
      setCustomerForm({ name: "", email: "", phone: "" });
      setOpen(false);
    },
    onError: (error: unknown) => {
      console.error("Quick add customer failed", error);
      toast.error(error instanceof Error ? error.message : t("common.error"));
    },
  });

  const productCategoryOptions = useMemo(() => categories ?? [], [categories]);
  const unitOptions = useMemo(() => units ?? [], [units]);

  useEffect(() => {
    if (unitOptions.length > 0 && !productForm.unitId) {
      setProductForm((prev) => ({
        ...prev,
        unitId: unitOptions[0].id,
      }));
    }
  }, [unitOptions, productForm.unitId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Plus className="mr-2 size-4" />
          {t("quickAdd.buttonLabel", { defaultValue: "Add" })}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader className="space-y-2">
          <SheetTitle>{t("quickAdd.title", { defaultValue: "Quick add" })}</SheetTitle>
          <SheetDescription>
            {t("quickAdd.subtitle", {
              defaultValue:
                "Create new records without leaving your current workflow.",
            })}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={active === "product" ? "default" : "outline"}
              onClick={() => setActive("product")}
              className="flex items-center gap-2"
            >
              <Package className="size-4" />
              {t("quickAdd.product")}
            </Button>
            <Button
              variant={active === "supplier" ? "default" : "outline"}
              onClick={() => setActive("supplier")}
              className="flex items-center gap-2"
            >
              <Truck className="size-4" />
              {t("quickAdd.supplier")}
            </Button>
            <Button
              variant={active === "customer" ? "default" : "outline"}
              onClick={() => setActive("customer")}
              className="flex items-center gap-2"
            >
              <UserPlus className="size-4" />
              {t("quickAdd.customer")}
            </Button>
          </div>

          <Separator />

          {active === "product" ? (
            <div className="space-y-4">


              <Input
                value={productForm.name}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder={t("products.productName")}
              />
              <Input
                value={productForm.variationName}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    variationName: event.target.value,
                  }))
                }
                placeholder={t("products.variationName")}
              />
              <Input
                value={productForm.barcode}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    barcode: event.target.value,
                  }))
                }
                placeholder={t("products.barcode")}
              />
              <Input
                value={productForm.sku}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    sku: event.target.value,
                  }))
                }
                placeholder="SKU"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  placeholder={t("products.sellingPrice")}
                  type="number"
                  min="0"
                />
                <Input
                  value={productForm.deliveryCost}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      deliveryCost: event.target.value,
                    }))
                  }
                  placeholder={t("products.deliveryCost")}
                  type="number"
                  min="0"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={productForm.unitId}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      unitId: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    {t("products.selectUnit")}
                  </option>
                  {unitOptions.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title}
                    </option>
                  ))}
                </select>
                <select
                  value={productForm.productCategoryId}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      productCategoryId: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    {t("products.productCategory", { defaultValue: "Product category" })}
                  </option>
                  {productCategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                value={productForm.initialStock}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    initialStock: event.target.value,
                  }))
                }
                placeholder={t("inventory.initialStock", {
                  defaultValue: "Initial stock",
                })}
                type="number"
                min="0"
              />
              <Button
                className="w-full"
                onClick={() => addProductMutation.mutate()}
                disabled={addProductMutation.isPending}
              >
                {addProductMutation.isPending
                  ? t("common.loading")
                  : t("products.addProduct")}
              </Button>
            </div>
          ) : null}

          {active === "supplier" ? (
            <div className="space-y-4">
              <Input
                value={supplierForm.name}
                onChange={(event) =>
                  setSupplierForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder={t("supplier.name")}
              />
              <Input
                value={supplierForm.contact}
                onChange={(event) =>
                  setSupplierForm((prev) => ({
                    ...prev,
                    contact: event.target.value,
                  }))
                }
                placeholder={t("supplier.contact")}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={supplierForm.phone}
                  onChange={(event) =>
                    setSupplierForm((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  placeholder={t("supplier.phone")}
                />
                <Input
                  value={supplierForm.email}
                  onChange={(event) =>
                    setSupplierForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder={t("supplier.email")}
                />
              </div>
              <Input
                value={supplierForm.address}
                onChange={(event) =>
                  setSupplierForm((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
                placeholder={t("supplier.address")}
              />
              <Input
                value={supplierForm.notes}
                onChange={(event) =>
                  setSupplierForm((prev) => ({
                    ...prev,
                    notes: event.target.value,
                  }))
                }
                placeholder={t("supplier.notes")}
              />
              <Button
                className="w-full"
                onClick={() => addSupplierMutation.mutate()}
                disabled={addSupplierMutation.isPending}
              >
                {addSupplierMutation.isPending
                  ? t("common.loading")
                  : t("supplier.addSupplier", { defaultValue: "Add supplier" })}
              </Button>
            </div>
          ) : null}

          {active === "customer" ? (
            <div className="space-y-4">
              <Input
                value={customerForm.name}
                onChange={(event) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder={t("customers.customerName")}
              />
              <Input
                value={customerForm.email}
                onChange={(event) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder={t("customers.customerEmail")}
              />
              <Input
                value={customerForm.phone}
                onChange={(event) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                placeholder={t("customers.customerPhone")}
              />
              <Button
                className="w-full"
                onClick={() => addCustomerMutation.mutate()}
                disabled={addCustomerMutation.isPending}
              >
                {addCustomerMutation.isPending
                  ? t("common.loading")
                  : t("customers.addCustomer")}
              </Button>
            </div>
          ) : null}

          <div className="rounded-md border border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <span>{t("quickAdd.hint")}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {["product", "supplier", "customer"].map((tag) => (
                <Badge key={tag} variant="outline">
                  {t(`quickAdd.${tag}`)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
