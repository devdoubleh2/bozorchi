import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  NavigationProp,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { Package } from "lucide-react-native";
import { FasterImageView } from "@candlefinance/faster-image";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuthContext } from "@/context/AuthContext";
import { useShallow } from "zustand/shallow";
import { RootStackParamList } from "@/types/navigation";
import { formatPrice } from "@/src/utils/currency";

interface ProductVariation {
  id: string;
  name: string;
  image_url: string | null;
  selling_price: number;
  price?: number | null;
  unit: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

interface LowStockItem {
  id: string;
  product_variation_id: string;
  quantity_in_stock: number;
  store_id: string;
  product_variation: ProductVariation;
}

type RestockPayloadItem = {
  variationId: string;
  quantity: number;
  cost_price: number;
  price?: number;
  selling_price?: number;
};

const getImageUrl = (
  variationImageUrl: string | null | undefined,
  productImageUrl: string | null | undefined
): string => {
  if (variationImageUrl) return variationImageUrl;
  if (productImageUrl) return productImageUrl;
  return "";
};

const getDefaultCost = (variation: ProductVariation): number =>
  variation.price ?? 0;

export default function RestockScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Restock">>();
  const route = useRoute<RouteProp<RootStackParamList, "Restock">>();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { dataStore } = useAuthContext(
    useShallow((state) => ({
      dataStore: state.userStore,
    }))
  );

  const storeId = dataStore?.store?.id;
  const currency = dataStore?.store?.currency ?? "UZS";
  const cardBackground = isDark ? colors.surfaceSecondary : colors.surface;
  const mutedBackground = isDark ? colors.backgroundSecondary : "#F5F5F7";

  // Single item states instead of Record types
  const [quantity, setQuantity] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [supplierCost, setSupplierCost] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null);

  const {
    data: lowStockResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lowStock", storeId],
    queryFn: async (): Promise<{ lowStockItems: LowStockItem[] }> => {
      if (!storeId) return { lowStockItems: [] };
      const res = await api.get<{ lowStockItems: LowStockItem[] }>(
        `/api/inventory/low-stock?storeId=${storeId}&includeAll=true`
      );
      return res;
    },
    enabled: !!storeId,
  });

  const lowStockItems = lowStockResponse?.lowStockItems ?? [];

  // Initialize with first item or route params
  useEffect(() => {
    if (lowStockItems.length > 0 && !selectedItem) {
      const itemToSelect = lowStockItems[0];
      setSelectedItem(itemToSelect);
      setQuantity("");
      const defaultCost = getDefaultCost(
        itemToSelect.product_variation
      ).toString();
      setCost(defaultCost);
      setSupplierCost(defaultCost);
      setSellingPrice(
        itemToSelect.product_variation.selling_price > 0
          ? itemToSelect.product_variation.selling_price.toString()
          : ""
      );
    }
  }, [lowStockItems, selectedItem]);

  const restockMutation = useMutation<unknown, Error, RestockPayloadItem>({
    mutationFn: async (item) => {
      await api.post("/api/inventory/restock", item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["lowStock", storeId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      Alert.alert(t("common.success"), t("inventory.restockSuccess"));
      navigation.goBack();
    },
    onError: (mutationError: Error) => {
      Alert.alert(
        t("common.error"),
        mutationError.message || t("errors.generic")
      );
    },
  });

  const handleQuantityChange = (value: string) => {
    setQuantity(value.replace(/[^0-9]/g, ""));
  };

  const handleCostChange = (value: string) => {
    setCost(value.replace(/[^0-9.,]/g, "").replace(",", "."));
  };

  const handleSupplierCostChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.,]/g, "").replace(",", ".");
    setSupplierCost(sanitized);

    // Sync cost with supplier cost if they were equal
    if (cost === "" || cost === supplierCost) {
      setCost(sanitized);
    }
  };

  const handleSellingPriceChange = (value: string) => {
    setSellingPrice(value.replace(/[^0-9.,]/g, "").replace(",", "."));
  };

  const handleSubmit = () => {
    if (!selectedItem) {
      Alert.alert(t("common.info"), t("inventory.noItemsToRestock"));
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      Alert.alert(t("common.info"), t("inventory.enterValidQuantity"));
      return;
    }

    const parsedSupplierCost = parseFloat(supplierCost);
    const finalSupplierCost =
      Number.isFinite(parsedSupplierCost) && parsedSupplierCost > 0
        ? parsedSupplierCost
        : getDefaultCost(selectedItem.product_variation);

    const parsedCost = parseFloat(cost);
    const finalCost =
      Number.isFinite(parsedCost) && parsedCost > 0
        ? parsedCost
        : finalSupplierCost;

    const parsedSellingPrice = parseFloat(sellingPrice);
    const finalSellingPrice =
      Number.isFinite(parsedSellingPrice) && parsedSellingPrice > 0
        ? parsedSellingPrice
        : selectedItem.product_variation.selling_price;

    restockMutation.mutate({
      variationId: selectedItem.product_variation_id,
      quantity: qty,
      cost_price: finalCost,
      price: finalSupplierCost,
      selling_price: finalSellingPrice,
    });
  };

  if (!storeId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
            {t("errors.noStoreSelected")}
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: "#EF4444" }]}>
            {t("common.error")}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!selectedItem || lowStockItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.emptyContainer}>
          <Package size={64} color="#9CA3AF" />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
            {t("inventory.noItems") || t("lowStock.noLowStock")}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {t("inventory.addProductsFirst") || t("lowStock.allStocked")}
          </Text>
        </View>
      </View>
    );
  }

  const variation = selectedItem.product_variation;
  const qty = parseInt(quantity, 10) || 0;
  const finalCost =
    parseFloat(cost) || parseFloat(supplierCost) || getDefaultCost(variation);
  const total = qty * finalCost;
  const imageUrl = getImageUrl(
    variation.image_url,
    variation.product.image_url
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              {t("inventory.restock")}
            </Text>
            <Text
              style={[styles.heroSubtitle, { color: colors.textSecondary }]}
            >
              {t("inventory.dynamicCostingSubtitle")}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: cardBackground, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            {imageUrl ? (
              <FasterImageView
                source={{ url: imageUrl }}
                style={styles.productImage}
              />
            ) : (
              <View
                style={[
                  styles.productImage,
                  styles.placeholderImage,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6" },
                ]}
              >
                <Package size={28} color={isDark ? "#666" : "#9CA3AF"} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.textPrimary }]}>
                {variation.product.name}
              </Text>
              <Text
                style={[styles.variationName, { color: colors.textSecondary }]}
              >
                {variation.name}
              </Text>
              <Text style={[styles.stockText, { color: colors.textSecondary }]}>
                {t("inventory.currentStock")}: {selectedItem.quantity_in_stock}{" "}
                {variation.unit.name}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                {t("inventory.quantity")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: mutedBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                keyboardType="number-pad"
                placeholder={t("inventory.quantityPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={quantity}
                onChangeText={handleQuantityChange}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                {t("inventory.newCost")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: mutedBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                keyboardType="decimal-pad"
                placeholder={t("inventory.newCostPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={cost}
                onChangeText={handleCostChange}
              />
            </View>
          </View>

          <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                {t("products.cost")}
              </Text>
              <TextInput
                style={[
                  styles.metaInput,
                  {
                    backgroundColor: mutedBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                keyboardType="decimal-pad"
                placeholder={t("inventory.newCostPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={supplierCost}
                onChangeText={handleSupplierCostChange}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                {t("inventory.sellingPrice")}
              </Text>
              <TextInput
                style={[
                  styles.metaInput,
                  {
                    backgroundColor: mutedBackground,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                keyboardType="decimal-pad"
                placeholder={t("inventory.newCostPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={sellingPrice}
                onChangeText={handleSellingPriceChange}
              />
            </View>
          </View>

          <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                {t("inventory.totalAmount")}
              </Text>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                {formatPrice(total, currency)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: cardBackground,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            {t("inventory.totalAmount")}
          </Text>
          <Text style={[styles.footerValue, { color: colors.textPrimary }]}>
            {formatPrice(total, currency)}
          </Text>
          <Text style={[styles.footerHelper, { color: colors.textSecondary }]}>
            {t("inventory.unitsToImport")}: {qty}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: qty > 0 ? colors.primary : colors.border,
            },
          ]}
          onPress={handleSubmit}
          disabled={qty <= 0 || restockMutation.isPending}
        >
          {restockMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t("inventory.confirmRestock")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    paddingTop: 8,
  },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
  },
  variationName: {
    fontSize: 13,
    marginTop: 2,
  },
  stockText: {
    fontSize: 12,
    marginTop: 4,
  },
  fieldGroup: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  metaLabel: {
    fontSize: 12,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  metaInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  footerHelper: {
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
