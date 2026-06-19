import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    Plus,
    X,
    ChevronDown,
    ChevronUp,
    RefreshCw,
} from "lucide-react";
import { cn, parseApiError } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ProductCategoryTagSelector from "@/components/ui/product-category-tag-selector";
import UnitTagSelector from "@/components/ui/unit-tag-selector";
import SupplierTagSelector from "@/components/ui/supplier-tag-selector";
import ImageUpload from "@/components/ui/image-upload";

interface ProductVariationFormData {
    id?: string;
    name: string;
    description: string;
    barcode: string;
    sku: string;
    sellingPrice: string;
    deliveryCost: string;
    unitCost: string;
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
    unitCost?: string;
    costPrice?: string;
    unitId?: string;
}

interface FormErrors {
    name?: string;
    productCategoryId?: string;
    variations: { [key: number]: VariationError };
}

type UnitOption = {
    id: string;
    name: string;
    category_id?: string | null;
};

type SupplierOption = {
    id: string;
    name: string;
    contact?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    store_id?: string | null;
    created_at?: string | Date | null;
    updated_at?: string | Date | null;
};

type ProductInventoryApi = {
    quantity_in_stock: number;
};

type VariationApi = {
    id: string;
    name: string | null;
    description?: string | null;
    barcode?: string | null;
    sku?: string | null;
    selling_price?: number | string | null;
    delivery_cost?: number | string | null;
    price?: number | string | null;
    unit_id: string;
    supplier_id?: string | null;
    inventory?: ProductInventoryApi[];
    color?: string | null;
    image_url?: string | null;
};

type ProductWithRelations = {
    id: string;
    name: string;
    description?: string | null;
    product_category_id?: string | null;
    image_url?: string | null;
    product_variations: VariationApi[];
};


type VariationPayload = {
    id?: string;
    name: string;
    description: string;
    barcode: string;
    sku: string;
    price: number;
    selling_price: number;
    delivery_cost?: number;
    cost_price?: number;
    unit_id: string;
    supplier_id?: string;
    color: string;
    initial_stock: number;
    image_url: string;
};

type UpdateProductPayload = {
    name: string;
    category_id: string;
    product_category_id?: string;
    image_url: string;
    variations: VariationPayload[];
};

const createDefaultVariation = (): ProductVariationFormData => ({
    name: "",
    description: "",
    barcode: "",
    sku: "",
    sellingPrice: "",
    deliveryCost: "",
    unitCost: "",
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

const LOG_TAG = "[ProductEdit]";

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

export default function ProductEditPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const queryClient = useQueryClient();
    const { userStore, getStore } = useAuth();
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({ variations: {} });
    const [collapsedVariations, setCollapsedVariations] = useState<boolean[]>([
        false,
    ]);
    const [priceInputTexts, setPriceInputTexts] = useState<{
        [variationIndex: number]: {
            sellingPrice?: string;
            deliveryCost?: string;
            unitCost?: string;
            costPrice?: string;
        };
    }>({});

    const [isHeaderFixed, setIsHeaderFixed] = useState(false);

    useEffect(() => {
        console.info(`${LOG_TAG} mount`, { productId, storeId: userStore?.store?.id });
        return () => console.info(`${LOG_TAG} unmount`, { productId });
    }, [productId, userStore?.store?.id]);

    // Fixed scroll detection using Motion hooks
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsHeaderFixed(latest > 10);
    });

    const storeQuery = useQuery({
        queryKey: ["product-edit-store"],
        queryFn: () => getStore(),
        initialData: userStore ?? undefined,
        staleTime: 1000 * 60 * 5,
    });

    const storeId = storeQuery.data?.store?.id;
    const storeCurrency = storeQuery.data?.store?.currency || "UZS";

    const unitsQuery = useQuery({
        queryKey: ["units"],
        queryFn: async () => {
            const response = await api.get<{ units: UnitOption[] }>("/api/units");
            return response.units ?? [];
        },
    });

    const suppliersQuery = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const response = await api.get<{ suppliers: SupplierOption[] }>(
                "/api/suppliers"
            );
            return response.suppliers ?? [];
        },
        enabled: Boolean(storeId),
    });

    const productQuery = useQuery({
        queryKey: ["product", productId],
        queryFn: async () => {
            const response = await api.get<{ product: ProductWithRelations }>(
                `/api/products/${productId}`
            );
            return response.product;
        },
        enabled: !!productId,
    });

    const units = useMemo<UnitOption[]>(() => unitsQuery.data ?? [], [unitsQuery.data]);
    const suppliers = useMemo<SupplierOption[]>(() => suppliersQuery.data ?? [], [suppliersQuery.data]);

    // Normalize for UI components that expect non-null legacy fields
    const normalizedUnits = useMemo(
        () =>
            units.map((u) => ({
                ...u,
                category_id: (u as { category_id?: string | null }).category_id ?? "",
            })),
        [units]
    );

    const normalizedSuppliers = useMemo(
        () =>
            suppliers.map((s) => ({
                ...s,
                contact: s.contact ?? null,
                phone: s.phone ?? null,
                email: s.email ?? null,
                address: s.address ?? null,
                notes: s.notes ?? null,
                store_id: s.store_id ?? "",
                created_at: String(s.created_at ?? ""),
                updated_at: String(s.updated_at ?? ""),
              })),
        [suppliers]
    );

    useEffect(() => {
        if (productQuery.data) {
            const product = productQuery.data;
            console.debug(`${LOG_TAG} product loaded`, {
                productId: product.id,
                variations: product.product_variations?.length ?? 0,
                hasImage: Boolean(product.image_url),
            });
            setFormData({
                name: product.name,
                description: product.description || "",
                productCategoryId: product.product_category_id || "",
                imageUrl: product.image_url || "",
                variations: product.product_variations.map((v: VariationApi) => ({
                    id: v.id,
                    name: v.name,
                    description: v.description || "",
                    barcode: v.barcode || "",
                    sku: v.sku || "",
                    sellingPrice: v.selling_price?.toString() || "",
                    deliveryCost: (v.delivery_cost)?.toString() || "",
                    unitCost: v.price?.toString() || "",
                    costPrice: v.price?.toString() || "",
                    unitId: v.unit_id,
                    supplierId: v.supplier_id || "",
                    initialStock: v.inventory?.[0]?.quantity_in_stock?.toString() || "0",
                    color: v.color || "#FFFFFF",
                    imageUrl: v.image_url || "",
                })),
            });
            setCollapsedVariations(product.product_variations.map(() => true));
        }
    }, [productQuery.data]);

    useEffect(() => {
        if (productQuery.error) {
            console.error(`${LOG_TAG} product query failed`, productQuery.error);
        }
    }, [productQuery.error]);

    useEffect(() => {
        if (unitsQuery.data) {
            console.debug(`${LOG_TAG} units loaded`, { count: unitsQuery.data.length });
        }
    }, [unitsQuery.data]);

    useEffect(() => {
        if (unitsQuery.error) {
            console.error(`${LOG_TAG} units query failed`, unitsQuery.error);
        }
    }, [unitsQuery.error]);

    useEffect(() => {
        if (suppliersQuery.data) {
            console.debug(`${LOG_TAG} suppliers loaded`, { count: suppliersQuery.data.length });
        }
    }, [suppliersQuery.data]);

    useEffect(() => {
        if (suppliersQuery.error) {
            console.error(`${LOG_TAG} suppliers query failed`, suppliersQuery.error);
        }
    }, [suppliersQuery.error]);

    const updateFormData = useCallback(
        (
            field: keyof ProductFormData,
            value: string | ProductVariationFormData[]
        ) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            console.debug(`${LOG_TAG} form change`, { field, value });
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
        console.debug(`${LOG_TAG} toggle variation`, {
            index,
            collapsed: collapsedVariations[index],
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
        console.info(`${LOG_TAG} add variation`);
    }, [units]);

    const removeVariation = useCallback(
        (index: number) => {
            if (formData.variations.length > 1) {
                setFormData((prev) => ({
                    ...prev,
                    variations: prev.variations.filter((_, i) => i !== index),
                }));
                setCollapsedVariations((prev) => prev.filter((_, i) => i !== index));
                console.info(`${LOG_TAG} remove variation`, { index });
            }
        },
        [formData.variations.length]
    );

    const validateForm = useCallback(() => {
        console.debug(`${LOG_TAG} validate form start`, {
            variationCount: formData.variations.length,
        });
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

        formData.variations.forEach((variation, index) => {
            const varErrors: VariationError = {};

            if (!variation.name.trim()) {
                varErrors.name = t("products.variationNameRequired");
            }

            if (!variation.barcode.trim()) {
                varErrors.barcode = t("products.barcodeRequired");
            }

            const sellingPrice = Number.parseFloat(variation.sellingPrice);
            if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
                varErrors.sellingPrice = t("products.sellingPriceRequired");
            }

            if (variation.deliveryCost) {
                const deliveryCost = Number.parseFloat(variation.deliveryCost);
                if (!Number.isFinite(deliveryCost) || deliveryCost < 0) {
                    varErrors.deliveryCost = t("products.deliveryCostInvalid");
                }
            }

            const unitCost = Number.parseFloat(variation.unitCost);
            if (!Number.isFinite(unitCost) || unitCost <= 0) {
                varErrors.unitCost = t("products.costPriceInvalid");
            }

            if (variation.costPrice) {
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
        if (!isValid) {
            console.warn(`${LOG_TAG} validation failed`, { errors: newErrors });
        } else {
            console.debug(`${LOG_TAG} validation passed`);
        }
        return isValid;
    }, [formData, t]);

    const buildProductPayload = useCallback(
        (primaryCategoryId: string): UpdateProductPayload => {
            const productImageUrl = formData.imageUrl || "";

            const variations = formData.variations.map((variation) => {
                const price = toNumberOrNull(variation.unitCost) ?? 0;
                const sellingPrice = toNumberOrNull(variation.sellingPrice) ?? 0;
                const deliveryCost = toNumberOrNull(variation.deliveryCost);
                const costPrice = toNumberOrNull(variation.costPrice);
                const initialStock = toNumberOrNull(variation.initialStock) ?? 0;

                const payload: VariationPayload = {
                    id: variation.id,
                    name: variation.name.trim() || formData.name.trim(),
                    description: variation.description.trim(),
                    barcode: variation.barcode.trim(),
                    sku: variation.sku.trim(),
                    price: price,
                    selling_price: sellingPrice,
                    delivery_cost: deliveryCost !== null && deliveryCost >= 0 ? deliveryCost : undefined,
                    cost_price: costPrice !== null && costPrice >= 0 ? costPrice : undefined,
                    unit_id: variation.unitId,
                    supplier_id: variation.supplierId || undefined,
                    color: variation.color,
                    initial_stock: initialStock,
                    image_url: variation.imageUrl || "",
                };

                return payload;
            });

            return {
                name: formData.name.trim(),
                category_id: primaryCategoryId,
                product_category_id: formData.productCategoryId || undefined,
                image_url: productImageUrl,
                variations,
            };
        },
        [formData]
    );

    const updateProductMutation = useMutation({
        mutationFn: async (payload: UpdateProductPayload) => {
            console.info(`${LOG_TAG} submit update`, {
                productId,
                variations: payload.variations.length,
            });
            await api.put(`/api/products/${productId}`, payload);
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["products", storeId] }),
                queryClient.invalidateQueries({ queryKey: ["product", productId] }),
                queryClient.invalidateQueries({ queryKey: ["inventory"] }),
                queryClient.invalidateQueries({ queryKey: ["pos-inventory", storeId] }),
            ]);
            toast.success(t("products.productUpdatedSuccessfully", { defaultValue: "Product updated successfully" }));
            console.info(`${LOG_TAG} update success`, { productId });
            navigate("/inventory");
        },
        onError: (error: unknown) => {
            console.error(`${LOG_TAG} update failed`, error);
            const parsedError = parseApiError(error);
            toast.error(parsedError.message || t("errors.productUpdateFailed", { defaultValue: "Failed to update product" }));
        },
    });

    const handlePriceInputChange = (
        variationIndex: number,
        field: "sellingPrice" | "deliveryCost" | "unitCost" | "costPrice",
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
        field: "sellingPrice" | "deliveryCost" | "unitCost" | "costPrice"
    ) => {
        const currentText = priceInputTexts[variationIndex][field];
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
        const payload = buildProductPayload("");
        updateProductMutation.mutate(payload);
    };

    const isSubmitting = updateProductMutation.isPending;

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
                                        </label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg">
                                                {storeCurrency}
                                            </span>
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
                                            {t("products.costPrice", { defaultValue: "Себестоимость" })}
                                            <span className="text-destructive">*</span>
                                        </label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg">
                                                {storeCurrency}
                                            </span>
                                            <CurrencyInput
                                                value={
                                                    priceText.unitCost !== undefined
                                                        ? priceText.unitCost
                                                        : variation.unitCost === "0"
                                                            ? ""
                                                            : variation.unitCost
                                                }
                                                onValueChange={(values) =>
                                                    handlePriceInputChange(
                                                        index,
                                                        "unitCost",
                                                        values.value
                                                    )
                                                }
                                                onBlur={() =>
                                                    handlePriceInputBlur(index, "unitCost")
                                                }
                                                placeholder="0.00"
                                                className={cn(
                                                    "rounded-l-none h-11",
                                                    variationErrors.unitCost && "border-destructive"
                                                )}
                                            />
                                        </div>
                                        {variationErrors.unitCost && (
                                            <p className="text-sm text-destructive mt-1.5">
                                                {variationErrors.unitCost}
                                            </p>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-8">
                                {/* Inventory & Attributes */}
                                <div className="space-y-5">
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-foreground">
                                            {t("products.unit")} <span className="text-destructive">*</span>
                                        </label>
                                        <UnitTagSelector
                                            selectedUnitValue={variation.unitId}
                                            onUnitValueSelect={(value) => updateVariation(index, "unitId", value)}
                                            units={normalizedUnits}
                                            error={variationErrors.unitId}
                                        />
                                        {variationErrors.unitId && (
                                            <p className="text-sm text-destructive mt-1.5">
                                                {variationErrors.unitId}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-foreground">
                                            {t("products.supplier")}
                                        </label>
                                        <SupplierTagSelector
                                            selectedSupplierId={variation.supplierId}
                                            onSupplierSelect={(value) =>
                                                updateVariation(index, "supplierId", value)
                                            }
                                            suppliers={normalizedSuppliers}
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-foreground">
                                            {t("products.initialStock")}
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={variation.initialStock}
                                            onChange={(e) =>
                                                updateVariation(index, "initialStock", e.target.value)
                                            }
                                            placeholder="0"
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-foreground">
                                            {t("products.color")}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {presetColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => updateVariation(index, "color", color)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full border-2 transition-all",
                                                        normalizedVariationColor === color.toLowerCase()
                                                            ? "border-primary scale-110"
                                                            : "border-transparent hover:scale-105"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                    aria-label={`Select color ${color}`}
                                                />
                                            ))}
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-input cursor-pointer hover:scale-105 transition-transform">
                                                <input
                                                    type="color"
                                                    value={variation.color}
                                                    onChange={(e) =>
                                                        updateVariation(index, "color", e.target.value)
                                                    }
                                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 border-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-2.5">
                                    <label className="text-sm font-medium text-foreground">
                                        {t("products.image")}
                                    </label>
                                    <ImageUpload
                                        currentImage={variation.imageUrl}
                                        onImageSelect={(url) => updateVariation(index, "imageUrl", url)}
                                        className="aspect-square w-full max-w-[200px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <motion.header
                className={cn(
                    "sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 transition-all md:px-6",
                    isHeaderFixed && "shadow-sm"
                )}
                initial={false}
                animate={{
                    backgroundColor: isHeaderFixed
                        ? "hsl(var(--background))"
                        : "transparent",
                }}
            >
                <div className="flex items-center gap-4">

                    <h1 className="text-lg font-semibold md:text-xl">
                        {t("products.editProduct", { defaultValue: "Edit Product" })}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/inventory")}
                        disabled={isSubmitting}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                {t("common.saving")}
                            </>
                        ) : (
                            t("common.save")
                        )}
                    </Button>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="mx-auto max-w-5xl space-y-8">
                    {/* Product Details Card */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
                        <h2 className="mb-6 text-lg font-semibold">
                            {t("products.basicInfo")}
                        </h2>
                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("products.productName")}{" "}
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => updateFormData("name", e.target.value)}
                                        placeholder={t("products.enterProductName")}
                                        className={cn(errors.name && "border-destructive")}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("products.category")}{" "}
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <ProductCategoryTagSelector
                                        selectedCategoryId={formData.productCategoryId}
                                        onCategorySelect={(value) =>
                                            updateFormData("productCategoryId", value)
                                        }
                                        error={errors.productCategoryId}
                                    />
                                    {errors.productCategoryId && (
                                        <p className="text-sm text-destructive">
                                            {errors.productCategoryId}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("products.description")}
                                    </label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            updateFormData("description", e.target.value)
                                        }
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t("products.productImage")}
                                </label>
                                <ImageUpload
                                    currentImage={formData.imageUrl}
                                    onImageSelect={(url) => updateFormData("imageUrl", url)}
                                    className="aspect-square w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Variations Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {t("products.variations")}
                            </h2>
                            <Button onClick={addVariation} variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                {t("products.addVariation")}
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {formData.variations.map((variation, index) =>
                                renderVariation(variation, index)
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
