import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FasterImageView } from "@candlefinance/faster-image";
import {
  ChevronRight,
  Plus,
  Edit,
  Box,
  Tag as TagIcon,
  Filter,
  ScanLine,
  Trash2,
} from "lucide-react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthContext } from "../context/AuthContext";
import { formatPrice } from "@/src/utils/currency";
import { statusColors } from "@/src/utils/sharedStyles";

const toTestId = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");
import { Unit } from "@/types";
import { ActiveFilters } from "./FilterInventory";
import BarcodeScanner from "@/src/components/BarcodeScanner";

type ProductVariation = {
  id: string;
  name: string;
  description: string | null;
  barcode: string;
  sku: string | null;
  price: number;
  selling_price: number;
  unit_id: string;
  color: string | null;
  product_id: string;
  store_id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  inventory: Array<{
    id: string;
    quantity_in_stock: number;
    created_at: string;
    updated_at: string | null;
  }>;
};

type Product = {
  id: string;
  name: string;
  image_url: string;
  category_id: string;
  product_category_id: string | null;
  store_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  };
  product_variations: ProductVariation[];
  category_name: string;
  variation_count: number;
  total_stock: number;
};

type InventoryListItem = {
  id: string;
  name: string;
  categoryName: string;
  imageUrl: string;
  inStock: number;
  outStock: number;
  totalVariations: number;
  lowStock: boolean;
  color: string;
  barcodes: string[];
  skus: (string | null)[];
  unitValueVariations: string[];
  variationColors: (string | null)[];
  product_variations: ProductVariation[];
};
type InventorySection = {
  title: string;
  data: InventoryListItem[];
};

export const inventorySearchHandlersRef = {
  onSearchChange: (text: string) => { },
  onSearchSubmit: (text: string) => { },
  onSearchCancel: () => { },
};

// Helper function to get the proper image URL with fallback logic
const getImageUrl = (
  variationImageUrl: string | null | undefined,
  productImageUrl: string | null | undefined
): string => {
  // Priority: variation image → product image → fallback
  if (variationImageUrl) return variationImageUrl;
  if (productImageUrl) return productImageUrl;
  // Return empty string for fallback (will use defaultSource)
  return "";
};

const getVariationStockStatus = (
  quantity: number,
  t: (key: string) => string
) => {
  if (quantity === 0) {
    return {
      status: "out",
      color: statusColors.error,
      label: t("inventory.outOfStock"),
    };
  }
  if (quantity <= 10) {
    return {
      status: "low",
      color: statusColors.warning,
      label: t("inventory.lowStock"),
    };
  }
  return {
    status: "good",
    color: statusColors.success,
    label: t("inventory.inStock"),
  };
};

const getStockStatus = (
  item: InventoryListItem,
  t: (key: string) => string
) => {
  if (item.inStock === 0) {
    return {
      status: "out",
      color: statusColors.error,
      label: t("inventory.outOfStock"),
    };
  }
  if (item.lowStock) {
    return {
      status: "low",
      color: statusColors.warning,
      label: t("inventory.lowStock"),
    };
  }
  return {
    status: "good",
    color: statusColors.success,
    label: t("inventory.inStock"),
  };
};

type ProductCategory = {
  id: string;
  name: string;
  color: string | null;
};

export const useInventoryState = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    stockStatus: [],
    colors: [],
    unitValues: [],
    priceRange: null,
    productCategoryColors: [],
    categoryNames: [],
  });
  const user = useAuthContext((state) => state.user);

  const {
    data: productCategoriesResponse,
    isLoading: productCategoriesLoading,
  } = useQuery({
    queryKey: ["product-categories", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not available");
      }

      const response = await api.get<{ productCategories: ProductCategory[] }>(
        "/api/product-categories"
      );
      return response.productCategories;
    },
    enabled: !!user?.id,
  });

  // Fetch products data with React Query
  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not available");
      }

      const response = await api.get<{ products: Product[] }>(
        "/api/products/list"
      );
      return response;
    },
    enabled: !!user?.id,
  });

  const { data: unitsResponse } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      try {
        const response = await api.get<{ units: Unit[] }>("/api/units");
        return response.units;
      } catch (error) {
        console.error("Error fetching units:", error);
        // Return empty array instead of undefined to prevent query data error
        return [];
      }
    },
    enabled: !!user?.id, // Only fetch when user is authenticated
    retry: false, // Disable retry to prevent rate limiting
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const products = productsResponse?.products || [];

  const {
    allColors,
    allUnitValues,
    allProductCategoryColors,
    allCategoryNames,
    priceRange,
  } = useMemo(() => {
    const colors = new Set<string>();
    const unitValues = new Set<string>();
    const productCategoryColors = new Set<string>();
    const categoryNames = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    products.forEach((product) => {
      const category = productCategoriesResponse?.find(
        (pc) => pc.id === product.product_category_id
      );
      if (category?.color) {
        productCategoryColors.add(category.color);
      }
      if (category?.name) {
        categoryNames.add(category.name);
      }

      product.product_variations.forEach((variation) => {
        if (variation.color) {
          colors.add(variation.color);
        }
        if (variation.name) {
          unitValues.add(variation.name);
        }
        if (variation.selling_price < minPrice) {
          minPrice = variation.selling_price;
        }
        if (variation.selling_price > maxPrice) {
          maxPrice = variation.selling_price;
        }
      });
    });

    return {
      allColors: [...colors],
      allUnitValues: [...unitValues],
      allProductCategoryColors: [...productCategoryColors],
      allCategoryNames: [...categoryNames],
      priceRange:
        minPrice !== Infinity && maxPrice !== -Infinity
          ? { min: minPrice, max: maxPrice }
          : null,
    };
  }, [products, productCategoriesResponse]);

  // Process products for display
  const processedInventory: InventoryListItem[] = useMemo(() => {
    if (!products) {
      return [];
    }

    return products.map((product) => {
      let inStock = 0;
      let outStock = 0;
      let hasLowStockVariation = false;
      const unitValueVariations: string[] = [];
      const variationColors: (string | null)[] = [];
      const barcodes: string[] = [];
      const skus: (string | null)[] = [];

      // Calculate stock from all variations
      product.product_variations.forEach((variation) => {
        const stockQuantity = variation.inventory.reduce(
          (sum, inv) => sum + inv.quantity_in_stock,
          0
        );

        if (stockQuantity > 0) {
          inStock += stockQuantity;
          if (stockQuantity <= 10) {
            hasLowStockVariation = true;
          }
        } else {
          outStock += 1;
        }
        if (variation.name) {
          unitValueVariations.push(variation.name);
        }
        if (variation.color) {
          variationColors.push(variation.color);
        }
        if (variation.barcode) {
          barcodes.push(variation.barcode);
        }
        skus.push(variation.sku);
      });

      // Generate color based on category
      const category = productCategoriesResponse?.find(
        (pc) => pc.id === product.product_category_id
      );
      const color = category?.color || "#6FCF97";

      const isLowStock = hasLowStockVariation || (inStock > 0 && inStock <= 10);

      return {
        id: product.id,
        name: product.name,
        categoryName: product.category_name || "No Category",
        imageUrl: product.image_url || "",
        inStock,
        outStock,
        totalVariations: product.product_variations.length,
        lowStock: isLowStock,
        color,
        barcodes,
        skus,
        unitValueVariations: [...new Set(unitValueVariations)],
        variationColors: [...new Set(variationColors)],
        product_variations: product.product_variations,
      };
    });
  }, [products, unitsResponse, productCategoriesResponse]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    const result = processedInventory.filter((product) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery.trim() ||
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.categoryName.toLowerCase().includes(lowerCaseQuery) ||
        product.barcodes.some((b) =>
          b.toLowerCase().includes(lowerCaseQuery)
        ) ||
        product.skus.some((s) => s && s.toLowerCase().includes(lowerCaseQuery));

      if (!searchMatch) return false;

      const stockStatusValue =
        product.inStock === 0 ? "out" : product.lowStock ? "low" : "good";
      const stockStatusMatch =
        activeFilters.stockStatus.length === 0 ||
        activeFilters.stockStatus.includes(stockStatusValue);

      if (!stockStatusMatch) return false;

      const colorMatch =
        activeFilters.colors.length === 0 ||
        product.variationColors.some(
          (c) => c && activeFilters.colors.includes(c)
        );

      if (!colorMatch) return false;

      const unitValueMatch =
        activeFilters.unitValues.length === 0 ||
        product.unitValueVariations.some((uv) =>
          activeFilters.unitValues.includes(uv)
        );

      if (!unitValueMatch) return false;

      const productCategoryColorMatch =
        activeFilters.productCategoryColors.length === 0 ||
        activeFilters.productCategoryColors.includes(product.color);

      if (!productCategoryColorMatch) return false;

      const categoryNameMatch =
        activeFilters.categoryNames.length === 0 ||
        activeFilters.categoryNames.includes(product.categoryName);

      if (!categoryNameMatch) return false;

      const priceMatch =
        !activeFilters.priceRange ||
        product.product_variations.some(
          (v) =>
            v.selling_price >= activeFilters.priceRange!.min &&
            v.selling_price <= activeFilters.priceRange!.max
        );

      return priceMatch;
    });
    return result;
  }, [processedInventory, searchQuery, activeFilters]);

  // Group products by category for SectionList
  const groupedProducts: InventorySection[] = useMemo(() => {
    const sections = filteredProducts.reduce((sections, product) => {
      const existingSection = sections.find(
        (section) => section.title === product.categoryName
      );

      if (existingSection) {
        existingSection.data.push(product);
      } else {
        sections.push({
          title: product.categoryName,
          data: [product],
        });
      }

      return sections;
    }, [] as InventorySection[]);

    // Sort sections alphabetically
    sections.sort((a, b) => a.title.localeCompare(b.title));
    return sections;
  }, [filteredProducts]);

  const handleRefresh = useCallback(() => {
    refetchProducts();
  }, [refetchProducts]);

  return {
    searchQuery,
    setSearchQuery,
    inventory: groupedProducts,
    isLoading: productsLoading || productCategoriesLoading,
    error: productsError,
    handleRefresh,
    products,
    activeFilters,
    setActiveFilters,
    allColors,
    allUnitValues,
    allProductCategoryColors,
    allCategoryNames,
    priceRange,
  };
};

export default function InventoryScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    inventory,
    isLoading,
    error,
    handleRefresh,
    products,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    allColors,
    allUnitValues,
    allProductCategoryColors,
    allCategoryNames,
    priceRange,
  } = useInventoryState();
  const user = useAuthContext((state) => state.user);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const productDetailsRef = useRef<BottomSheetModal>(null);

  const queryClient = useQueryClient();

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => api.delete(`/api/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["store"] });
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      Alert.alert(
        t("common.error"),
        t("inventory.deleteError", "Failed to delete product.")
      );
    },
  });

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      t("inventory.deleteConfirmationTitle", "Delete Product"),
      t(
        "inventory.deleteConfirmationMessage",
        "Are you sure you want to delete this product? This will also delete all related transactions. This action cannot be undone."
      ),
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete", "Delete"),
          style: "destructive",
          onPress: () => deleteProductMutation.mutate(productId),
        },
      ]
    );
  };

  // Get user store info for transactions
  const { data: userStoreInfo } = useQuery({
    queryKey: ["store", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await api.get<{
        data: {
          user_id: string;
          store_id: string;
          role: string;
          store: { id: string; name: string };
        };
      }>("/api/stores/my-store");
      return res.data;
    },
    enabled: !!user?.id,
  });

  const handleProductPress = (item: InventoryListItem) => {
    const product = products.find((p) => p.id === item.id);
    if (product) {
      setSelectedProduct(product);
      productDetailsRef.current?.present();
    }
  };

  // Fetch transactions for selected product
  const { data: productTransactions, isLoading: transactionsLoading } =
    useQuery({
      queryKey: [
        "product-transactions",
        selectedProduct?.id,
        userStoreInfo?.store?.id,
      ],
      queryFn: async () => {
        if (!selectedProduct || !userStoreInfo?.store?.id) {
          return [];
        }

        const storeId = userStoreInfo.store.id;
        const variationIds = selectedProduct.product_variations.map(
          (v) => v.id
        );

        const response = await api.get<{
          transactions: {
            id: string;
            quantity: number;
            total_amount: number;
            transaction_type: string;
            transaction_date: string;
            user_id: string | null;
            user?:
            | { id: string; name?: string | null; email?: string | null }
            | null;
            user_email?: string | null;
            user_name?: string | null;
            product_variation_id: string;
            variation_name: string;
            selling_price: number;
            delivery_cost: number;
          }[];
        }>(`/api/transactions?store_id=${storeId}`);

        // Filter and sort transactions for this product's variations
        return response.transactions
          .filter((t) => variationIds.includes(t.product_variation_id))
          .sort(
            (a, b) =>
              new Date(b.transaction_date).getTime() -
              new Date(a.transaction_date).getTime()
          );
      },
      enabled: !!selectedProduct && !!userStoreInfo?.store?.id,
    });

  const handleCloseDetails = () => {
    productDetailsRef.current?.dismiss();
    setSelectedProduct(null);
  };

  const handleApplyFilters = (filters: ActiveFilters) => {
    setActiveFilters(filters);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    setShowScanner(false);
  };

  useEffect(() => {
    inventorySearchHandlersRef.onSearchChange = (text: string) => {
      setSearchQuery(text);
    };
    inventorySearchHandlersRef.onSearchSubmit = (text: string) => {
      setSearchQuery(text);
    };
    inventorySearchHandlersRef.onSearchCancel = () => {
      setSearchQuery("");
    };
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={headerStyles.container}>
          <TouchableOpacity
            onPress={() => setShowScanner(true)}
            style={{ marginRight: 16 }}
            disabled={isLoading}
          >
            <ScanLine
              size={20}
              color={isLoading ? colors.border : isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isLoading}
            onPress={() => {
              if (isLoading) return;
              navigation.navigate("FilterInventory", {
                initialFilters: activeFilters,
                allColors: allColors,
                allUnitValues: allUnitValues,
                allProductCategoryColors: allProductCategoryColors,
                allCategoryNames: allCategoryNames,
                priceRange: priceRange,
                onApply: handleApplyFilters,
              });
            }}
          >
            <Filter
              size={20}
              color={isLoading ? colors.border : isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [
    navigation,
    activeFilters,
    allColors,
    allUnitValues,
    allProductCategoryColors,
    allCategoryNames,
    priceRange,
    handleApplyFilters,
    isDark,
    setShowScanner,
    isLoading,
    colors.border,
  ]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      >
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: "#00000080" }]}
        />
      </BottomSheetBackdrop>
    ),
    [isDark]
  );

  const getTransactionPerformer = useCallback(
    (transaction: {
      user?: { name?: string | null; email?: string | null } | null;
      user_id: string | null;
      user_email?: string | null;
      user_name?: string | null;
    }) => {
      const name =
        transaction.user_name?.trim() || transaction.user?.name?.trim();
      if (name) return name;

      const email =
        transaction.user_email?.trim() || transaction.user?.email?.trim();
      if (email) return email;

      if (transaction.user_id && transaction.user_id === user?.id) {
        return user?.email || t("common.notSpecified");
      }

      if (transaction.user_id) {
        return t("common.notSpecified");
      }

      return t("common.system");
    },
    [t, user?.email, user?.id]
  );

  const renderProduct = ({ item }: { item: InventoryListItem }) => {
    const stockStatus = getStockStatus(item, t);


    const renderRightActions = () => (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity
          style={[
            styles.rightAction,
            { backgroundColor: statusColors.warning },
          ]}
          onPress={() =>
            navigation.navigate("EditProduct", { productId: item.id })
          }
          testID={`inventory-edit-product-${toTestId(item.name)}`}
        >
          <Edit size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rightAction, { backgroundColor: statusColors.error }]}
          onPress={() => handleDeleteProduct(item.id)}
          testID={`inventory-delete-product-${toTestId(item.name)}`}
        >
          <Trash2 size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: isDark
                ? colors.surfaceSecondary
                : colors.background,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() => handleProductPress(item)}
          testID={`inventory-product-${toTestId(item.name)}`}
        >
          <FasterImageView
            source={{
              url: item.imageUrl || "",
              cachePolicy: "discWithCacheControl",
              transitionDuration: 0.3,
            }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text
              style={[styles.productName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.stockInfo}>
              <View
                style={[
                  styles.stockIndicator,
                  { backgroundColor: stockStatus.color },
                ]}
              />
              <Text
                style={[styles.stockStatusText, { color: stockStatus.color }]}
              >
                {stockStatus.label}
              </Text>
              <View style={styles.tagsContainer}>
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: stockStatus.color + "20" },
                  ]}
                >
                  <Box size={12} color={stockStatus.color} />
                  <Text
                    style={[
                      styles.tagText,
                      { color: stockStatus.color, marginLeft: 4 },
                    ]}
                  >
                    {item.inStock}
                  </Text>
                </View>
                {item.unitValueVariations.slice(0, 2).map((value) => (
                  <View
                    key={value}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundSecondary
                          : colors.backgroundSecondary,
                      },
                    ]}
                  >
                    <TagIcon size={12} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.tagText,
                        { color: colors.textPrimary, marginLeft: 4 },
                      ]}
                    >
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.trailingContainer}>
            <ChevronRight
              size={20}
              color={colors.border}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderSectionHeader = ({ section }: { section: InventorySection }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {section.title.toUpperCase()}
      </Text>
    </View>
  );

  const VariationItem = ({
    variation,
    productImageUrl,
    isDark,
  }: {
    variation: ProductVariation;
    productImageUrl: string | null | undefined;
    isDark: boolean;
  }) => {
    const stock = variation.inventory.reduce(
      (sum, inv) => sum + inv.quantity_in_stock,
      0
    );
    const stockStatus = getVariationStockStatus(stock, t);

    return (
      <View style={styles.variationRow}>
        <FasterImageView
          source={{
            url: getImageUrl(variation.image_url, productImageUrl),
            cachePolicy: "discWithCacheControl",
            transitionDuration: 0.2,
          }}
          style={styles.variationImage}
        />
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <View
            style={[
              styles.stockIndicator,
              { backgroundColor: stockStatus.color, marginRight: 12 },
            ]}
          />
          <View>
            <Text style={[styles.variationName, { color: colors.textPrimary }]}>
              {variation.name}
            </Text>
            {variation.name && (
              <Text
                style={[styles.variationUnit, { color: colors.textSecondary }]}
              >
                {variation.name}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.variationStockInfo}>
          <Text style={[styles.variationStock, { color: stockStatus.color }]}>
            {stock}
          </Text>
        </View>
        <Text style={[styles.variationPrice, { color: colors.textPrimary }]}>
          {formatPrice(variation.selling_price)}
        </Text>
      </View>
    );
  };
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            {t("common.error")} {t("common.loading")}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => handleRefresh()}
          >
            <Text
              style={[styles.retryButtonText, { color: colors.textInverse }]}
            >
              {t("common.tryAgain")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        testID="inventory-screen"
      >
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
              {t("common.loading")} {t("inventory.title")}...
            </Text>
          </View>
        ) : (
          <SectionList
            sections={inventory}
            renderItem={renderProduct}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={handleRefresh}
            stickySectionHeadersEnabled={false}
            // Performance optimizations
            windowSize={10}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={Platform.OS === "android"}
            initialNumToRender={15}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
                  {searchQuery
                    ? t("inventory.productsNotFound")
                    : t("common.noData")}
                </Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: colors.primary,
              bottom: 32 + insets.bottom,
            },
          ]}
          onPress={() => navigation.navigate("AddProduct" as never)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="inventory-add-product-button"
        >
          <Plus size={28} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        ref={productDetailsRef}
        index={0}
        snapPoints={["75%", "95%"]}
        onDismiss={handleCloseDetails}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
        }}
        backgroundStyle={{
          backgroundColor: colors.background,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContainer}
        >
          {selectedProduct && (
            <>
              <View style={styles.bottomSheetHeader}>
                <Text
                  style={[
                    styles.bottomSheetProductName,
                    { color: colors.textPrimary },
                  ]}
                >
                  {selectedProduct.name}
                </Text>
                <Text
                  style={[
                    styles.bottomSheetVariationName,
                    { color: colors.textSecondary },
                  ]}
                >
                  {selectedProduct.category_name}
                </Text>
              </View>

              <FasterImageView
                source={{
                  url: selectedProduct.image_url || "",
                  cachePolicy: "discWithCacheControl",
                  transitionDuration: 0.3,
                }}
                style={styles.bottomSheetImage}
              />

              <View
                style={[
                  styles.detailGroup,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.background,
                  },
                ]}
              >
                {selectedProduct.product_variations.map((variation, index) => (
                  <React.Fragment key={variation.id}>
                    <VariationItem
                      variation={variation}
                      productImageUrl={selectedProduct.image_url}
                      isDark={isDark}
                    />
                    {index < selectedProduct.product_variations.length - 1 && (
                      <View
                        style={[
                          styles.detailRowSeparator,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>

              {/* Transaction History Section */}
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                {t("inventory.transactionHistory")}
              </Text>
              {transactionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : productTransactions && productTransactions.length > 0 ? (
                <View
                  style={[
                    styles.detailGroup,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.background,
                    },
                  ]}
                >
                  {productTransactions.map((transaction, index) => {
                    const variation = selectedProduct.product_variations.find(
                      (v) => v.id === transaction.product_variation_id
                    );
                    const transactionDate = new Date(
                      transaction.transaction_date
                    );
                    const isSale =
                      transaction.transaction_type === "export" ||
                      transaction.transaction_type === "debt";
                    const typeColor = transaction.transaction_type === "import"
                      ? "#34C759"
                      : isSale
                        ? "#FF3B30"
                        : "#FF9500";

                    return (
                      <React.Fragment key={transaction.id}>
                        <View style={styles.transactionRow}>
                          <View style={styles.transactionInfo}>
                            <View style={styles.transactionHeader}>
                              <View
                                style={[
                                  styles.transactionTypeIndicator,
                                  { backgroundColor: typeColor },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.transactionType,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {t(
                                  `transactions.types.${transaction.transaction_type}`
                                )}
                              </Text>
                              <Text
                                style={[
                                  styles.transactionDate,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {transactionDate.toLocaleDateString()} •{" "}
                                {transactionDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.transactionVariation,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {variation?.name || t("common.unknownVariation")}
                            </Text>
                            <Text
                              style={[
                                styles.transactionUser,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {t("inventory.performedBy")}:{" "}
                              {getTransactionPerformer(transaction)}
                            </Text>
                          </View>
                          <View style={styles.transactionAmounts}>
                            <Text
                              style={[
                                styles.transactionQuantity,
                                { color: typeColor },
                              ]}
                            >
                              {isSale ? "-" : "+"}
                              {transaction.quantity}
                            </Text>
                            <Text
                              style={[
                                styles.transactionAmount,
                                { color: colors.textPrimary },
                              ]}
                            >
                              {formatPrice(transaction.total_amount)}
                            </Text>
                          </View>
                        </View>
                        {index < productTransactions.length - 1 && (
                          <View
                            style={[
                              styles.detailRowSeparator,
                              { backgroundColor: colors.border },
                            ]}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              ) : (
                <View
                  style={[
                    styles.detailGroup,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.background,
                    },
                    styles.emptyTransactions,
                  ]}
                >
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    {t("inventory.noTransactionHistory")}
                  </Text>
                </View>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </GestureHandlerRootView>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 120,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 32,
    fontSize: 14,
    color: "#fff",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#E5E5EA",
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockStatusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  trailingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "400",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 17,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 17,
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    // bottom is set dynamically with safe area insets
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    // Add shadow for better visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheetContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  bottomSheetHeader: {
    paddingVertical: 8,
    alignItems: "center",
  },
  bottomSheetProductName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomSheetVariationName: {
    fontSize: 16,
    marginTop: 4,
    textAlign: "center",
  },
  bottomSheetImage: {
    height: 200,
    borderRadius: 12,
    backgroundColor: "#E5E5EA",
    marginVertical: 16,
  },
  detailGroup: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  detailRowSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  variationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  variationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#E5E5EA",
  },
  variationName: {
    fontSize: 16,
    fontWeight: "600",
  },
  variationUnit: {
    fontSize: 14,
    marginTop: 2,
  },
  variationStockInfo: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  variationStock: {
    fontSize: 16,
    fontWeight: "600",
  },
  variationPrice: {
    fontSize: 16,
    fontWeight: "500",
  },
  rightActionsContainer: {
    flexDirection: "row",
  },
  rightAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  transactionTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 8,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionVariation: {
    fontSize: 13,
    marginTop: 2,
  },
  transactionUser: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmounts: {
    alignItems: "flex-end",
  },
  transactionQuantity: {
    fontSize: 16,
    fontWeight: "700",
  },
  transactionAmount: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyTransactions: {
    padding: 24,
    alignItems: "center",
  },
});
