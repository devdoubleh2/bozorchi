import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Check,
  Box,
  Layers,
  Zap,
} from "lucide-react";
import { cn, parseApiError } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from 'sonner'
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ProductCategoryTagSelector from "@/components/ui/product-category-tag-selector";
import UnitTagSelector from "@/components/ui/unit-tag-selector";
import SupplierTagSelector from "@/components/ui/supplier-tag-selector";
import ImageUpload from "@/components/ui/image-upload";

interface Unit {
  id: string;
  name: string;
  category_id: string;
}

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

interface ProductVariationFormData {
  name: string;
  description: string;
  barcode: string;
  sku: string;
  sellingPrice: string;
  deliveryCost: string;
  deliveryCostCurrency: string;
  wholesalePrice: string;
  costPrice: string;
  unitId: string;
  supplierId: string;
  initialStock: string;
  color: string;
  imageUrl: string;
}

interface ProductFormData {
  name: string;
  description: string;
  productCategoryId: string;
  imageUrl: string;
  variations: ProductVariationFormData[];
}

interface VariationError {
  name?: string;
  barcode?: string;
  sellingPrice?: string;
  deliveryCost?: string;
  costPrice?: string;
  unitId?: string;
}

interface FormErrors {
  name?: string;
  productCategoryId?: string;
  variations: { [key: number]: VariationError };
}

type VariationPayload = {
  name: string;
  description: string;
  barcode: string;
  sku: string;
  price: number;
  selling_price: number;
  wholesale_price: number;
  cost_price?: number;
  unit_id: string;
  supplier_id?: string;
  color: string;
  initial_stock: number;
  image_url: string;
};

type CreateProductPayload = {
  name: string;
  category_id: string;
  product_category_id?: string;
  image_url: string;
  type: ProductType;
  variations: VariationPayload[];
};

type ProductType = "simple" | "variable" | "service";

const createDefaultVariation = (): ProductVariationFormData => ({
  name: "",
  description: "",
  barcode: "",
  sku: "",
  sellingPrice: "",
  deliveryCost: "",
  deliveryCostCurrency: "",
  wholesalePrice: "",
  costPrice: "",
  unitId: "",
  supplierId: "",
  initialStock: "",
  color: "#FFFFFF",
  imageUrl: "",
});

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  productCategoryId: "",
  imageUrl: "",
  variations: [createDefaultVariation()],
};

const getRandomDigits = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

const calculateEanCheckDigit = (digits: string) => {
  const sum = digits
    .split("")
    .reverse()
    .reduce((acc, digit, index) => {
      const value = Number(digit) || 0;
      const weight = index % 2 === 0 ? 3 : 1;
      return acc + value * weight;
    }, 0);

  const remainder = sum % 10;
  return ((10 - remainder) % 10).toString();
};

const generateRandomEan = (length: 8 | 13) => {
  const baseLength = length - 1;
  const baseDigits = getRandomDigits(baseLength);
  const checkDigit = calculateEanCheckDigit(baseDigits);
  return `${baseDigits}${checkDigit}`;
};

const generateRandomEanBarcode = () => {
  const length: 8 | 13 = Math.random() < 0.5 ? 8 : 13;
  return generateRandomEan(length);
};

const generateRandomSku = () =>
  `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const presetColors = [
  "#F87171",
  "#FB923C",
  "#FACC15",
  "#A3E635",
  "#34D399",
  "#2DD4BF",
  "#38BDF8",
  "#60A5FA",
  "#818CF8",
  "#A855F7",
  "#D946EF",
  "#FDA4AF",
  "#94A3B8",
  "#64748B",
  "#0F172A",
  "#FFFFFF",
];

const toNumberOrNull = (value: string) => {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export default function ProductCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userStore, getStore } = useAuth();
  const [productType, setProductType] = useState<ProductType>("simple");
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({ variations: {} });
  const [collapsedVariations, setCollapsedVariations] = useState<boolean[]>([
    false,
  ]);
  const [priceInputTexts, setPriceInputTexts] = useState<{
    [variationIndex: number]: {
      sellingPrice?: string;
      deliveryCost?: string;
      wholesalePrice?: string;
      costPrice?: string;
    };
  }>({});



  const storeQuery = useQuery({
    queryKey: ["product-create-store"],
    queryFn: () => getStore(),
    initialData: userStore ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeQuery.data?.store?.id;
  // Category ID removed from Store model
  const storeCurrency = storeQuery.data?.store?.currency || "UZS";

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await api.get<{ units: Unit[] }>("/api/units");
      return response.units ?? [];
    },
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await api.get<{ suppliers: Supplier[] }>(
        "/api/suppliers"
      );
      return response.suppliers ?? [];
    },
    enabled: Boolean(storeId),
  });

  const currenciesQuery = useQuery({
    queryKey: ["currencies", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const response = await api.get<{ currencies: { code: string; symbol: string }[] }>("/api/currencies");
      return response.currencies;
    },
    enabled: Boolean(storeId),
  });

  const currencies = useMemo(() => currenciesQuery.data ?? [], [currenciesQuery.data]);

  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const suppliers = suppliersQuery.data ?? [];

  useEffect(() => {
    const defaultUnitId = units[0]?.id;
    if (!defaultUnitId) {
      return;
    }

    setFormData((prev) => {
      let changed = false;
      const updatedVariations = prev.variations.map((variation) => {
        if (!variation.unitId) {
          changed = true;
          return { ...variation, unitId: defaultUnitId };
        }
        return variation;
      });

      return changed ? { ...prev, variations: updatedVariations } : prev;
    });
  }, [units]);

  const updateFormData = useCallback(
    (
      field: keyof ProductFormData,
      value: string | ProductVariationFormData[]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateVariation = useCallback(
    (index: number, field: keyof ProductVariationFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((variation, i) =>
          i === index ? { ...variation, [field]: value } : variation
        ),
      }));
    },
    []
  );

  const toggleVariationCollapse = (index: number) => {
    setCollapsedVariations((prev) => {
      const newCollapsed = [...prev];
      newCollapsed[index] = !newCollapsed[index];
      return newCollapsed;
    });
  };

  const addVariation = useCallback(() => {
    setCollapsedVariations((prev) => [...prev.map(() => true), false]);
    setFormData((prev) => {
      const defaultUnit = prev.variations[0]?.unitId || units[0]?.id;
      const newVariation = {
        ...createDefaultVariation(),
        unitId: defaultUnit,
      };
      return {
        ...prev,
        variations: [...prev.variations, newVariation],
      };
    });
  }, [units]);

  const removeVariation = useCallback(
    (index: number) => {
      if (formData.variations.length > 1) {
        setFormData((prev) => ({
          ...prev,
          variations: prev.variations.filter((_, i) => i !== index),
        }));
        setCollapsedVariations((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [formData.variations.length]
  );

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = { variations: {} };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = t("products.nameRequired");
      isValid = false;
    }

    if (!formData.productCategoryId) {
      newErrors.productCategoryId = t("products.categoryRequired");
      isValid = false;
    }

    const variationsToValidate =
      productType === "variable"
        ? formData.variations
        : [formData.variations[0]];

    variationsToValidate.forEach((variation, index) => {
      const varErrors: VariationError = {};

      if (productType === "variable" && !variation.name.trim()) {
        varErrors.name = t("products.variationNameRequired");
      }

      if (productType !== "service" && !variation.barcode.trim()) {
        varErrors.barcode = t("products.barcodeRequired");
      }

      const sellingPrice = Number.parseFloat(variation.sellingPrice);
      if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
        varErrors.sellingPrice = t("products.sellingPriceRequired");
      }

      if (productType !== "service" && variation.deliveryCost) {
        const deliveryCost = Number.parseFloat(variation.deliveryCost);
        if (!Number.isFinite(deliveryCost) || deliveryCost < 0) {
          varErrors.deliveryCost = t("products.deliveryCostInvalid");
        }
      }

      if (productType !== "service" && variation.costPrice) {
        const costPrice = Number.parseFloat(variation.costPrice);
        if (!Number.isFinite(costPrice) || costPrice < 0) {
          varErrors.costPrice = t("products.costPriceInvalid");
        }
      }

      if (!variation.unitId) {
        varErrors.unitId = t("products.unitRequired");
      }

      if (Object.keys(varErrors).length > 0) {
        newErrors.variations[index] = varErrors;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, t, productType]);

  const buildProductPayload = useCallback(
    (primaryCategoryId: string): CreateProductPayload => {
      const productImageUrl = formData.imageUrl || "";

      const sourceVariations =
        productType === "variable"
          ? formData.variations
          : [formData.variations[0]];

      const variations = sourceVariations.map((variation) => {
        const sellingPrice = toNumberOrNull(variation.sellingPrice) ?? 0;
        const costInput = toNumberOrNull(variation.deliveryCost);
        const costValue = costInput ?? sellingPrice;
        const resolvedCost = costValue > 0 ? costValue : sellingPrice;
        const wholesalePrice = toNumberOrNull(variation.wholesalePrice) ?? 0;
        const costPriceValue = toNumberOrNull(variation.costPrice);
        const initialStock = toNumberOrNull(variation.initialStock) ?? 0;
        const basePrice = resolvedCost || sellingPrice;

        const isService = productType === "service";

        const payload: VariationPayload = {
          name:
            productType === "variable"
              ? variation.name.trim()
              : formData.name.trim(),
          description: variation.description.trim(),
          barcode: variation.barcode.trim(),
          sku: variation.sku.trim(),
          price: basePrice,
          selling_price: sellingPrice,
          wholesale_price: isService ? 0 : wholesalePrice,
          unit_id: variation.unitId,
          supplier_id: isService
            ? undefined
            : variation.supplierId || undefined,
          color: variation.color,
          initial_stock: isService ? 0 : initialStock,
          image_url: variation.imageUrl || "",
        };

        if (costPriceValue !== null && costPriceValue >= 0 && !isService) {
          payload.cost_price = costPriceValue;
        }

        return payload;
      });

      const payload: CreateProductPayload = {
        name: formData.name.trim(),
        category_id: primaryCategoryId,
        product_category_id: formData.productCategoryId || undefined,
        image_url: productImageUrl,
        type: productType,
        variations,
      };

      return payload;
    },
    [formData, productType]
  );

  const createProductMutation = useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      await api.post("/api/products", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["pos-inventory", storeId] }),
      ]);
      toast.success(t("products.productAddedSuccessfully"));
      navigate("/inventory");
    },
    onError: (error: unknown) => {
      console.error("Product creation failed", error);
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("errors.productCreationFailed"));
    },
  });

  const handlePriceInputChange = (
    variationIndex: number,
    field: "sellingPrice" | "deliveryCost" | "wholesalePrice" | "costPrice",
    text: string
  ) => {
    if (text === "") {
      setPriceInputTexts((prev) => ({
        ...prev,
        [variationIndex]: { ...prev[variationIndex], [field]: "" },
      }));
      updateVariation(variationIndex, field, "0");
      return;
    }

    if (/^\d*\.?\d*$/.test(text)) {
      setPriceInputTexts((prev) => ({
        ...prev,
        [variationIndex]: { ...prev[variationIndex], [field]: text },
      }));

      if (!text.endsWith(".")) {
        const numericValue = parseFloat(text) || 0;
        updateVariation(variationIndex, field, numericValue.toString());
      }
    }
  };

  const handlePriceInputBlur = (
    variationIndex: number,
    field: "sellingPrice" | "deliveryCost" | "wholesalePrice" | "costPrice"
  ) => {
    const currentText = priceInputTexts[variationIndex]?.[field];
    if (currentText !== undefined) {
      const numericValue = parseFloat(currentText) || 0;
      updateVariation(variationIndex, field, numericValue.toString());
      setPriceInputTexts((prev) => {
        const updated = { ...prev };
        if (updated[variationIndex]) {
          delete updated[variationIndex][field];
        }
        return updated;
      });
    }
  };

  const handleSubmit = () => {
    if (!storeId) {
      toast.error(t("products.noStoresAvailable"));
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Pass empty string for category_id since it's being removed
    const payload = buildProductPayload(formData.productCategoryId);
    createProductMutation.mutate(payload);
  };

  const isSubmitting = createProductMutation.isPending;

  const renderVariation = (
    variation: ProductVariationFormData,
    index: number
  ) => {
    const variationErrors = errors.variations?.[index] || {};
    const isCollapsed = collapsedVariations[index];
    const priceText = priceInputTexts[index] || {};
    const normalizedVariationColor = variation.color?.toLowerCase() || "";

    return (
      <div
        key={index}
        className="border border-border rounded-xl bg-card shadow-sm"
      >
        {/* Variation Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-muted/40 ">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-base flex-shrink-0 shadow-sm">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {variation.name || `${t("products.variation")} ${index + 1}`}
              </h3>
              {variation.barcode && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {variation.barcode}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleVariationCollapse(index)}
              className="h-10 w-10"
              type="button"
            >
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
            {formData.variations.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVariation(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10"
                type="button"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Variation Content */}
        {!isCollapsed && (
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.variationName")}{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={variation.name}
                      onChange={(e) =>
                        updateVariation(index, "name", e.target.value)
                      }
                      placeholder={t("products.enterVariationName")}
                      className={cn(
                        "h-11",
                        variationErrors.name && "border-destructive"
                      )}
                    />
                    {variationErrors.name && (
                      <p className="text-sm text-destructive mt-1.5">
                        {variationErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.description")}
                    </label>
                    <Textarea
                      value={variation.description}
                      onChange={(e) =>
                        updateVariation(index, "description", e.target.value)
                      }
                      placeholder={t("products.description")}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="text-sm font-medium text-foreground">
                        {t("products.barcode")}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={variation.barcode}
                          onChange={(e) =>
                            updateVariation(index, "barcode", e.target.value)
                          }
                          placeholder="1234567890123"
                          className={cn(
                            "h-11 flex-1",
                            variationErrors.barcode && "border-destructive"
                          )}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 h-11 w-11"
                          type="button"
                          onClick={() =>
                            updateVariation(
                              index,
                              "barcode",
                              generateRandomEanBarcode()
                            )
                          }
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">
                            {t("products.generateBarcode")}
                          </span>
                        </Button>
                      </div>
                      {variationErrors.barcode && (
                        <p className="text-sm text-destructive mt-1.5">
                          {variationErrors.barcode}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-medium text-foreground">
                        SKU
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={variation.sku}
                          onChange={(e) =>
                            updateVariation(index, "sku", e.target.value)
                          }
                          placeholder="SKU-001"
                          className="h-11 flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 h-11 w-11"
                          type="button"
                          onClick={() =>
                            updateVariation(index, "sku", generateRandomSku())
                          }
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">
                            {t("products.generateSku")}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.sellingPrice")}{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg">
                        {storeCurrency}
                      </span>
                      <CurrencyInput
                        value={
                          priceText.sellingPrice !== undefined
                            ? priceText.sellingPrice
                            : variation.sellingPrice === "0"
                              ? ""
                              : variation.sellingPrice
                        }
                        onValueChange={(values) =>
                          handlePriceInputChange(
                            index,
                            "sellingPrice",
                            values.value
                          )
                        }
                        onBlur={() =>
                          handlePriceInputBlur(index, "sellingPrice")
                        }
                        placeholder="0.00"
                        className={cn(
                          "rounded-l-none h-11",
                          variationErrors.sellingPrice && "border-destructive"
                        )}
                      />
                    </div>
                    {variationErrors.sellingPrice && (
                      <p className="text-sm text-destructive mt-1.5">
                        {variationErrors.sellingPrice}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.deliveryCost")}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="flex">
                      <select
                        className="inline-flex items-center px-2 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg appearance-none cursor-pointer hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-ring"
                        value={variation.deliveryCostCurrency || storeCurrency}
                        onChange={(e) => updateVariation(index, "deliveryCostCurrency", e.target.value)}
                        style={{ minWidth: "60px", textAlign: "center" }}
                      >
                        <option value={storeCurrency}>{storeCurrency}</option>
                        {currencies.filter((c) => c.code !== storeCurrency).map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                      <CurrencyInput
                        value={
                          priceText.deliveryCost !== undefined
                            ? priceText.deliveryCost
                            : variation.deliveryCost === "0"
                              ? ""
                              : variation.deliveryCost
                        }
                        onValueChange={(values) =>
                          handlePriceInputChange(
                            index,
                            "deliveryCost",
                            values.value
                          )
                        }
                        onBlur={() =>
                          handlePriceInputBlur(index, "deliveryCost")
                        }
                        placeholder="0.00"
                        className={cn(
                          "rounded-l-none h-11",
                          variationErrors.deliveryCost && "border-destructive"
                        )}
                      />
                    </div>
                    {variationErrors.deliveryCost && (
                      <p className="text-sm text-destructive mt-1.5">
                        {variationErrors.deliveryCost}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.wholesalePrice")}
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg">
                        {storeCurrency}
                      </span>
                      <CurrencyInput
                        value={
                          priceText.wholesalePrice !== undefined
                            ? priceText.wholesalePrice
                            : variation.wholesalePrice === "0"
                              ? ""
                              : variation.wholesalePrice
                        }
                        onValueChange={(values) =>
                          handlePriceInputChange(
                            index,
                            "wholesalePrice",
                            values.value
                          )
                        }
                        onBlur={() =>
                          handlePriceInputBlur(index, "wholesalePrice")
                        }
                        placeholder="0.00"
                        className="rounded-l-none h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.costPrice")}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg">
                        {storeCurrency}
                      </span>
                      <CurrencyInput
                        value={
                          priceText.costPrice !== undefined
                            ? priceText.costPrice
                            : variation.costPrice === "0"
                              ? ""
                              : variation.costPrice
                        }
                        onValueChange={(values) =>
                          handlePriceInputChange(
                            index,
                            "costPrice",
                            values.value
                          )
                        }
                        onBlur={() => handlePriceInputBlur(index, "costPrice")}
                        placeholder="0.00"
                        className={cn(
                          "rounded-l-none h-11",
                          variationErrors.costPrice && "border-destructive"
                        )}
                      />
                    </div>
                    {variationErrors.costPrice && (
                      <p className="text-sm text-destructive mt-1.5">
                        {variationErrors.costPrice}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Image */}
                <div className="space-y-5">
                  <ImageUpload
                    currentImage={variation.imageUrl}
                    onImageSelect={(url) =>
                      updateVariation(index, "imageUrl", url)
                    }
                  />
                </div>

                {/* Inventory */}
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.unitOfMeasurement")}
                      <span className="text-destructive">*</span>
                    </label>
                    <UnitTagSelector
                      units={units}
                      selectedUnitValue={variation.unitId}
                      onUnitValueSelect={(unitId) =>
                        updateVariation(index, "unitId", unitId)
                      }
                      error={variationErrors.unitId}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.initialStock")}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={variation.initialStock}
                      onChange={(e) =>
                        updateVariation(index, "initialStock", e.target.value)
                      }
                      placeholder="0"
                      type="number"
                      min={0}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.supplier")}
                    </label>
                    <SupplierTagSelector
                      suppliers={suppliers}
                      selectedSupplierId={variation.supplierId}
                      onSupplierSelect={(supplierId) =>
                        updateVariation(index, "supplierId", supplierId)
                      }
                    />
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      {t("products.productColor")}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {t("products.selectColor")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {presetColors.map((color) => {
                      const isSelected =
                        normalizedVariationColor === color.toLowerCase();
                      return (
                        <button
                          key={color}
                          type="button"
                          aria-label={`${t("products.selectColor")}: ${color}`}
                          aria-pressed={isSelected}
                          onClick={() => updateVariation(index, "color", color)}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isSelected
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border/40 hover:border-border"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {isSelected && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 shadow-sm">
                              <Check className="h-3.5 w-3.5 text-foreground" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      value={variation.color}
                      onChange={(e) =>
                        updateVariation(
                          index,
                          "color",
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="#FFFFFF"
                      className="h-11 font-mono text-sm"
                      maxLength={7}
                    />
                    <div
                      className="h-11 w-11 rounded-full border border-border shadow-inner"
                      style={{ backgroundColor: variation.color || "#FFFFFF" }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderSingleProductFields = () => {
    const index = 0;
    const variation = formData.variations[0];
    const variationErrors = errors.variations?.[index] || {};
    const priceText = priceInputTexts[index] || {};
    const isService = productType === "service";

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Pricing */}
          <div className="space-y-5">
            {/* Selling Price */}
            <div className="space-y-2.5">
              <label className="text-sm font-medium text-foreground">
                {t("products.sellingPrice")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg">
                  {storeCurrency}
                </span>
                <CurrencyInput
                  value={
                    priceText.sellingPrice !== undefined
                      ? priceText.sellingPrice
                      : variation.sellingPrice === "0"
                        ? ""
                        : variation.sellingPrice
                  }
                  onValueChange={(values) =>
                    handlePriceInputChange(index, "sellingPrice", values.value)
                  }
                  onBlur={() => handlePriceInputBlur(index, "sellingPrice")}
                  placeholder="0.00"
                  className={cn(
                    "rounded-l-none h-11",
                    variationErrors.sellingPrice && "border-destructive"
                  )}
                />
              </div>
              {variationErrors.sellingPrice && (
                <p className="text-sm text-destructive mt-1.5">
                  {variationErrors.sellingPrice}
                </p>
              )}
            </div>

            {/* Supplier Price - Hide for Service */}
            {!isService && (
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  {t("products.deliveryCost")}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <div className="flex">
                  <select
                    className="inline-flex items-center px-2 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg appearance-none cursor-pointer hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-ring"
                    value={variation.deliveryCostCurrency || storeCurrency}
                    onChange={(e) => updateVariation(index, "deliveryCostCurrency", e.target.value)}
                    style={{ minWidth: "60px", textAlign: "center" }}
                  >
                    <option value={storeCurrency}>{storeCurrency}</option>
                    {currencies.filter((c) => c.code !== storeCurrency).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <CurrencyInput
                    value={
                      priceText.deliveryCost !== undefined
                        ? priceText.deliveryCost
                        : variation.deliveryCost === "0"
                          ? ""
                          : variation.deliveryCost
                    }
                    onValueChange={(values) =>
                      handlePriceInputChange(
                        index,
                        "deliveryCost",
                        values.value
                      )
                    }
                    onBlur={() => handlePriceInputBlur(index, "deliveryCost")}
                    placeholder="0.00"
                    className={cn(
                      "rounded-l-none h-11",
                      variationErrors.deliveryCost && "border-destructive"
                    )}
                  />
                </div>
                {variationErrors.deliveryCost && (
                  <p className="text-sm text-destructive mt-1.5">
                    {variationErrors.deliveryCost}
                  </p>
                )}
              </div>
            )}

            {/* Wholesale Price - Hide for Service */}
            {!isService && (
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  {t("products.wholesalePrice")}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg">
                    {storeCurrency}
                  </span>
                  <CurrencyInput
                    value={
                      priceText.wholesalePrice !== undefined
                        ? priceText.wholesalePrice
                        : variation.wholesalePrice === "0"
                          ? ""
                          : variation.wholesalePrice
                    }
                    onValueChange={(values) =>
                      handlePriceInputChange(
                        index,
                        "wholesalePrice",
                        values.value
                      )
                    }
                    onBlur={() => handlePriceInputBlur(index, "wholesalePrice")}
                    placeholder="0.00"
                    className="rounded-l-none h-11"
                  />
                </div>
              </div>
            )}

            {/* Cost Price - Hide for Service */}
            {!isService && (
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  {t("products.costPrice")}
                </label>
                <span className="text-destructive">*</span>
                <div className="flex">
                  <span className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg">
                    {storeCurrency}
                  </span>
                  <CurrencyInput
                    value={
                      priceText.costPrice !== undefined
                        ? priceText.costPrice
                        : variation.costPrice === "0"
                          ? ""
                          : variation.costPrice
                    }
                    onValueChange={(values) =>
                      handlePriceInputChange(index, "costPrice", values.value)
                    }
                    onBlur={() => handlePriceInputBlur(index, "costPrice")}
                    placeholder="0.00"
                    className={cn(
                      "rounded-l-none h-11",
                      variationErrors.costPrice && "border-destructive"
                    )}
                  />
                </div>
                {variationErrors.costPrice && (
                  <p className="text-sm text-destructive mt-1.5">
                    {variationErrors.costPrice}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Barcode and SKU */}
          <div className="grid grid-cols-2 gap-4">
            {/* Barcode - Hide for Service */}
            {!isService && (
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  {t("products.barcode")}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={variation.barcode}
                    onChange={(e) =>
                      updateVariation(index, "barcode", e.target.value)
                    }
                    placeholder="1234567890123"
                    className={cn(
                      "h-11 flex-1",
                      variationErrors.barcode && "border-destructive"
                    )}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-11 w-11"
                    type="button"
                    onClick={() =>
                      updateVariation(
                        index,
                        "barcode",
                        generateRandomEanBarcode()
                      )
                    }
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                {variationErrors.barcode && (
                  <p className="text-sm text-destructive mt-1.5">
                    {variationErrors.barcode}
                  </p>
                )}
              </div>
            )}

            <div className={cn("space-y-2.5", isService && "col-span-2")}>
              <label className="text-sm font-medium text-foreground">SKU</label>
              <div className="flex gap-2">
                <Input
                  value={variation.sku}
                  onChange={(e) =>
                    updateVariation(index, "sku", e.target.value)
                  }
                  placeholder="SKU-001"
                  className="h-11 flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-11 w-11"
                  type="button"
                  onClick={() =>
                    updateVariation(index, "sku", generateRandomSku())
                  }
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Unit */}
          <div className="space-y-2.5">
            <label className="text-sm font-medium text-foreground">
              {t("products.unitOfMeasurement")}{" "}
              <span className="text-destructive">*</span>
            </label>
            <UnitTagSelector
              units={units}
              selectedUnitValue={variation.unitId}
              onUnitValueSelect={(unitId) =>
                updateVariation(index, "unitId", unitId)
              }
              error={variationErrors.unitId}
            />
          </div>

          {/* Stock - Hide for Service */}
          {!isService && (
            <div className="space-y-2.5">
              <label className="text-sm font-medium text-foreground">
                {t("products.initialStock")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                value={variation.initialStock}
                onChange={(e) =>
                  updateVariation(index, "initialStock", e.target.value)
                }
                placeholder="0"
                type="number"
                min={0}
                className="h-11"
              />
            </div>
          )}

          {/* Supplier - Hide for Service */}
          {!isService && (
            <div className="space-y-2.5">
              <label className="text-sm font-medium text-foreground">
                {t("products.supplier")}
              </label>
              <SupplierTagSelector
                suppliers={suppliers}
                selectedSupplierId={variation.supplierId}
                onSupplierSelect={(supplierId) =>
                  updateVariation(index, "supplierId", supplierId)
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const HeaderContent = (
    <div className="bg-background w-full">
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-foreground text-3xl sm:text-4xl">
              {t("products.addProduct")}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("products.addNewProductDescription")}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {productType === "variable" && (
              <Button
                onClick={addVariation}
                variant="outline"
                size="lg"
                type="button"
                className="h-11 px-5"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("products.addVariation")}
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
              type="button"
              className="h-11 px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                  {t("common.loading")}
                </>
              ) : (
                t("products.addProduct")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      {HeaderContent}

      <div className="container mx-auto py-10 px-4 sm:px-6 max-w-7xl space-y-10">
        {/* Product Type Selection */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("products.productType")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("products.selectProductTypeDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setProductType("simple")}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all gap-3",
                productType === "simple"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <Box className="w-8 h-8" />
              <div className="text-center">
                <div className="font-semibold">{t("products.type.simple")}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("products.type.simpleDescription")}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProductType("variable")}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all gap-3",
                productType === "variable"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <Layers className="w-8 h-8" />
              <div className="text-center">
                <div className="font-semibold">
                  {t("products.type.variable")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("products.type.variableDescription")}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProductType("service")}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all gap-3",
                productType === "service"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <Zap className="w-8 h-8" />
              <div className="text-center">
                <div className="font-semibold">
                  {t("products.type.service")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("products.type.serviceDescription")}
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Product Information Section */}
        <section className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mt-2">
              {t("products.enterBasicProductInformation")}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Details - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">
                    {t("products.productName")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder={t("products.enterProductName")}
                    className={cn("h-11", errors.name && "border-destructive")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1.5">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">
                    {t("products.description")}
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    placeholder={t("products.description")}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">
                    {t("products.productCategory")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <ProductCategoryTagSelector
                    selectedCategoryId={formData.productCategoryId}
                    onCategorySelect={(categoryId) =>
                      updateFormData("productCategoryId", categoryId)
                    }
                    error={errors.productCategoryId}
                  />
                </div>
              </div>
              {/* Product Image - 1 column */}
              <div className="lg:col-span-1">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-foreground">
                    {t("products.productImage")}
                  </label>
                  <ImageUpload
                    currentImage={formData.imageUrl}
                    onImageSelect={(url) => updateFormData("imageUrl", url)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Variations Section */}
        <section className="space-y-6">
          {productType === "variable" ? (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("products.variations")}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("products.manageProductVariations")}
                </p>
              </div>
              <div className="space-y-6">
                {formData.variations.map((variation, index) =>
                  renderVariation(variation, index)
                )}
              </div>
            </>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              {renderSingleProductFields()}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
