import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import {
  Printer,
  CheckSquare,
  Square,
  QrCode,
  Barcode as BarcodeIcon,
  Download,
  Image as ImageIcon,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthContext } from "../context/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

interface ProductVariation {
  id: string;
  name: string;
  barcode: string;
  selling_price: number;
  product: {
    name: string;
  };
  unit: {
    name: string;
  };
}

export default function PriceTagsScreen() {
  const [selectedVariations, setSelectedVariations] = useState<Set<string>>(
    new Set()
  );
  const [template, setTemplate] = useState<"small" | "medium" | "large">(
    "medium"
  );
  const [includeQr, setIncludeQr] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(false);

  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get<{
        products: { name: string; product_variations: ProductVariation[] }[];
      }>("/products");
      return response.products;
    },
    enabled: !!user,
  });

  // Get all variations from products
  const allVariations: ProductVariation[] =
    products?.flatMap((product) =>
      product.product_variations.map((pv) => ({
        ...pv,
        product: { name: product.name },
      }))
    ) || [];

  // Generate price tags mutation
  const generateTagsMutation = useMutation({
    mutationFn: async () => {
      if (selectedVariations.size === 0) {
        throw new Error(t("priceTags.selectProductsError"));
      }

      // Call API to generate PDF (server will return blob/PDF)
      await api.post("/print/price-tags", {
        productVariationIds: Array.from(selectedVariations),
        template,
        includeQr,
        includeBarcode,
        includeLogo,
      });

      return true;
    },
    onSuccess: async () => {
      Alert.alert(t("common.success"), t("priceTags.generated"));
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const toggleSelection = useCallback((variationId: string) => {
    setSelectedVariations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(variationId)) {
        newSet.delete(variationId);
      } else {
        newSet.add(variationId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedVariations.size === allVariations.length) {
      setSelectedVariations(new Set());
    } else {
      setSelectedVariations(new Set(allVariations.map((v) => v.id)));
    }
  }, [allVariations, selectedVariations.size]);

  const handleGenerate = useCallback(() => {
    if (selectedVariations.size === 0) {
      Alert.alert(t("common.error"), t("priceTags.selectProductsError"));
      return;
    }

    Alert.alert(
      t("priceTags.confirmTitle"),
      t("priceTags.confirmMessage", { count: selectedVariations.size }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          onPress: () => generateTagsMutation.mutate(),
        },
      ]
    );
  }, [selectedVariations.size, t, generateTagsMutation]);

  const renderVariation = useCallback(
    ({ item }: { item: ProductVariation }) => {
      const isSelected = selectedVariations.has(item.id);
      return (
        <TouchableOpacity
          style={[
            styles.variationCard,
            {
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: isSelected ? colors.primary : "transparent",
            },
          ]}
          onPress={() => toggleSelection(item.id)}
        >
          <View style={styles.variationHeader}>
            <View style={styles.variationInfo}>
              <Text style={[styles.productName, { color: colors.textPrimary }]}>
                {item.product.name}
              </Text>
              <Text
                style={[styles.variationName, { color: colors.textSecondary }]}
              >
                {item.name}
              </Text>
              <Text style={[styles.barcode, { color: colors.textSecondary }]}>
                {item.barcode}
              </Text>
            </View>
            <View style={styles.checkboxContainer}>
              {isSelected ? (
                <CheckSquare size={24} color={colors.primary} />
              ) : (
                <Square size={24} color={colors.textSecondary} />
              )}
            </View>
          </View>

          <Text style={[styles.price, { color: colors.textPrimary }]}>
            {item.selling_price.toLocaleString()} {t("common.currency")}
          </Text>
        </TouchableOpacity>
      );
    },
    [colors, t, selectedVariations, toggleSelection]
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="price-tags-screen"
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Selection Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statsText, { color: colors.textPrimary }]}>
            {t("priceTags.selectedCount", { count: selectedVariations.size })}
          </Text>
          <TouchableOpacity
            style={[
              styles.selectAllButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={toggleSelectAll}
          >
            <Text style={styles.selectAllText}>
              {selectedVariations.size === allVariations.length
                ? t("priceTags.deselectAll")
                : t("priceTags.selectAll")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Template Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("priceTags.templateLabel")}
          </Text>

          <View style={styles.templateButtons}>
            {["small", "medium", "large"].map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.templateButton,
                  {
                    backgroundColor:
                      template === size
                        ? colors.primary
                        : colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  setTemplate(size as "small" | "medium" | "large")
                }
              >
                <View
                  style={[
                    styles.templatePreview,
                    {
                      width:
                        size === "small" ? 40 : size === "medium" ? 60 : 80,
                      height:
                        size === "small" ? 30 : size === "medium" ? 45 : 60,
                      borderColor:
                        template === size ? "#fff" : colors.textSecondary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.templateText,
                    {
                      color: template === size ? "#fff" : colors.textPrimary,
                    },
                  ]}
                >
                  {t(`priceTags.template.${size}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Options */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("priceTags.options")}
          </Text>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIncludeQr(!includeQr)}
          >
            <View style={styles.optionIcon}>
              <QrCode size={24} color={colors.primary} />
            </View>
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>
              {t("priceTags.includeQr")}
            </Text>
            {includeQr ? (
              <CheckSquare size={24} color={colors.primary} />
            ) : (
              <Square size={24} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIncludeBarcode(!includeBarcode)}
          >
            <View style={styles.optionIcon}>
              <BarcodeIcon size={24} color={colors.primary} />
            </View>
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>
              {t("priceTags.includeBarcode")}
            </Text>
            {includeBarcode ? (
              <CheckSquare size={24} color={colors.primary} />
            ) : (
              <Square size={24} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIncludeLogo(!includeLogo)}
          >
            <View style={styles.optionIcon}>
              <ImageIcon size={24} color={colors.primary} />
            </View>
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>
              {t("priceTags.includeLogo")}
            </Text>
            {includeLogo ? (
              <CheckSquare size={24} color={colors.primary} />
            ) : (
              <Square size={24} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Product Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("priceTags.selectProducts")}
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : allVariations.length > 0 ? (
            <FlatList
              data={allVariations}
              renderItem={renderVariation}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.variationsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("priceTags.noProducts")}
              </Text>
            </View>
          )}
        </View>

        {/* Generate Button */}
        {selectedVariations.size > 0 && (
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.success }]}
            onPress={handleGenerate}
            disabled={generateTagsMutation.isPending}
          >
            {generateTagsMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Printer size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  {t("priceTags.generate", { count: selectedVariations.size })}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 16,
  },
  statsText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectAllText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  templateButtons: {
    flexDirection: "row",
    gap: 12,
  },
  templateButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 12,
  },
  templatePreview: {
    borderWidth: 2,
    borderRadius: 4,
  },
  templateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  variationsList: {
    gap: 12,
  },
  variationCard: {
    padding: 16,
    borderRadius: 12,
  },
  variationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  variationInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  variationName: {
    fontSize: 14,
    marginBottom: 4,
  },
  barcode: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  checkboxContainer: {
    marginLeft: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
