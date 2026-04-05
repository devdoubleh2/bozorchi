import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
  useMemo,
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
} from "react-native";
import {
  ArrowLeft,
  AlertCircle,
  Package,
  RefreshCw,
  ClipboardList,
} from "lucide-react-native";
import ImageUpload from "../src/components/ImageUpload";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useAuthContext } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api } from "../lib/api";
import { log } from "@/debugging/log";
import ProductCategoryTagSelector from "../src/components/ProductCategoryTagSelector";
import { usePOSStore } from "../context/PosStore";
import { formatPrice } from "../src/utils/currency";

type ProductVariation = {
  id?: string;
  name: string;
  barcode?: string;
  sku?: string | null;
  price: number;
  selling_price: number;
  unit_id: string;
  image_url?: string;
  unit: {
    id: string;
    name: string;
  };
};

type ProductFormData = {
  name: string;
  category_id: string;
  product_category_id: string;
  image_url: string;
  color: string;
};

type VariationError = {
  name?: string;
  price?: string;
  selling_price?: string;
  image_url?: string;
  unit_id?: string;
  barcode?: string;
};

const createEmptyErrors = () => ({
  name: undefined as string | undefined,
  category_id: undefined as string | undefined,
  product_category_id: undefined as string | undefined,
  variations: {} as { [key: number]: VariationError },
});

const initialErrors = createEmptyErrors();

const toNumberOrZero = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
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

const baseVariationSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, { message: "products.variationNameRequired" }),
  barcode: z.string().optional(),
  price: z.number(),
  selling_price: z.number().positive({ message: "products.sellingPriceRequired" }),
  unit_id: z.string().min(1, { message: "products.unitRequired" }),
  image_url: z.string().optional(),
});

type CurrencyInputProps = {
  value: number | undefined | null;
  onChange: (text: string) => void;
  currency: string;
  isDark: boolean;
};

const CurrencyInput = ({
  value,
  onChange,
  currency,
  isDark,
}: CurrencyInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState("");

  // Handle undefined/null values
  const safeValue = value ?? 0;

  // Update local value when external value changes
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(safeValue));
    }
  }, [safeValue, isFocused]);

  const displayValue = isFocused
    ? localValue
    : formatPrice(safeValue, currency);

  const handleChange = (text: string) => {
    // Allow empty string
    if (text === "") {
      setLocalValue("0");
      onChange("0");
      return;
    }

    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(text)) {
      setLocalValue(text);
      // Only call onChange if it's a valid number (not ending with decimal point)
      if (!text.endsWith(".")) {
        onChange(text);
      }
    }
  };

  return (
    <TextInput
      style={[styles.variationInput, isDark && styles.variationInputDark]}
      value={displayValue}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      onFocus={() => {
        setIsFocused(true);
        setLocalValue(String(safeValue));
      }}
      onBlur={() => {
        setIsFocused(false);
        // Ensure we have a valid number when losing focus
        const numValue = parseFloat(localValue) || 0;
        setLocalValue(String(numValue));
        onChange(String(numValue));
      }}
    />
  );
};

export default function EditProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);
  const queryClient = useQueryClient();
  const currency = usePOSStore((state) => state.currency);

  const { productId } = (route.params as { productId: string }) || {};

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category_id: "",
    product_category_id: "",
    image_url: "",
    color: "",
  });
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [errors, setErrors] = useState(initialErrors);

  useEffect(() => {
    log.info("EditProductScreen", "mounted", {
      productId,
      userId: user?.id,
      currency,
    });
    return () => {
      log.info("EditProductScreen", "unmounted", { productId, userId: user?.id });
    };
  }, [productId, user?.id, currency]);

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
    (issues: Array<{ path: Array<string | number | symbol>; message?: string }>) => {
      const nextErrors = createEmptyErrors();
      const fieldMap: Record<
        string,
        { target: keyof VariationError; fallback: string }
      > = {
        name: { target: "name", fallback: "products.variationNameRequired" },
        selling_price: { target: "selling_price", fallback: "errors.invalidValue" },
        price: { target: "price", fallback: "errors.invalidValue" },
        unit_id: { target: "unit_id", fallback: "products.unitRequired" },
        image_url: { target: "image_url", fallback: "errors.invalidValue" },
        barcode: { target: "barcode", fallback: "products.barcodeRequired" },
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
        if (root === "product_category_id") {
          nextErrors.product_category_id = getErrorMessage(
            "products.productCategoryRequired",
            issue.message
          );
          return;
        }
        if (root !== "variations") return;
        if (typeof index !== "number") return;

        const fieldKey = String(field ?? "");
        const mapping = fieldMap[fieldKey];
        if (!mapping) return;

        nextErrors.variations[index] ||= {};
        nextErrors.variations[index][mapping.target] = getErrorMessage(
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

  type ProductResponse = {
    id: string;
    name: string;
    category_id: string;
    product_category_id: string;
    image_url: string;
    color: string;
    type: "simple" | "variable" | "service";
    product_variations?: ProductVariation[];
  };

  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) {
        throw new Error("Product ID is required");
      }
      const response = await api.get<{ product: ProductResponse }>(
        `/api/products/${productId}`
      );
      return response.product;
    },
    enabled: !!productId,
  });

  type UnitResponse = {
    id: string;
    name: string;
  };

  const {
    data: units,
    isLoading: unitsLoading,
    error: unitsError,
  } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await api.get<{ units: UnitResponse[] }>("/api/units");
      return response.units;
    },
    enabled: !!user?.id, // Only fetch when user is authenticated
  });

  useEffect(() => {
    if (product) {
      const fallbackName = product.name || "";
      setFormData({
        name: product.name || "",
        category_id: product.category_id || "",
        product_category_id: product.product_category_id || "",
        image_url: product.image_url || "",
        color: product.color || "",
      });
      if (product.product_variations) {
        setVariations(
          product.product_variations.map((variation) => ({
            ...variation,
            name: variation.name || fallbackName,
            price: toNumberOrZero(variation.price),
            selling_price: toNumberOrZero(variation.selling_price),
            image_url: variation.image_url || "",
          }))
        );
        log.debug("EditProductScreen", "hydrated form from product", {
          variations: product.product_variations.length,
          hasImage: Boolean(product.image_url),
        });
      }
    }
  }, [product]);

  useEffect(() => {
    if (productError) {
      log.error("EditProductScreen", "product query failed", {
        productId,
        error: productError instanceof Error ? productError.message : String(productError),
      });
    }
  }, [productError, productId]);

  useEffect(() => {
    if (units) {
      log.debug("EditProductScreen", "units loaded", { count: units.length });
    }
  }, [units]);

  useEffect(() => {
    if (unitsError) {
      log.error("EditProductScreen", "units query failed", {
        error: unitsError instanceof Error ? unitsError.message : String(unitsError),
      });
    }
  }, [unitsError]);

  const isService = product?.type === "service";
  const formSchema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .trim()
            .min(1, { message: "products.nameRequired" }),
          product_category_id: z
            .string()
            .min(1, { message: "products.productCategoryRequired" }),
          variations: z.array(baseVariationSchema).min(1),
        })
        .superRefine((data, ctx) => {
          if (isService) return;
          data.variations.forEach((variation, index) => {
            if (!variation.id && !variation.barcode?.trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "products.barcodeRequired",
                path: ["variations", index, "barcode"],
              });
            }
          });
        }),
    [isService]
  );

  const updateProductMutation = useMutation({
    mutationFn: async (
      data: ProductFormData & { variations: Partial<ProductVariation>[] }
    ) => {
      if (!productId) {
        throw new Error("Product ID is required");
      }
      log.info("EditProductScreen", "submit product update", {
        productId,
        variationCount: data.variations.length,
      });

      let imageUrl = data.image_url;

      if (data.image_url && !data.image_url.startsWith("http")) {
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
            "EditProductScreen",
            "Image upload failed during product update",
            { error: String(uploadError) }
          );
          throw new Error(t("errors.imageUploadFailed"));
        }
      }

      // Upload variation images if they're local URIs
      const variationsWithUploadedImages = await Promise.all(
        data.variations.map(async (variation, index) => {
          let variationImageUrl = variation.image_url;

          if (variation.image_url && !variation.image_url.startsWith("http")) {
            log.debug("EditProductScreen", "Uploading variation image", {
              index,
              variationId: variation.id,
              imageUri: variation.image_url?.substring(0, 50),
            });

            try {
              const uploadFormData = new FormData();
              const localUri = variation.image_url;
              const filename = localUri.split("/").pop();
              if (!filename) {
                throw new Error(
                  "Filename could not be extracted from the URI."
                );
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
              variationImageUrl = res.url;

              log.info(
                "EditProductScreen",
                "Variation image uploaded successfully",
                {
                  index,
                  variationId: variation.id,
                  url: res.url?.substring(0, 50),
                }
              );
            } catch (uploadError) {
              log.error("EditProductScreen", "Variation image upload failed", {
                index,
                variationId: variation.id,
                error: String(uploadError),
              });
              // Continue without updating image if upload fails
              variationImageUrl = variation.image_url;
            }
          }

          const sellingPriceValue = toNumberOrZero(variation.selling_price);
          const priceValue = toNumberOrZero(variation.price);
          const normalizedPrice =
            priceValue > 0 ? priceValue : sellingPriceValue;
          const normalizedName =
            typeof variation.name === "string" && variation.name.trim()
              ? variation.name.trim()
              : data.name.trim();

          const variationData: Record<string, unknown> = {
            name: normalizedName,
            price: normalizedPrice,
            selling_price: sellingPriceValue,
            unit_id: variation.unit_id || "",
            image_url: variationImageUrl || "",
          };

          // Include id only for existing variations
          if (variation.id) {
            variationData.id = variation.id;
          }

          // Include name, barcode, sku for new variations
          if (!variation.id) {
            variationData.barcode = variation.barcode || "";
            variationData.sku = variation.sku || null;
          }

          return variationData;
        })
      );

      log.debug("EditProductScreen", "All variation images processed", {
        totalVariations: variationsWithUploadedImages.length,
        withImages: variationsWithUploadedImages.filter((v) => v.image_url)
          .length,
      });

      const payload = {
        name: data.name,
        product_category_id: data.product_category_id,
        image_url: imageUrl,
        color: data.color,
        variations: variationsWithUploadedImages,
      };

      const res = await api.put(`/api/products/${productId}`, payload);
      return res;
    },
    onSuccess: () => {
      log.info("EditProductScreen", "Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["store"] });
      Alert.alert(
        t("common.success"),
        t("products.productUpdatedSuccessfully"),
        [{ text: t("common.ok"), onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: Error) => {
      log.error("EditProductScreen", "Product update failed", {
        message: error?.message,
        error: String(error),
      });
      const payload = parseBackendError(error?.message);
      if (payload?.details?.length) {
        const nextErrors = issuesToErrors(payload.details);
        setErrors(nextErrors);
        Alert.alert(t("common.error"), t("errors.fixHighlightedFields"));
        return;
      }

      const errorMessage =
        payload?.message ||
        payload?.error ||
        error?.message ||
        t("errors.productUpdateFailed");
      Alert.alert(t("common.error"), errorMessage);
    },
  });

  const validateForm = useCallback(() => {
    const result = formSchema.safeParse({
      name: formData.name,
      product_category_id: formData.product_category_id,
      variations,
    });

    if (!result.success) {
      log.warn("EditProductScreen", "form validation failed", {
        issues: result.error.issues?.length ?? 0,
      });
      setErrors(issuesToErrors(result.error.issues));
      return false;
    }

    log.debug("EditProductScreen", "form validation passed");
    setErrors(createEmptyErrors());
    return true;
  }, [formSchema, formData.name, formData.product_category_id, variations, issuesToErrors]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      updateProductMutation.mutate({ ...formData, variations });
    }
  }, [validateForm, updateProductMutation, formData, variations]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={isDark ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSubmit}
          disabled={updateProductMutation.isPending}
          testID="edit-product-save-button"
        >
          {updateProductMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.headerButtonText,
                isDark && styles.headerButtonTextDark,
              ]}
            >
              {t("common.save")}
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSubmit, updateProductMutation.isPending, isDark, t]);

  const updateFormData = useCallback(
    (field: keyof ProductFormData, value: string) => {
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

  const validateVariationBarcode = useCallback(
    (index: number, barcode: string) => {
      if (isService || variations[index]?.id) return;
      const message = barcode?.trim()
        ? undefined
        : t("products.barcodeRequired");
      setErrors((prev) => {
        const existing = prev.variations[index];
        if (!existing?.barcode && !message) return prev;
        return {
          ...prev,
          variations: {
            ...prev.variations,
            [index]: { ...existing, barcode: message },
          },
        };
      });
    },
    [isService, variations, t]
  );

  const handleVariationChange = useCallback(
    (
      index: number,
      field:
        | "price"
        | "unit_id"
        | "selling_price"
        | "name"
        | "barcode"
        | "sku"
        | "image_url",
      value: string | number
    ) => {
      const newVariations = [...variations];
      const variation = { ...newVariations[index] };

      if (field === "price" || field === "selling_price") {
        variation[field] = parseFloat(value as string) || 0;
      } else if (field === "unit_id") {
        variation.unit_id = value as string;
        const selectedUnit = units?.find((u) => u.id === value);
        if (selectedUnit) {
          variation.unit = selectedUnit;
        }
      } else if (field === "name" || field === "barcode" || field === "sku") {
        variation[field] = value as string;
      } else if (field === "image_url") {
        variation.image_url = value as string;
      }

      newVariations[index] = variation;
      setVariations(newVariations);

      const errorField =
        field === "price" ||
        field === "selling_price" ||
        field === "name" ||
        field === "barcode" ||
        field === "image_url" ||
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
    [variations, units]
  );

  const handleAddVariation = useCallback(() => {
    const defaultUnit = units?.[0];
    if (!defaultUnit) {
      Alert.alert(t("common.error"), t("products.noUnitsAvailable"));
      return;
    }

    const newVariation: ProductVariation = {
      name: t("products.newVariation"),
      barcode: "",
      sku: null,
      price: 0,
      selling_price: 0,
      unit_id: defaultUnit.id,
      unit: defaultUnit,
      image_url: "",
    };

    setVariations([...variations, newVariation]);
  }, [variations, units, t]);

  const handleRemoveVariation = useCallback(
    (index: number) => {
      const variation = variations[index];
      // Only allow removal of new variations (without id)
      if (variation.id) {
        Alert.alert(
          t("common.error"),
          t("products.cannotRemoveExistingVariation")
        );
        return;
      }

      Alert.alert(t("common.confirm"), t("products.confirmRemoveVariation"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: () => {
            const newVariations = variations.filter((_, i) => i !== index);
            setVariations(newVariations);
          },
        },
      ]);
    },
    [variations, t]
  );

  if (productLoading || unitsLoading) {
    return (
      <View
        style={[
          styles.container,
          isDark && styles.containerDark,
          styles.centerContent,
        ]}
      >
        <ActivityIndicator size="large" color={isDark ? "#4fc3f7" : "#000"} />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  if (productError || !product) {
    return (
      <View
        style={[
          styles.container,
          isDark && styles.containerDark,
          styles.centerContent,
        ]}
      >
        <AlertCircle size={48} color={isDark ? "#ef4444" : "#dc2626"} />
        <Text style={[styles.errorTitle, isDark && styles.errorTitleDark]}>
          {t("products.productNotFound")}
        </Text>
        <Text style={[styles.errorMessage, isDark && styles.errorMessageDark]}>
          {productError?.message || t("products.productLoadError")}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() =>
            queryClient.invalidateQueries({ queryKey: ["product", productId] })
          }
        >
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, isDark && styles.containerDark]}
      testID="edit-product-screen"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Package size={20} color="#4fc3f7" />
            </View>
            <Text
              style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
            >
              {t("products.basicInfo")}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              {t("products.productName")}
            </Text>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                errors.name && styles.inputError,
              ]}
              placeholder={t("products.enterProductName")}
              placeholderTextColor={isDark ? "#888" : "#999"}
              value={formData.name}
              onChangeText={(text) => updateFormData("name", text)}
              testID="edit-product-name-input"
            />
            {errors.name && (
              <View style={styles.errorContainer}>
                <AlertCircle size={12} color="#ef4444" />
                <Text style={styles.errorText}>{errors.name}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
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
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              {t("products.productImage")}
            </Text>
            <ImageUpload
              currentImage={formData.image_url}
              onImageSelect={handleImageUpload}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              {t("products.productColor")}
            </Text>
            <View style={styles.colorSelectorContainer}>
              {[
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#000000",
                "#FFFFFF",
              ].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    formData.color === color && styles.colorSwatchSelected,
                  ]}
                  onPress={() => updateFormData("color", color)}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <ClipboardList size={20} color="#4fc3f7" />
            </View>
            <Text
              style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
            >
              {t("products.variations")}
            </Text>
          </View>

          {variations.map((variation, index) => (
            <View
              key={variation.id || `new-${index}`}
              style={{ marginBottom: 24 }}
            >
              <View style={styles.variationHeader}>
                <Text
                  style={[
                    styles.variationGroupName,
                    isDark && styles.variationGroupNameDark,
                  ]}
                >
                  {variation.name}
                </Text>
                {!variation.id && (
                  <TouchableOpacity
                    style={styles.removeVariationButton}
                    onPress={() => handleRemoveVariation(index)}
                  >
                    <Text style={styles.removeVariationButtonText}>
                      {t("common.remove")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {variation.id && errors.variations[index]?.name && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={12} color="#ef4444" />
                  <Text style={styles.errorText}>
                    {errors.variations[index]?.name}
                  </Text>
                </View>
              )}
              {variation.id && errors.variations[index]?.image_url && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={12} color="#ef4444" />
                  <Text style={styles.errorText}>
                    {errors.variations[index]?.image_url}
                  </Text>
                </View>
              )}

              {/* Show name, barcode, SKU for new variations */}
              {!variation.id && (
                <View style={{ marginBottom: 12 }}>
                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        isDark && styles.inputLabelDark,
                      ]}
                    >
                      {t("products.variationName")}
                    </Text>
                    <TextInput
                      style={[styles.input, isDark && styles.inputDark]}
                      placeholder={t("products.enterVariationName")}
                      placeholderTextColor={isDark ? "#888" : "#999"}
                      value={variation.name}
                      onChangeText={(text) =>
                        handleVariationChange(index, "name", text)
                      }
                    />
                    {errors.variations[index]?.name && (
                      <View style={styles.errorContainer}>
                        <AlertCircle size={12} color="#ef4444" />
                        <Text style={styles.errorText}>
                          {errors.variations[index]?.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        isDark && styles.inputLabelDark,
                      ]}
                    >
                      {t("products.barcode")}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        isDark && styles.inputDark,
                        errors.variations[index]?.barcode && styles.inputError,
                      ]}
                      placeholder={t("products.enterBarcode")}
                      placeholderTextColor={isDark ? "#888" : "#999"}
                      value={variation.barcode}
                      onChangeText={(text) =>
                        handleVariationChange(index, "barcode", text)
                      }
                      onBlur={() =>
                        validateVariationBarcode(index, variation.barcode || "")
                      }
                      keyboardType="default"
                    />
                    {errors.variations[index]?.barcode && (
                      <View style={styles.errorContainer}>
                        <AlertCircle size={12} color="#ef4444" />
                        <Text style={styles.errorText}>
                          {errors.variations[index]?.barcode}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        isDark && styles.inputLabelDark,
                      ]}
                    >
                      {t("products.sku")}
                    </Text>
                    <TextInput
                      style={[styles.input, isDark && styles.inputDark]}
                      placeholder={t("products.enterSKU")}
                      placeholderTextColor={isDark ? "#888" : "#999"}
                      value={variation.sku || ""}
                      onChangeText={(text) =>
                        handleVariationChange(index, "sku", text)
                      }
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        isDark && styles.inputLabelDark,
                      ]}
                    >
                      {t("products.variationImage")}
                    </Text>
                    <ImageUpload
                      currentImage={variation.image_url}
                      onImageSelect={(uri) =>
                        handleVariationChange(index, "image_url", uri)
                      }
                    />
                    {errors.variations[index]?.image_url && (
                      <View style={styles.errorContainer}>
                        <AlertCircle size={12} color="#ef4444" />
                        <Text style={styles.errorText}>
                          {errors.variations[index]?.image_url}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View
                style={[
                  styles.variationFieldsContainer,
                  isDark && styles.variationFieldsContainerDark,
                ]}
              >
                <View>
                  <View style={[styles.fieldRow, isDark && styles.fieldRowDark]}>
                    <Text
                      style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}
                    >
                      {t("products.sellingPrice")}
                    </Text>
                    <CurrencyInput
                      value={variation.selling_price}
                      onChange={(text) =>
                        handleVariationChange(index, "selling_price", text)
                      }
                      currency={currency}
                      isDark={isDark}
                    />
                  </View>
                  {errors.variations[index]?.selling_price && (
                    <View style={styles.fieldErrorContainer}>
                      <AlertCircle size={12} color="#ef4444" />
                      <Text style={styles.errorText}>
                        {errors.variations[index]?.selling_price}
                      </Text>
                    </View>
                  )}
                </View>
                <View>
                  <View style={[styles.fieldRow, isDark && styles.fieldRowDark]}>
                    <Text
                      style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}
                    >
                      {t("products.actualCost")}
                    </Text>
                    <CurrencyInput
                      value={variation.price}
                      onChange={(text) =>
                        handleVariationChange(index, "price", text)
                      }
                      currency={currency}
                      isDark={isDark}
                    />
                  </View>
                  {errors.variations[index]?.price && (
                    <View style={styles.fieldErrorContainer}>
                      <AlertCircle size={12} color="#ef4444" />
                      <Text style={styles.errorText}>
                        {errors.variations[index]?.price}
                      </Text>
                    </View>
                  )}
                </View>
                <View>
                  <View
                    style={[
                      styles.fieldRow,
                      isDark && styles.fieldRowDark,
                      { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text
                      style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}
                    >
                      {t("products.unit")}
                    </Text>
                    <View style={styles.unitSelectorContainer}>
                      {units?.map((unit) => (
                        <TouchableOpacity
                          key={unit.id}
                          style={[
                            styles.unitTag,
                            isDark && styles.unitTagDark,
                            variation.unit_id === unit.id &&
                            styles.unitTagSelected,
                          ]}
                          onPress={() =>
                            handleVariationChange(index, "unit_id", unit.id)
                          }
                        >
                          <Text
                            style={[
                              styles.unitTagText,
                              isDark && styles.unitTagTextDark,
                              variation.unit_id === unit.id &&
                              styles.unitTagTextSelected,
                            ]}
                          >
                            {unit.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {errors.variations[index]?.unit_id && (
                    <View style={styles.fieldErrorContainer}>
                      <AlertCircle size={12} color="#ef4444" />
                      <Text style={styles.errorText}>
                        {errors.variations[index]?.unit_id}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}

          {/* Add Variation Button */}
          <TouchableOpacity
            style={[
              styles.addVariationButton,
              isDark && styles.addVariationButtonDark,
            ]}
            onPress={handleAddVariation}
          >
            <Text
              style={[
                styles.addVariationButtonText,
                isDark && styles.addVariationButtonTextDark,
              ]}
            >
              + {t("products.addVariation")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  containerDark: {
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(79, 195, 247, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  sectionTitleDark: {
    color: "#ffffff",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  inputLabelDark: {
    color: "#e0e0e0",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#fff",
  },
  inputDark: {
    backgroundColor: "#1e1e1e",
    borderColor: "#333333",
    color: "#ffffff",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  fieldErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginLeft: 4,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: "#4fc3f7",
    fontSize: 16,
    fontWeight: "600",
  },
  headerButtonTextDark: {
    color: "#4fc3f7",
  },
  saveButton: {
    backgroundColor: "#4fc3f7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  loadingTextDark: {
    color: "#94a3b8",
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  errorTitleDark: {
    color: "#ffffff",
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  errorMessageDark: {
    color: "#94a3b8",
  },
  retryButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4fc3f7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  variationGroupName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    paddingLeft: 4,
  },
  variationGroupNameDark: {
    color: "#94a3b8",
  },
  variationFieldsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  variationFieldsContainerDark: {
    backgroundColor: "#1e1e1e",
    borderColor: "#333333",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 16,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  fieldRowDark: {
    borderBottomColor: "#333333",
  },
  fieldLabel: {
    fontSize: 16,
    color: "#1e293b",
  },
  fieldLabelDark: {
    color: "#ffffff",
  },
  variationInput: {
    fontSize: 16,
    color: "#64748b",
    flex: 1,
    textAlign: "right",
    paddingVertical: 12,
  },
  variationInputDark: {
    color: "#94a3b8",
  },
  unitSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: 1,
  },
  unitTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginLeft: 8,
    marginBottom: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  unitTagDark: {
    backgroundColor: "#2a2a2a",
  },
  unitTagSelected: {
    backgroundColor: "#4fc3f7",
    borderColor: "#4fc3f7",
  },
  unitTagText: {
    color: "#475569",
    fontWeight: "600",
  },
  unitTagTextDark: {
    color: "#e0e0e0",
  },
  unitTagTextSelected: {
    color: "#fff",
  },
  colorSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: "#4fc3f7",
  },
  variationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  removeVariationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  removeVariationButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  addVariationButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4fc3f7",
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 8,
  },
  addVariationButtonDark: {
    borderColor: "#4fc3f7",
  },
  addVariationButtonText: {
    color: "#4fc3f7",
    fontSize: 16,
    fontWeight: "600",
  },
  addVariationButtonTextDark: {
    color: "#4fc3f7",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});
