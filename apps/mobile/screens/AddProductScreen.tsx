import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  X,
  Package,
  BarChart3,
  Check,
  AlertCircle,
  ScanLine,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Box,
  Layers,
  Zap,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import ImageUpload from "../src/components/ImageUpload";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useAuthContext } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Store, Unit } from "@/types";
import { api } from "../lib/api";
import CurrencyInput from "react-native-currency-input";
import { z } from "zod";

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

import i18n from "@/lib/i18n";
import { log } from "@/debugging/log";
import ColorPicker from "../src/components/ColorPicker";
import ProductCategoryTagSelector from "../src/components/ProductCategoryTagSelector";
import UnitTagSelector from "../src/components/UnitTagSelector";
import SupplierTagSelector from "../src/components/SupplierTagSelector";

type ProductType = "simple" | "variable" | "service";

type ProductFormData = {
  name: string;
  category_id?: string | null;
  product_category_id: string;
  image_url: string;
  type: ProductType;
  variations: ProductVariationFormData[];
};

type ProductVariationFormData = {
  name: string;
  description: string;
  barcode: string | null;
  sku: string;
  price: number;
  selling_price: number;
  delivery_cost: number;
  unit_id: string;
  image_url?: string;
  color: string;
  initial_stock: number;
  supplier_id: string;
};

type ProductVariationApiPayload = {
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
  category_id?: string;
  product_category_id?: string;
  image_url: string;
  type: ProductType;
  variations: ProductVariationApiPayload[];
};

const defaultVariation: ProductVariationFormData = {
  name: "",
  description: "",
  barcode: "",
  sku: "",
  price: 0,
  selling_price: 0,
  delivery_cost: 0,
  unit_id: "",
  image_url: undefined,
  color: "#FFFFFF",
  initial_stock: 0,
  supplier_id: "",
};

const initialFormData: ProductFormData = {
  name: "",
  category_id: undefined,
  product_category_id: "",
  image_url: "",
  type: "simple",
  variations: [{ ...defaultVariation }],
};

type VariationError = {
  name?: string;
  barcode?: string;
  selling_price?: string;
  price?: string;
  unit_id?: string;
};

const initialErrors: {
  name?: string;
  category_id?: string;
  product_category_id?: string;
  variations: { [key: number]: VariationError };
} = {
  name: undefined,
  category_id: undefined,
  product_category_id: undefined,
  variations: {},
};

const BackendIssueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string().optional(),
});

const BackendErrorSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
  details: z.array(BackendIssueSchema).optional(),
});

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [productType, setProductType] = useState<ProductType>("simple");

  const [collapsedVariations, setCollapsedVariations] = useState<boolean[]>([
    false,
  ]);

  const isService = productType === "service";
  const [scannerPermission, requestScannerPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerContext, setScannerContext] = useState<{
    index: number;
    field: "barcode" | "sku";
  } | null>(null);

  const isI18nKey = useCallback((value?: string) => {
    return (
      typeof value === "string" &&
      (value.startsWith("products.") ||
        value.startsWith("errors.") ||
        value.startsWith("common."))
    );
  }, []);

  const getErrorMessage = useCallback(
    (fallbackKey: string, message?: string) => {
      return isI18nKey(message) ? t(message!) : t(fallbackKey);
    },
    [isI18nKey, t]
  );

  const issuesToErrors = useCallback(
    (issues: Array<{ path: Array<string | number>; message?: string }>) => {
      const nextErrors: typeof initialErrors = {
        name: undefined,
        category_id: undefined,
        product_category_id: undefined,
        variations: {},
      };

      const fieldMap: Record<
        string,
        { target: keyof VariationError; fallback: string }
      > = {
        name: { target: "name", fallback: "products.variationNameRequired" },
        barcode: { target: "barcode", fallback: "products.barcodeRequired" },
        selling_price: {
          target: "selling_price",
          fallback: "products.sellingPriceRequired",
        },
        price: { target: "price", fallback: "errors.invalidValue" },
        unit_id: { target: "unit_id", fallback: "products.unitRequired" },
      };

      issues.forEach((issue) => {
        const [root, index, field] = issue.path ?? [];
        if (root === "name") {
          nextErrors.name = getErrorMessage(
            "products.nameRequired",
            issue.message
          );
          return;
        }
        if (root === "category_id" || root === "product_category_id") {
          nextErrors.product_category_id = getErrorMessage(
            "products.productCategoryRequired",
            issue.message
          );
          return;
        }
        if (root !== "variations") return;

        const indexNumber =
          typeof index === "number" ? index : Number(index);
        if (!Number.isFinite(indexNumber)) return;

        const mapping = fieldMap[String(field ?? "")];
        if (!mapping) return;

        if (!nextErrors.variations[indexNumber]) {
          nextErrors.variations[indexNumber] = {};
        }
        nextErrors.variations[indexNumber][mapping.target] = getErrorMessage(
          mapping.fallback,
          issue.message
        );
      });

      return nextErrors;
    },
    [getErrorMessage]
  );

  const parseBackendError = useCallback((message?: string) => {
    if (!message) return null;
    try {
      const parsed = BackendErrorSchema.safeParse(JSON.parse(message));
      return parsed.success ? parsed.data : null;
    } catch (_err) {
      return null;
    }
  }, []);

  const {
    data: store,
    error: storeError,
    isLoading: storeLoading,
  } = useQuery<Store>({
    queryKey: ["stores", user?.id],
    queryFn: async () => {
      log.debug("AddProductScreen", "Fetching user store");
      const res = await api.get<{ data: Store }>("/api/stores/my-store");

      if (!res || !res.data) {
        throw new Error("No store found for current user");
      }
      return res.data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (storeError) {
      log.error("AddProductScreen", "Failed to load store", {
        error: String(storeError),
      });
    }
  }, [storeError]);

  const { data: unitsResponse } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      try {
        const response = await api.get<{ units: Unit[] }>("/api/units");

        return response.units;
      } catch (error) {
        console.error(error);
        throw error; // Re-throw the error for React Query to handle
      }
    },
    enabled: !!user?.id, // Only fetch when user is authenticated
  });

  // Auto-set default unit when units are loaded (matching web behavior)
  useEffect(() => {
    const defaultUnitId = unitsResponse?.[0]?.id;
    if (!defaultUnitId) return;

    setFormData((prev) => {
      let changed = false;
      const updatedVariations = prev.variations.map((variation) => {
        if (!variation.unit_id) {
          changed = true;
          return { ...variation, unit_id: defaultUnitId };
        }
        return variation;
      });

      return changed ? { ...prev, variations: updatedVariations } : prev;
    });
  }, [unitsResponse]);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      try {
        const response = await api.get<{ suppliers: Supplier[] }>(
          "/api/suppliers"
        );
        return response.suppliers;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!store) {
        throw new Error(t("products.noStoresAvailable"));
      }

      let imageUrl = "";

      if (data.image_url) {
        try {
          const uploadFormData = new FormData();
          const localUri = data.image_url;
          const filename = localUri.split("/").pop();
          if (!filename) {
            throw new Error("Filename could not be extracted from the URI.");
          }
          const match = filename.match(/\.([^.]+)$/);
          const type = match ? `image/${match[1]}` : "image";

          uploadFormData.append("file", {
            uri: localUri,
            name: filename,
            type,
          } as unknown as Blob);

          const res = await api.post<{ url: string }>(
            "/api/files/upload",
            uploadFormData
          );
          imageUrl = res.url;
        } catch (uploadError) {
          log.error(
            "AddProductScreen",
            "Image upload failed during product creation",
            { error: String(uploadError) }
          );
          throw new Error(t("errors.imageUploadFailed"));
        }
      }

      // Upload variation images
      const variationsWithUploadedImages: ProductVariationFormData[] =
        await Promise.all(
          data.variations.map(async (variation, index) => {
            if (!variation.image_url) {
              log.debug("AddProductScreen", "Variation has no image", { index });
              return {
                ...variation,
                image_url: "",
              };
            }

            log.debug("AddProductScreen", "Uploading variation image", {
              index,
              hasImage: Boolean(variation.image_url),
              imageUri: variation.image_url?.substring(0, 50),
            });

            try {
              const uploadFormData = new FormData();
              const localUri = variation.image_url;
              const filename = localUri.split("/").pop();
              if (!filename) {
                throw new Error("Filename could not be extracted from the URI.");
              }
              const match = filename.match(/\.([^.]+)$/);
              const type = match ? `image/${match[1]}` : "image";

              uploadFormData.append("file", {
                uri: localUri,
                name: filename,
                type,
              } as unknown as Blob);

              const res = await api.post<{ url: string }>(
                "/api/files/upload",
                uploadFormData
              );

              log.info(
                "AddProductScreen",
                "Variation image uploaded successfully",
                {
                  index,
                  url: res.url?.substring(0, 50),
                }
              );

              return {
                ...variation,
                image_url: res.url,
              };
            } catch (uploadError) {
              log.error("AddProductScreen", "Variation image upload failed", {
                index,
                error: String(uploadError),
                variationName: variation.name,
              });
              // Continue without image if upload fails
              return {
                ...variation,
                image_url: "",
              };
            }
          })
        );

      log.debug("AddProductScreen", "All variation images processed", {
        totalVariations: variationsWithUploadedImages.length,
        withImages: variationsWithUploadedImages.filter((v) => v.image_url)
          .length,
      });

      const normalizedCategoryId =
        data.category_id?.trim() ||
        data.product_category_id?.trim() ||
        undefined;

      const isService = data.type === "service";
      const sourceVariations =
        data.type === "variable"
          ? variationsWithUploadedImages
          : [variationsWithUploadedImages[0]];
      
      // Build variations payload - matches web ProductCreate.tsx logic exactly
      const variations: ProductVariationApiPayload[] = sourceVariations.map(
        (variation) => {
          // Parse numeric values with proper null handling (same as web)
          const sellingPrice = Number.isFinite(variation.selling_price) ? variation.selling_price : 0;
          const costInput = Number.isFinite(variation.delivery_cost) ? variation.delivery_cost : null;
          const costValue = costInput ?? sellingPrice;
          const resolvedCost = costValue > 0 ? costValue : sellingPrice;
          const costPriceValue = Number.isFinite(variation.price) ? variation.price : null;
          const initialStock = Number.isFinite(variation.initial_stock) ? variation.initial_stock : 0;
          const basePrice = resolvedCost || sellingPrice;

          const payloadVariation: ProductVariationApiPayload = {
            name:
              data.type === "variable"
                ? variation.name.trim()
                : data.name.trim(),
            description: variation.description?.trim() || "",
            barcode: variation.barcode ? variation.barcode.trim() : "",
            sku: variation.sku?.trim() || "",
            price: basePrice,
            selling_price: sellingPrice,
            wholesale_price: 0,
            unit_id: variation.unit_id,
            supplier_id: isService ? undefined : variation.supplier_id || undefined,
            color: variation.color,
            initial_stock: isService ? 0 : initialStock,
            image_url: variation.image_url || "",
          };

          if (costPriceValue !== null && costPriceValue >= 0 && !isService) {
            payloadVariation.cost_price = costPriceValue;
          }

          return payloadVariation;
        }
      );

      const payload: CreateProductPayload = {
        name: data.name.trim(),
        category_id: normalizedCategoryId,
        product_category_id: data.product_category_id?.trim() || undefined,
        image_url: imageUrl,
        type: data.type,
        variations,
      };

      const res = await api.post<{ message: string }>("/api/products", payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["store"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      log.info(
        "AddProductScreen",
        "Invalidated products and inventory queries after creation"
      );
      Alert.alert(t("common.success"), t("products.productAddedSuccessfully"), [
        { text: t("common.ok"), onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: Error) => {
      log.error("AddProductScreen", "Product creation failed", {
        message: error?.message,
        error: String(error),
        stack: error?.stack,
      });
      const payload = parseBackendError(error?.message);
      if (payload?.details?.length) {
        setErrors(issuesToErrors(payload.details));
        Alert.alert(t("common.error"), t("errors.fixHighlightedFields"));
        return;
      }

      const errorMessage =
        payload?.message ||
        payload?.error ||
        error?.message ||
        t("errors.productCreationFailed");
      Alert.alert(t("common.error"), errorMessage);
    },
  });

  const validateForm = useCallback(() => {
    const newErrors: typeof initialErrors = { variations: {} };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = t("products.nameRequired");
      isValid = false;
    }
    if (!formData.product_category_id) {
      newErrors.product_category_id = t("products.productCategoryRequired");
      isValid = false;
    }

    const variationsToValidate =
      productType === "variable"
        ? formData.variations
        : [formData.variations[0]];

    const variationErrors: { [key: number]: VariationError } = {};
    variationsToValidate.forEach((variation, index) => {
      const varErrors: VariationError = {};

      // Only require variation name for variable products
      if (productType === "variable" && !variation.name.trim()) {
        varErrors.name = t("products.variationNameRequired");
      }

      // Skip barcode validation for services
      if (productType !== "service" && (!variation.barcode || !variation.barcode.trim())) {
        varErrors.barcode = t("products.barcodeRequired");
      }

      if (variation.selling_price <= 0) {
        varErrors.selling_price = t("products.sellingPriceRequired");
      }

      if (!variation.unit_id) {
        varErrors.unit_id = t("products.unitRequired");
      }

      if (Object.keys(varErrors).length > 0) {
        variationErrors[index] = varErrors;
        isValid = false;
      }
    });

    if (Object.keys(variationErrors).length > 0) {
      newErrors.variations = variationErrors;
    }

    setErrors(newErrors);

    if (!isValid) {
      log.warn("AddProductScreen", "Validation failed for product form", {
        errors_serialized: JSON.stringify(newErrors),
        variations_count: formData.variations.length,
      });
    } else {
      log.debug("AddProductScreen", "Validation passed for product form", {
        name_length: formData.name.length,
        variations_count: formData.variations.length,
      });
    }

    return isValid;
  }, [formData, t, productType]);

  const generateEan13 = () => {
    const code = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    return code + checksum;
  };

  const generateEan8 = () => {
    const code = Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 3 : 1);
    }
    const checksum = (10 - (sum % 10)) % 10;
    return code + checksum;
  };

  const handleGenerateBarcode = (index: number) => {
    const barcodeType = Math.random() < 0.5 ? "EAN-13" : "EAN-8";
    let newBarcode = "";
    if (barcodeType === "EAN-13") {
      newBarcode = generateEan13();
    } else {
      newBarcode = generateEan8();
    }
    updateVariation(index, "barcode", newBarcode);
  };

  const handleGenerateSku = (index: number) => {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const newSku = `SKU-${randomNumber}`;
    updateVariation(index, "sku", newSku);
  };

  const handleSubmit = useCallback(() => {
    log.debug("AddProductScreen", "handleSubmit triggered", {
      has_image: Boolean(formData.image_url),
      variations_count: formData.variations.length,
      has_store: Boolean(store),
      category_id: formData.category_id,
      productType,
    });

    // Check if store is loaded
    if (!store) {
      Alert.alert(t("common.error"), t("products.storeNotLoaded"));
      return;
    }

    if (validateForm()) {
      // For simple/service products, use product name as variation name
      const variationsToSubmit =
        productType === "variable"
          ? formData.variations
          : [
            {
              ...formData.variations[0],
              name: formData.name.trim(),
              // Clear inventory-related fields for services (no barcode needed for services)
              ...(productType === "service"
                ? {
                  initial_stock: 0,
                  price: 0,
                  barcode: null, // Services don't need barcodes
                }
                : {}),
            },
          ];

      const payload: ProductFormData = {
        ...formData,
        type: productType,
        category_id:
          formData.category_id?.trim() ||
          formData.product_category_id ||
          undefined,
        variations: variationsToSubmit,
      };

      createProductMutation.mutate(payload);
    }
  }, [validateForm, createProductMutation, formData, store, t, productType]);

  const toggleVariationCollapse = (index: number) => {
    setCollapsedVariations((prev) => {
      const newCollapsed = [...prev];
      newCollapsed[index] = !newCollapsed[index];
      return newCollapsed;
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            (createProductMutation.isPending ||
              !store ||
              !unitsResponse ||
              !suppliers) &&
            styles.saveButtonDisabled,
          ]}
          testID="add-product-save-button"
          onPress={handleSubmit}
          disabled={
            createProductMutation.isPending ||
            !store ||
            !unitsResponse ||
            !suppliers
          }
        >
          {createProductMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Check size={20} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    handleSubmit,
    createProductMutation.isPending,
    colors,
    store,
    unitsResponse,
    suppliers,
  ]);

  const addVariation = useCallback(() => {
    setCollapsedVariations((prev) => [...prev.map(() => true), false]);
    setFormData((prev) => {
      // Copy data from the last variation
      const lastVariation = prev.variations[prev.variations.length - 1];
      // Fall back to first unit if the last variation doesn't have a unit set
      const defaultUnitId = lastVariation?.unit_id || unitsResponse?.[0]?.id || "";
      const newVariation: ProductVariationFormData = {
        ...lastVariation,
        name: "",
        barcode: "",
        sku: "",
        image_url: undefined,
        initial_stock: 0,
        unit_id: defaultUnitId,
      };
      return {
        ...prev,
        variations: [...prev.variations, newVariation],
      };
    });
    log.debug("AddProductScreen", "Added new variation");
  }, [unitsResponse]);

  const removeVariation = useCallback(
    (index: number) => {
      if (formData.variations.length > 1) {
        setFormData((prev) => ({
          ...prev,
          variations: prev.variations.filter((_, i) => i !== index),
        }));
        setCollapsedVariations((prev) => prev.filter((_, i) => i !== index));
        log.debug("AddProductScreen", "Removed variation", { index });
      } else {
        log.warn(
          "AddProductScreen",
          "Attempted to remove last remaining variation"
        );
      }
    },
    [formData.variations.length]
  );

  const updateVariation = useCallback(
    (
      index: number,
      field: keyof ProductVariationFormData,
      value: string | number
    ) => {
      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((variation, i) =>
          i === index ? { ...variation, [field]: value } : variation
        ),
      }));

      const errorField =
        field === "name" ||
          field === "barcode" ||
          field === "selling_price" ||
          field === "price" ||
          field === "unit_id"
          ? field
          : null;

      if (errorField) {
        setErrors((prev) => {
          const existing = prev.variations[index];
          if (!existing || !existing[errorField]) return prev;
          return {
            ...prev,
            variations: {
              ...prev.variations,
              [index]: { ...existing, [errorField]: undefined },
            },
          };
        });
      }
    },
    []
  );

  const validateBarcodeField = useCallback(
    (index: number, barcode: string) => {
      if (!barcode.trim()) {
        setErrors((prev) => ({
          ...prev,
          variations: {
            ...prev.variations,
            [index]: {
              ...prev.variations[index],
              barcode: t("products.barcodeRequired"),
            },
          },
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        variations: {
          ...prev.variations,
          [index]: {
            ...prev.variations[index],
            barcode: undefined,
          },
        },
      }));
    },
    [t]
  );

  const updateFormData = useCallback(
    (
      field: keyof ProductFormData,
      value: string | ProductVariationFormData[]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (field === "name" && prev.name) {
          return { ...prev, name: undefined };
        }
        if (field === "product_category_id" && prev.product_category_id) {
          return { ...prev, product_category_id: undefined };
        }
        return prev;
      });
    },
    []
  );

  const handleImageUpload = useCallback(
    (localUri: string) => {
      updateFormData("image_url", localUri);
    },
    [updateFormData]
  );

  const handleScanRequest = async (index: number, field: "barcode" | "sku") => {
    if (!scannerPermission?.granted) {
      const { granted } = await requestScannerPermission();
      if (!granted) {
        Alert.alert(t("errors.cameraPermissionRequired"));
        log.warn("AddProductScreen", "Camera permission denied for scanner");
        return;
      }
    }
    log.debug("AddProductScreen", "Opening scanner", { index, field });
    setScannerContext({ index, field });
    setScannerVisible(true);
  };

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scannerContext) {
      log.info("AddProductScreen", "Barcode scanned", {
        field: scannerContext.field,
        index: scannerContext.index,
        value_length: data?.length || 0,
      });
      updateVariation(scannerContext.index, scannerContext.field, data);
      setScannerVisible(false);
      setScannerContext(null);
    }
  };

  const renderVariation = useCallback(
    (variation: ProductVariationFormData, index: number) => {
      const variationErrors = errors.variations?.[index] || {};
      const isCollapsed = collapsedVariations[index];
      const isVariableProduct = productType === "variable";

      // For simple and service products, render fields directly without header
      if (!isVariableProduct) {
        return (
          <View key={index} style={{ gap: 16 }}>
            {/* prices */}
            <View style={styles.column}>
              <View style={[styles.inputGroup]}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.sellingPrice")}
                </Text>
                <View
                  style={[
                    styles.priceInputContainer,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.background,
                      borderColor: variationErrors.selling_price
                        ? colors.error
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.currencySymbol, { color: colors.primary }]}
                  >
                    {store?.currency || "UZS"}
                  </Text>
                  <CurrencyInput
                    style={[
                      styles.priceInput,
                      isDark && { color: colors.textPrimary },
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    value={variation.selling_price}
                    onChangeValue={(value) =>
                      updateVariation(index, "selling_price", value || 0)
                    }
                    delimiter=","
                    separator="."
                    precision={0}
                    minValue={0}
                    keyboardType="decimal-pad"
                    testID={`add-product-selling-price-input-${index}`}
                  />
                </View>
                {variationErrors.selling_price && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={12} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {variationErrors.selling_price}
                    </Text>
                  </View>
                )}
              </View>
              {/* supplier cost - hide for services */}
              {!isService && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textPrimary }]}
                  >
                    {t("products.deliveryCost")}
                  </Text>
                  <View
                    style={[
                      styles.priceInputContainer,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceSecondary
                          : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.currencySymbol, { color: colors.primary }]}
                    >
                      {store?.currency || "UZS"}
                    </Text>
                    <CurrencyInput
                      style={[
                        styles.priceInput,
                        isDark && { color: colors.textPrimary },
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={isDark ? "#888" : "#999"}
                      value={variation.delivery_cost}
                      onChangeValue={(value) =>
                        updateVariation(index, "delivery_cost", value || 0)
                      }
                      delimiter=","
                      separator="."
                      precision={0}
                      minValue={0}
                      keyboardType="decimal-pad"
                      testID={`add-product-delivery-cost-input-${index}`}
                    />
                  </View>
                </View>
              )}

              {!isService && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textPrimary }]}
                  >
                    {t("products.cost")}
                  </Text>
                  <View
                    style={[
                      styles.priceInputContainer,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceSecondary
                          : colors.background,
                        borderColor: variationErrors.price
                          ? colors.error
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.currencySymbol, { color: colors.primary }]}
                    >
                      {store?.currency || "UZS"}
                    </Text>
                    <CurrencyInput
                      style={[styles.priceInput, { color: colors.textPrimary }]}
                      placeholder="0.00"
                      placeholderTextColor={colors.textTertiary}
                      value={variation.price}
                      onChangeValue={(value) =>
                        updateVariation(index, "price", value || 0)
                      }
                      delimiter=","
                      separator="."
                      precision={0}
                      minValue={0}
                      keyboardType="decimal-pad"
                      testID={`add-product-cost-input-${index}`}
                    />
                  </View>
                  {variationErrors.price && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={12} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {variationErrors.price}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* barcode & sku - hide for services */}
              {!isService && (
                <View style={styles.column}>
                  <View style={[styles.inputGroup]}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: colors.textPrimary, marginBottom: 0 },
                        ]}
                      >
                        {t("products.barcode")}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleGenerateBarcode(index)}
                      >
                        <RefreshCw size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            flex: 1,
                            backgroundColor: isDark
                              ? colors.surfaceSecondary
                              : colors.background,
                            borderColor: variationErrors.barcode
                              ? colors.error
                              : colors.border,
                            color: colors.textPrimary,
                          },
                        ]}
                        placeholder="1234567890123"
                        placeholderTextColor={colors.textTertiary}
                        value={variation.barcode ?? ""}
                        onChangeText={(text) =>
                          updateVariation(index, "barcode", text)
                        }
                        onBlur={() =>
                          validateBarcodeField(index, variation.barcode ?? "")
                        }
                        keyboardType="numeric"
                        testID={`add-product-barcode-input-${index}`}
                      />
                      <TouchableOpacity
                        onPress={() => handleScanRequest(index, "barcode")}
                        style={styles.scanButton}
                      >
                        <ScanLine size={24} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                    {variationErrors.barcode && (
                      <View style={styles.errorContainer}>
                        <AlertCircle size={12} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>
                          {variationErrors.barcode}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.inputGroup]}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: colors.textPrimary, marginBottom: 0 },
                        ]}
                      >
                        {t("products.sku")}
                      </Text>
                      <TouchableOpacity onPress={() => handleGenerateSku(index)}>
                        <RefreshCw size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            flex: 1,
                            backgroundColor: isDark
                              ? colors.surfaceSecondary
                              : colors.background,
                            borderColor: colors.border,
                            color: colors.textPrimary,
                          },
                        ]}
                        placeholder="SKU-001"
                        placeholderTextColor={colors.textTertiary}
                        value={variation.sku}
                        onChangeText={(text) =>
                          updateVariation(index, "sku", text)
                        }
                      />
                      <TouchableOpacity
                        onPress={() => handleScanRequest(index, "sku")}
                        style={styles.scanButton}
                      >
                        <ScanLine size={24} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* initial stock - hide for services */}
              {!isService && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textPrimary }]}
                  >
                    {t("products.initialStock")}
                  </Text>
                  <CurrencyInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceSecondary
                          : colors.background,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder={t("products.enterInitialStock")}
                    placeholderTextColor={colors.textTertiary}
                    value={variation.initial_stock}
                    onChangeValue={(value) =>
                      updateVariation(index, "initial_stock", value || 0)
                    }
                    keyboardType="decimal-pad"
                    delimiter=","
                    separator="."
                    precision={0}
                    minValue={0}
                    testID={`add-product-initial-stock-input-${index}`}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.unitValue")}
                </Text>
                <UnitTagSelector
                  units={unitsResponse}
                  selectedUnitValue={variation.unit_id}
                  onUnitValueSelect={(unitValue) =>
                    updateVariation(index, "unit_id", unitValue)
                  }
                  error={variationErrors.unit_id}
                />
              </View>

              {/* supplier - hide for services */}
              {!isService && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textPrimary }]}
                  >
                    {t("products.supplier")}
                  </Text>
                  <SupplierTagSelector
                    suppliers={suppliers}
                    selectedSupplierId={variation.supplier_id}
                    onSupplierSelect={(supplierId) =>
                      updateVariation(index, "supplier_id", supplierId)
                    }
                  />
                  {variation.supplier_id && suppliers && (
                    <View
                      style={[
                        styles.supplierInfo,
                        {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Package size={16} color={colors.primary} />
                      <Text
                        style={[
                          styles.supplierInfoText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {suppliers.find((s) => s.id === variation.supplier_id)
                          ?.name || t("products.supplierSelected")}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        );
      }

      // For variable products, render with collapsible header
      return (
        <View
          key={index}
          style={[
            styles.variationCard,
            {
              backgroundColor: isDark
                ? colors.surfaceSecondary
                : colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.variationHeader}
            onPress={() => toggleVariationCollapse(index)}
          >
            <View style={styles.variationTitleContainer}>
              <View
                style={[
                  styles.variationNumber,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.variationNumberText,
                    { color: colors.textInverse },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[styles.variationTitle, { color: colors.textPrimary }]}
              >
                {t("products.variation")} {index + 1}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isCollapsed ? (
                <ChevronDown size={20} color={colors.textPrimary} />
              ) : (
                <ChevronUp size={20} color={colors.textPrimary} />
              )}
              {formData.variations.length > 1 && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    removeVariation(index);
                  }}
                  style={[styles.removeButton, { marginLeft: 10 }]}
                >
                  <X size={16} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          {!isCollapsed && (
            <>
              {/* variation name - always shown for variable products */}
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.variationName")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.background,
                      borderColor: variationErrors.name
                        ? colors.error
                        : colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t("products.enterVariationName")}
                  placeholderTextColor={colors.textTertiary}
                  value={variation.name}
                  onChangeText={(text) => updateVariation(index, "name", text)}
                />
                {variationErrors.name && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={12} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {variationErrors.name}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.image")}
                </Text>
                <ImageUpload
                  currentImage={variation.image_url}
                  onImageSelect={(localUri) => {
                    updateVariation(index, "image_url", localUri);
                  }}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.description")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.background,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t("products.description")}
                  placeholderTextColor={colors.textTertiary}
                  value={variation.description}
                  onChangeText={(text) =>
                    updateVariation(index, "description", text)
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* barcode & sku with scanner */}
              <View style={styles.column}>
                <View style={[styles.inputGroup]}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.textPrimary, marginBottom: 0 },
                      ]}
                    >
                      {t("products.barcode")}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleGenerateBarcode(index)}
                    >
                      <RefreshCw size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          backgroundColor: isDark
                            ? colors.surfaceSecondary
                            : colors.background,
                          borderColor: variationErrors.barcode
                            ? colors.error
                            : colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="1234567890123"
                      placeholderTextColor={colors.textTertiary}
                      value={variation.barcode ?? ""}
                      onChangeText={(text) =>
                        updateVariation(index, "barcode", text)
                      }
                      onBlur={() =>
                        validateBarcodeField(index, variation.barcode ?? "")
                      }
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      onPress={() => handleScanRequest(index, "barcode")}
                      style={styles.scanButton}
                    >
                      <ScanLine size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                  {variationErrors.barcode && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={12} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {variationErrors.barcode}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.inputGroup]}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.textPrimary, marginBottom: 0 },
                      ]}
                    >
                      {t("products.sku")}
                    </Text>
                    <TouchableOpacity onPress={() => handleGenerateSku(index)}>
                      <RefreshCw size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          backgroundColor: isDark
                            ? colors.surfaceSecondary
                            : colors.background,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="SKU-001"
                      placeholderTextColor={colors.textTertiary}
                      value={variation.sku}
                      onChangeText={(text) =>
                        updateVariation(index, "sku", text)
                      }
                    />
                    <TouchableOpacity
                      onPress={() => handleScanRequest(index, "sku")}
                      style={styles.scanButton}
                    >
                      <ScanLine size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* prices */}
              <View style={styles.column}>
                <View style={[styles.inputGroup]}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textPrimary }]}
                  >
                    {t("products.sellingPrice")}
                  </Text>
                  <View
                    style={[
                      styles.priceInputContainer,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceSecondary
                          : colors.background,
                        borderColor: variationErrors.selling_price
                          ? colors.error
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.currencySymbol, { color: colors.primary }]}
                    >
                      {store?.currency || "UZS"}
                    </Text>
                    <CurrencyInput
                      style={[
                        styles.priceInput,
                        isDark && { color: colors.textPrimary },
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={isDark ? "#888" : "#999"}
                      value={variation.selling_price}
                      onChangeValue={(value) =>
                        updateVariation(index, "selling_price", value || 0)
                      }
                      delimiter=","
                      separator="."
                      precision={0}
                      minValue={0}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  {variationErrors.selling_price && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={12} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        {variationErrors.selling_price}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {t("products.deliveryCost")}
                </Text>
                <View
                  style={[
                    styles.priceInputContainer,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: colors.primary }]}>
                    {store?.currency || "UZS"}
                  </Text>
                  <CurrencyInput
                    style={[
                      styles.priceInput,
                      isDark && { color: colors.textPrimary },
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    value={variation.delivery_cost}
                    onChangeValue={(value) =>
                      updateVariation(index, "delivery_cost", value || 0)
                    }
                    delimiter=","
                    separator="."
                    precision={0}
                    minValue={0}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* supplier cost */}
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.cost")}
                </Text>
                <View
                  style={[
                    styles.priceInputContainer,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.background,
                      borderColor: variationErrors.price
                        ? colors.error
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.currencySymbol, { color: colors.primary }]}
                  >
                    {store?.currency || "UZS"}
                  </Text>
                  <CurrencyInput
                    style={[styles.priceInput, { color: colors.textPrimary }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    value={variation.price}
                    onChangeValue={(value) =>
                      updateVariation(index, "price", value || 0)
                    }
                    delimiter=","
                    separator="."
                    precision={0}
                    minValue={0}
                    keyboardType="decimal-pad"
                  />
                </View>
                {variationErrors.price && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={12} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {variationErrors.price}
                    </Text>
                  </View>
                )}
              </View>

              {/* initial stock */}
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.initialStock")}
                </Text>
                <CurrencyInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.background,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t("products.enterInitialStock")}
                  placeholderTextColor={colors.textTertiary}
                  value={variation.initial_stock}
                  onChangeValue={(value) =>
                    updateVariation(index, "initial_stock", value || 0)
                  }
                  keyboardType="decimal-pad"
                  delimiter=","
                  separator="."
                  precision={0}
                  minValue={0}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.unitValue")}
                </Text>
                <UnitTagSelector
                  units={unitsResponse}
                  selectedUnitValue={variation.unit_id}
                  onUnitValueSelect={(unitValue) =>
                    updateVariation(index, "unit_id", unitValue)
                  }
                  error={variationErrors.unit_id}
                />
              </View>

              {/* supplier */}
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.supplier")}
                </Text>
                <SupplierTagSelector
                  suppliers={suppliers}
                  selectedSupplierId={variation.supplier_id}
                  onSupplierSelect={(supplierId) =>
                    updateVariation(index, "supplier_id", supplierId)
                  }
                />
                {/* Supplier Display Information */}
                {variation.supplier_id && suppliers && (
                  <View
                    style={[
                      styles.supplierInfo,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Package size={16} color={colors.primary} />
                    <Text
                      style={[
                        styles.supplierInfoText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {suppliers.find((s) => s.id === variation.supplier_id)
                        ?.name || t("products.supplierSelected")}
                    </Text>
                  </View>
                )}
                {!variation.supplier_id && (
                  <View
                    style={[
                      styles.supplierInfo,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Package size={16} color={colors.textTertiary} />
                    <Text
                      style={[
                        styles.supplierInfoText,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {t("products.noSupplierSelected")}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textPrimary }]}
                >
                  {t("products.color")}
                </Text>
                <ColorPicker
                  selectedColor={variation.color}
                  onColorSelect={(color: string) =>
                    updateVariation(index, "color", color)
                  }
                />
              </View>
            </>
          )}
        </View>
      );
    },
    [
      isDark,
      errors.variations,
      formData.variations.length,
      removeVariation,
      updateVariation,
      t,
      unitsResponse,
      i18n.language,
      collapsedVariations,
      toggleVariationCollapse,
    ]
  );

  if (storeLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
          styles.centerContent,
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  if (storeError || !store) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
          styles.centerContent,
        ]}
      >
        <AlertCircle size={48} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
          {t("products.storeNotFound")}
        </Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
          {storeError?.message || t("products.storeLoadError")}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() =>
            queryClient.invalidateQueries({ queryKey: ["stores", user?.id] })
          }
        >
          <RefreshCw size={20} color={colors.textInverse} />
          <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>
            {t("common.retry")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      testID="add-product-screen"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Product Type Selection */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("products.productType")}
              </Text>
              <Text
                style={[
                  styles.inputLabel,
                  { color: colors.textTertiary, fontWeight: "400", marginBottom: 12 },
                ]}
              >
                {t("products.selectProductTypeDescription")}
              </Text>
              <View style={styles.productTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.productTypeCard,
                    {
                      backgroundColor:
                        productType === "simple"
                          ? colors.primary + "15"
                          : isDark
                            ? colors.surfaceSecondary
                            : colors.background,
                      borderColor:
                        productType === "simple"
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setProductType("simple")}
                >
                  <Box
                    size={24}
                    color={
                      productType === "simple"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.productTypeTitle,
                      {
                        color:
                          productType === "simple"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {t("products.type.simple")}
                  </Text>
                  <Text
                    style={[
                      styles.productTypeDescription,
                      { color: colors.textTertiary },
                    ]}
                    numberOfLines={2}
                  >
                    {t("products.type.simpleDescription")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.productTypeCard,
                    {
                      backgroundColor:
                        productType === "variable"
                          ? colors.primary + "15"
                          : isDark
                            ? colors.surfaceSecondary
                            : colors.background,
                      borderColor:
                        productType === "variable"
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setProductType("variable")}
                >
                  <Layers
                    size={24}
                    color={
                      productType === "variable"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.productTypeTitle,
                      {
                        color:
                          productType === "variable"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {t("products.type.variable")}
                  </Text>
                  <Text
                    style={[
                      styles.productTypeDescription,
                      { color: colors.textTertiary },
                    ]}
                    numberOfLines={2}
                  >
                    {t("products.type.variableDescription")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.productTypeCard,
                    {
                      backgroundColor:
                        productType === "service"
                          ? colors.primary + "15"
                          : isDark
                            ? colors.surfaceSecondary
                            : colors.background,
                      borderColor:
                        productType === "service"
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setProductType("service")}
                >
                  <Zap
                    size={24}
                    color={
                      productType === "service"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.productTypeTitle,
                      {
                        color:
                          productType === "service"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {t("products.type.service")}
                  </Text>
                  <Text
                    style={[
                      styles.productTypeDescription,
                      { color: colors.textTertiary },
                    ]}
                    numberOfLines={2}
                  >
                    {t("products.type.serviceDescription")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Service Info Banner */}
          {isService && (
            <View
              style={{
                backgroundColor: colors.primary + "10",
                borderWidth: 1,
                borderColor: colors.primary + "30",
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <Zap size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.primary,
                      marginBottom: 4,
                    }}
                  >
                    {t("products.serviceInfoTitle")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      lineHeight: 18,
                    }}
                  >
                    {t("products.serviceInfoDescription")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ... basic info section ... */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.primaryLight + "20" },
                ]}
              >
                <Package size={20} color={colors.primary} />
              </View>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {t("products.basicInfo")}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("products.productName")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.background,
                    borderColor: errors.name ? colors.error : colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t("products.enterProductName")}
                placeholderTextColor={colors.textTertiary}
                value={formData.name}
                onChangeText={(text) => updateFormData("name", text)}
                testID="add-product-name-input"
              />
              {errors.name && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={12} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.name}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("products.productCategory")}
              </Text>
              <ProductCategoryTagSelector
                selectedCategoryId={formData.product_category_id}
                onCategorySelect={(categoryId) =>
                  updateFormData("product_category_id", categoryId)
                }
                error={errors.product_category_id}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("products.productImage")}
              </Text>
              <ImageUpload
                currentImage={formData.image_url}
                onImageSelect={handleImageUpload}
              />
            </View>
          </View>

          {/* Variations section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.primaryLight + "20" },
                ]}
              >
                <BarChart3 size={20} color={colors.primary} />
              </View>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {productType === "variable"
                  ? t("products.variations")
                  : productType === "service"
                    ? t("products.servicePricing")
                    : t("products.pricingInformation")}
              </Text>
              {productType === "variable" && (
                <TouchableOpacity
                  onPress={addVariation}
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                >
                  <Plus size={16} color={colors.textInverse} />
                </TouchableOpacity>
              )}
            </View>

            {productType === "variable"
              ? formData.variations.map((variation, index) =>
                renderVariation(variation, index)
              )
              : renderVariation(formData.variations[0], 0)}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={scannerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <CameraView
          style={styles.scannerContainer}
          onBarcodeScanned={handleBarCodeScanned}
          facing="back"
          enableTorch={true}
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code39",
              "code128",
              "pdf417",
            ],
          }}
        >
          <View style={styles.scannerControls}>
            <TouchableOpacity
              style={styles.scannerButton}
              onPress={() => setScannerVisible(false)}
            >
              <X size={24} color={colors.textPrimary} />
              <Text
                style={[
                  styles.scannerButtonText,
                  { color: colors.textPrimary },
                ]}
              >
                {t("common.close")}
              </Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    // paddingBottom is set dynamically with safe area insets
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanButton: {
    position: "absolute",
    right: 0,
    height: 52,
    width: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    padding: 0,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 4,
  },
  column: {
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  variationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  variationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  variationTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  variationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  variationNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  variationTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  headerButton: {
    padding: 8,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scannerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 30,
    paddingBottom: 40,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  scannerButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 16,
    borderRadius: 12,
  },
  scannerButtonText: {
    fontWeight: "bold",
    marginTop: 4,
  },
  supplierInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  supplierInfoText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  productTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  productTypeCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
  },
  productTypeTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  productTypeDescription: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
});
