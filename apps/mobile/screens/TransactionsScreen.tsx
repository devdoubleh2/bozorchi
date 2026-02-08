import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FasterImageView } from "@candlefinance/faster-image";
import {
  AlertCircle,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Undo2,
  X,
  Repeat2,
  Zap,
  ArrowRightLeft,
  RotateCcw,
  TrendingUp,
} from "lucide-react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { useTheme } from "../context/ThemeContext";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductCategory, TransactionType, TransactionWithDetails, TransactionsResponse } from "@/types";
import { useAuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import DateTimePicker, { DateType, useDefaultStyles } from "react-native-ui-datepicker";


// Helper to check if transaction is a sale
const isSaleTransaction = (type?: TransactionType | string | null) =>
  type === "export" || type === "debt";

// Check if transaction increases inventory (money going out)
const isInventoryIncrease = (type?: TransactionType | string | null) =>
  type === "import" || type === "return" || type === "transfer_in" || type === "supplier_return";

const toTestId = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const transactionsSearchHandlersRef = {
  onSearchChange: (text: string) => { },
  onSearchSubmit: (text: string) => { },
  onSearchCancel: () => { },
  onFilterPress: () => { }, // Add filter handler
};

// Helper function to get the proper image URL with fallback logic
const getImageUrl = (
  variationImageUrl: string | null | undefined,
  productImageUrl: string | null | undefined
): string => {
  if (variationImageUrl) return variationImageUrl;
  if (productImageUrl) return productImageUrl;
  return "";
};

type IconProps = {
  size?: number;
  color?: string;
  style?: object;
};

type TranslationFunction = (key: string) => string;

const getTransactionTypeDetails = (
  type: TransactionType,
  t: TranslationFunction
) => {
  switch (type) {
    case "export":
      return {
        label: t("transactions.types.export"),
        color: "#FF3B30",
        Icon: (props: IconProps) => <ArrowUpRight {...props} />,
      };
    case "import":
      return {
        label: t("transactions.types.import"),
        color: "#34C759",
        Icon: (props: IconProps) => <ArrowDownLeft {...props} />,
      };
    case "return":
      return {
        label: t("transactions.types.return"),
        color: "#FF9500",
        Icon: (props: IconProps) => <Undo2 {...props} />,
      };
    case "debt":
      return {
        label: t("transactions.types.debt"),
        color: "#AF52DE",
        Icon: (props: IconProps) => <ArrowUpRight {...props} />,
      };
    case "repayment":
      return {
        label: t("transactions.types.repayment"),
        color: "#007AFF",
        Icon: (props: IconProps) => <RotateCcw {...props} />,
      };
    case "exchange":
      return {
        label: t("transactions.types.exchange"),
        color: "#5AC8FA",
        Icon: (props: IconProps) => <Repeat2 {...props} />,
      };
    case "adjustment":
      return {
        label: t("transactions.types.adjustment"),
        color: "#FF9500",
        Icon: (props: IconProps) => <Zap {...props} />,
      };
    case "transfer_in":
      return {
        label: t("transactions.types.transfer_in"),
        color: "#30D158",
        Icon: (props: IconProps) => <ArrowRightLeft {...props} />,
      };
    case "transfer_out":
      return {
        label: t("transactions.types.transfer_out"),
        color: "#5856D6",
        Icon: (props: IconProps) => <ArrowRightLeft {...props} />,
      };
    case "internal_use":
      return {
        label: t("transactions.types.internal_use"),
        color: "#8E8E93",
        Icon: (props: IconProps) => <Zap {...props} />,
      };
    case "supplier_return":
      return {
        label: t("transactions.types.supplier_return"),
        color: "#34C759",
        Icon: (props: IconProps) => <TrendingUp {...props} />,
      };
    default:
      return {
        label: t("transactions.types.unknown"),
        color: "#8E8E93",
        Icon: (props: IconProps) => <Receipt {...props} />,
      };
  }
};

export default function TransactionsScreen() {
  type StatusFilter = "all" | TransactionType;
  type CategoryFilter = "all" | string;

  const [searchQuery, setSearchQuery] = useState("");
  const { isDark, colors } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const storeData = useAuthContext((state) => state.userStore);
  const queryClient = useQueryClient();
  const PAGE_SIZE = 20;

  // Return quantity modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTransaction, setReturnTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [returnQuantity, setReturnQuantity] = useState("");

  // Date Filter State
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["70%", "95%"], []);
  const defaultDatePickerStyles = useDefaultStyles(isDark ? "dark" : "light");
  const datePickerStyles = useMemo(
    () => ({
      ...defaultDatePickerStyles,
      headerButton: {
        ...(defaultDatePickerStyles as any)?.headerButton,
        tintColor: isDark ? "#F9FAFB" : "#111827",
      },
      headerButtonText: {
        ...(defaultDatePickerStyles as any)?.headerButtonText,
        color: isDark ? "#F9FAFB" : "#111827",
      },
      headerButtonIcon: {
        ...(defaultDatePickerStyles as any)?.headerButtonIcon,
        color: isDark ? "#F9FAFB" : "#111827",
      },
      headerText: {
        ...(defaultDatePickerStyles as any)?.headerText,
        color: isDark ? "#F9FAFB" : "#111827",
      },
    }),
    [defaultDatePickerStyles, isDark]
  );

  // Default to Current Month
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });

  // Status filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");

  // Temp state for modal
  const [tempDateRange, setTempDateRange] = useState<{
    startDate: DateType;
    endDate: DateType;
  }>({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const [tempStatusFilter, setTempStatusFilter] =
    useState<StatusFilter>(statusFilter);
  const [tempCategoryFilter, setTempCategoryFilter] =
    useState<CategoryFilter>(categoryFilter);

  const resolveDate = useCallback((value: DateType | undefined | null, fallback: Date) => {
    if (!value) return fallback;
    if (value instanceof Date) return value;
    if (typeof value === "object" && "toDate" in value) {
      const maybeDate = (value as { toDate?: () => Date }).toDate?.();
      if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) {
        return maybeDate;
      }
    }
    const parsed = new Date(value as any);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }, []);


  const handlePresentModalPress = useCallback(() => {
    setTempDateRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    setTempStatusFilter(statusFilter);
    setTempCategoryFilter(categoryFilter);
    bottomSheetModalRef.current?.present();
  }, [dateRange, statusFilter, categoryFilter]);

  const handleApplyFilters = useCallback(() => {
    const nextStart = resolveDate(tempDateRange.startDate, dateRange.startDate);
    const nextEnd = resolveDate(tempDateRange.endDate, dateRange.endDate);
    setDateRange({
      startDate: nextStart,
      endDate: nextEnd < nextStart ? nextStart : nextEnd,
    });
    setStatusFilter(tempStatusFilter);
    setCategoryFilter(tempCategoryFilter);
    bottomSheetModalRef.current?.dismiss();
  }, [tempDateRange, tempStatusFilter, tempCategoryFilter, resolveDate, dateRange]);

  const handleResetFilters = useCallback(() => {
    const defaultRange = {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date()
    };
    setTempDateRange(defaultRange);
    setDateRange(defaultRange);
    setTempStatusFilter("all");
    setStatusFilter("all");
    setTempCategoryFilter("all");
    setCategoryFilter("all");
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const statusOptions = useMemo(
    () => [
      { value: "all" as const, label: t("common.all") },
      { value: "export" as const, label: t("transactions.types.export") },
      { value: "import" as const, label: t("transactions.types.import") },
      { value: "return" as const, label: t("transactions.types.return") },
      { value: "debt" as const, label: t("transactions.types.debt") },
      { value: "repayment" as const, label: t("transactions.types.repayment") },
      { value: "exchange" as const, label: t("transactions.types.exchange") },
      { value: "adjustment" as const, label: t("transactions.types.adjustment") },
      { value: "transfer_in" as const, label: t("transactions.types.transfer_in") },
      { value: "transfer_out" as const, label: t("transactions.types.transfer_out") },
      { value: "internal_use" as const, label: t("transactions.types.internal_use") },
      { value: "supplier_return" as const, label: t("transactions.types.supplier_return") },
    ],
    [t]
  );

  const { data: productCategories = [] } = useQuery({
    queryKey: ["product-categories", storeData?.store?.id],
    queryFn: async (): Promise<ProductCategory[]> => {
      const response = await api.get<{ productCategories: ProductCategory[] }>(
        "/api/product-categories"
      );
      return response.productCategories;
    },
    enabled: !!storeData?.store?.id,
  });

  const categoryOptions = useMemo(
    () => [
      { value: "all" as const, label: t("common.all"), color: null },
      ...productCategories.map((category) => ({
        value: category.id,
        label: category.name,
        color: category.color ?? null,
      })),
    ],
    [productCategories, t]
  );

  useEffect(() => {
    transactionsSearchHandlersRef.onSearchChange = (text: string) => {
      setSearchQuery(text);
    };
    transactionsSearchHandlersRef.onSearchSubmit = (text: string) => {
      setSearchQuery(text);
    };
    transactionsSearchHandlersRef.onSearchCancel = () => {
      setSearchQuery("");
      // Reset dates on cancel? Maybe keep them.
    };
    transactionsSearchHandlersRef.onFilterPress = handlePresentModalPress;
  }, [handlePresentModalPress]);

  const fetchTransactions = async ({ pageParam = 0 }): Promise<TransactionsResponse> => {
    if (!storeData?.store?.id) throw new Error("No store selected");

    const limit = PAGE_SIZE;
    const offset = pageParam * limit;

    // Construct query parameters
    const params = new URLSearchParams({
      store_id: storeData.store.id,
      limit: String(limit),
      offset: String(offset),
      start_date: dateRange.startDate.toISOString(),
      end_date: dateRange.endDate.toISOString(),
    });

    if (searchQuery) {
      params.append("search", searchQuery);
    }
    if (statusFilter !== "all") {
      params.append("transaction_type", statusFilter);
    }
    if (categoryFilter !== "all") {
      params.append("category_id", categoryFilter);
    }

    const response = await api.get<TransactionsResponse>(`/api/transactions?${params.toString()}`);
    return response;
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: [
      "transactions",
      storeData?.store?.id,
      searchQuery,
      dateRange.startDate.toISOString(),
      dateRange.endDate.toISOString(),
      statusFilter,
      categoryFilter,
    ],
    queryFn: fetchTransactions,
    getNextPageParam: (lastPage, allPages) => {
      const pagination = lastPage.pagination;
      if (pagination?.page !== undefined && pagination?.pages !== undefined) {
        return pagination.page < pagination.pages ? pagination.page : undefined;
      }

      if (typeof pagination?.total === "number") {
        const loadedCount = allPages.reduce(
          (sum, page) => sum + page.transactions.length,
          0
        );
        return loadedCount < pagination.total ? allPages.length : undefined;
      }

      return lastPage.transactions.length >= PAGE_SIZE
        ? allPages.length
        : undefined;
    },
    initialPageParam: 0,
    enabled: !!storeData?.store?.id,
  });

  const transactions = useMemo(() => {
    return data?.pages.flatMap((page) => page.transactions) || [];
  }, [data]);

  // Mutation for returning transactions
  const returnTransactionMutation = useMutation({
    mutationFn: async ({
      transactionId,
      quantity,
    }: {
      transactionId: string;
      quantity?: number;
    }) => {
      const response = await api.post<{
        message: string;
        transaction: TransactionWithDetails;
      }>(`/api/transactions/${transactionId}/return`, {
        quantity,
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      setShowReturnModal(false);
      setReturnTransaction(null);
      setReturnQuantity("");
      Alert.alert(t("common.success"), t("transactions.returnSuccess"));
    },
    onError: (error: Error) => {
      console.error("Return transaction error:", error);
      const err = error as Error & {
        response?: { data?: { message?: string } };
      };
      Alert.alert(
        t("common.error"),
        err.response?.data?.message || t("transactions.returnError")
      );
    },
  });

  const formatPrice = useCallback(
    (price: number) => {
      return new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency: storeData?.store?.currency || "UZS",
        minimumFractionDigits: 0,
      }).format(price);
    },
    [i18n.language, storeData?.store?.currency]
  );

  const handleReturnTransactionClick = useCallback(
    (transaction: TransactionWithDetails) => {
      setReturnTransaction(transaction);
      setReturnQuantity(String(transaction.quantity));
      setShowReturnModal(true);
    },
    []
  );

  const handleConfirmReturn = useCallback(() => {
    if (!returnTransaction) return;

    const qty = parseInt(returnQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert(t("common.error"), t("transactions.invalidQuantity"));
      return;
    }

    if (qty > returnTransaction.quantity) {
      Alert.alert(t("common.error"), t("transactions.quantityExceedsOriginal"));
      return;
    }

    returnTransactionMutation.mutate({
      transactionId: returnTransaction.id,
      quantity: qty,
    });
  }, [returnTransaction, returnQuantity, t, returnTransactionMutation]);

  const handleGoToPOS = useCallback(() => {
    navigation.navigate("POS" as never);
  }, [navigation]);

  const renderTransactionItem = useCallback(
    ({ item: tx }: { item: TransactionWithDetails }) => {
      const typeDetails = getTransactionTypeDetails(tx.transaction_type, t);
      const isSale = isSaleTransaction(tx.transaction_type);

      const renderRightActions = () => {
        if (!isSale) return null;
        return (
          <View style={styles.rightActionsContainer}>
            <TouchableOpacity
              style={[styles.rightAction, styles.returnAction]}
              onPress={() => handleReturnTransactionClick(tx)}
              testID={`transactions-return-${toTestId(tx.product_name)}`}
            >
              <Undo2 size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        );
      };

      return (
        <Swipeable renderRightActions={renderRightActions}>
          <View
            style={[
              styles.txCard,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderColor: isDark ? "#38383A" : "#E5E5EA",
              },
            ]}
            testID={`transactions-item-${toTestId(tx.product_name)}`}
          >
            <View style={styles.txHeader}>
              <View style={styles.txHeaderLeft}>
                <typeDetails.Icon size={16} color={typeDetails.color} style={{ marginRight: 6 }} />
                <Text style={[styles.txType, { color: typeDetails.color }]}>
                  {typeDetails.label}
                </Text>
              </View>
              <Text style={[styles.txDate, { color: isDark ? "#888" : "#666" }]}>
                {new Date(tx.transaction_date).toLocaleString()}
              </Text>
            </View>

            <View style={styles.txContent}>
              <FasterImageView
                source={{
                  url: getImageUrl(tx.variation_image_url, tx.product_image_url),
                  cachePolicy: "discWithCacheControl",
                  transitionDuration: 0.3,
                }}
                style={styles.txImage}
              />
              <View style={styles.txDetails}>
                <Text style={[styles.productName, { color: isDark ? "#FFF" : "#000" }]} numberOfLines={1}>
                  {tx.product_name}
                </Text>
                <Text style={[styles.variationName, { color: isDark ? "#aaa" : "#666" }]} numberOfLines={1}>
                  {tx.variation_name} {tx.customer_name ? `• ${tx.customer_name}` : ''}
                </Text>
                <View style={styles.txMeta}>
                  <Text style={[styles.txQuantity, { color: isDark ? "#ccc" : "#444" }]}>
                    {tx.quantity} {tx.unit_name} x {formatPrice(tx.unit_price)}
                  </Text>
                </View>
              </View>
              <View style={styles.txAmountContainer}>
                <Text style={[styles.txTotalAmount, { color: typeDetails.color }]}>
                  {isInventoryIncrease(tx.transaction_type) ? "-" : "+"}{formatPrice(tx.total_amount)}
                </Text>
              </View>
            </View>
          </View>
        </Swipeable>
      );
    },
    [isDark, t, formatPrice, handleReturnTransactionClick]
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
      </View>
    );
  };

  if (isError) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#F2F2F7" },
        ]}
      >
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#EB5757" />
          <Text style={[styles.errorText, { color: isDark ? "#fff" : "#000" }]}>
            {t("common.error")}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
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
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#F2F2F7" },
        ]}
        testID="transactions-screen"
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContainer}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isLoading || isRefetching}
              onRefresh={refetch}
              tintColor={isDark ? "#fff" : "#000"}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Receipt size={48} color={isDark ? "#666" : "#999"} />
                <Text style={[styles.emptyText, { color: isDark ? "#999" : "#666" }]}>
                  {searchQuery
                    ? t("transactions.transactionsNotFound")
                    : t("transactions.noTransactions")}
                </Text>
                {!searchQuery && (
                  <Text style={[styles.emptySubtext, { color: isDark ? "#777" : "#888" }]}>
                    {t("transactions.emptySubtitle")}
                  </Text>
                )}
                <View style={styles.emptyActions}>
                  <TouchableOpacity
                    style={[styles.emptyPrimaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleGoToPOS}
                  >
                    <Text style={[styles.emptyPrimaryButtonText, { color: colors.textInverse }]}>
                      {t("transactions.goToPos")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emptySecondaryButton, { borderColor: colors.border }]}
                    onPress={handlePresentModalPress}
                  >
                    <Text style={[styles.emptySecondaryButtonText, { color: isDark ? "#fff" : "#000" }]}>
                      {t("common.filter")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
        />
      </View>

      {/* Return Quantity Modal */}
      <Modal
        visible={showReturnModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowReturnModal(false);
          setReturnTransaction(null);
          setReturnQuantity("");
        }}
      >
        <View
          style={[
            styles.returnModal,
            isDark ? styles.returnModalDark : styles.returnModalLight,
          ]}
        >
          <View
            style={[
              styles.returnModalHeader,
              isDark
                ? styles.returnModalHeaderDark
                : styles.returnModalHeaderLight,
            ]}
          >
            <Text
              style={[
                styles.returnModalTitle,
                isDark
                  ? styles.returnModalTitleDark
                  : styles.returnModalTitleLight,
              ]}
            >
              {t("transactions.returnProduct")}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowReturnModal(false);
                setReturnTransaction(null);
                setReturnQuantity("");
              }}
            >
              <X size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>

          <View style={styles.returnModalContent}>
            {returnTransaction && (
              <>
                <Text
                  style={[
                    styles.returnProductName,
                    { color: isDark ? "#fff" : "#000" }
                  ]}
                >
                  {returnTransaction.product_name}
                </Text>
                <Text
                  style={[
                    styles.returnVariationName,
                    { color: isDark ? "#888" : "#666" }
                  ]}
                >
                  {returnTransaction.variation_name}
                </Text>

                <View style={styles.quantityContainer}>
                  <Text style={[styles.maxQuantityText, { color: isDark ? "#ccc" : "#666" }]}>
                    {t("transactions.maxQuantity")}: {returnTransaction.quantity}
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? "#333" : "#F2F2F7" }]}>
                    <TextInput
                      style={[styles.quantityInput, { color: isDark ? "#fff" : "#000" }]}
                      value={returnQuantity}
                      onChangeText={setReturnQuantity}
                      keyboardType="numeric"
                      placeholder={t("transactions.returnQuantity")}
                      placeholderTextColor={isDark ? "#888" : "#aaa"}
                      autoFocus
                      testID="transactions-return-quantity-input"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: colors.primary,
                      opacity:
                        !returnQuantity || parseFloat(returnQuantity) <= 0
                          ? 0.5
                          : 1,
                    },
                  ]}
                  onPress={handleConfirmReturn}
                  disabled={
                    !returnQuantity || parseFloat(returnQuantity) <= 0
                  }
                  testID="transactions-confirm-return-button"
                >
                  <Text style={styles.confirmButtonText}>
                    {t("common.confirm")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Filter Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        backgroundStyle={{ backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }}
        handleIndicatorStyle={{ backgroundColor: isDark ? "#555" : "#ccc" }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={[styles.filterTitle, { color: isDark ? "#fff" : "#000" }]}>
            {t("common.filter")}
          </Text>

          <View style={styles.datePickerRange}>
            <DateTimePicker
              mode="range"
              startDate={tempDateRange.startDate}
              endDate={tempDateRange.endDate}
              onChange={(params: { startDate?: DateType; endDate?: DateType }) => {
                const nextStart = params?.startDate ?? tempDateRange.startDate;
                const nextEnd = params?.endDate ?? tempDateRange.endDate;
                setTempDateRange({
                  startDate: nextStart,
                  endDate: nextEnd,
                });
              }}
              styles={datePickerStyles}
            />
          </View>

          <View style={styles.statusSection}>
            <Text style={[styles.statusLabel, { color: isDark ? "#fff" : "#000" }]}>
              {t("transactions.status")}
            </Text>
            <View style={styles.statusOptions}>
              {statusOptions.map((option) => {
                const isActive = tempStatusFilter === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isActive
                          ? colors.primary
                          : isDark
                            ? "#2C2C2E"
                            : "#F2F2F7",
                        borderColor: isActive
                          ? colors.primary
                          : isDark
                            ? "#3A3A3C"
                            : "#D1D1D6",
                      },
                    ]}
                    onPress={() => setTempStatusFilter(option.value)}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: isActive
                            ? colors.textInverse
                            : isDark
                              ? "#fff"
                              : "#000",
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.categorySection}>
            <Text style={[styles.categoryLabel, { color: isDark ? "#fff" : "#000" }]}>
              {t("transactions.category")}
            </Text>
            <View style={styles.statusOptions}>
              {categoryOptions.map((option) => {
                const isActive = tempCategoryFilter === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isActive
                          ? colors.primary
                          : isDark
                            ? "#2C2C2E"
                            : "#F2F2F7",
                        borderColor: isActive
                          ? colors.primary
                          : isDark
                            ? "#3A3A3C"
                            : "#D1D1D6",
                      },
                    ]}
                    onPress={() => setTempCategoryFilter(option.value)}
                  >
                    <View style={styles.categoryPillContent}>
                      {option.color && !isActive && (
                        <View
                          style={[
                            styles.categoryColorDot,
                            { backgroundColor: option.color },
                          ]}
                        />
                      )}
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isActive
                              ? colors.textInverse
                              : isDark
                                ? "#fff"
                                : "#000",
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: colors.border }]}
              onPress={handleResetFilters}
            >
              <Text style={[styles.resetButtonText, { color: isDark ? "#fff" : "#000" }]}>
                {t("common.reset")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApplyFilters}
            >
              <Text style={[styles.applyButtonText, { color: colors.textInverse }]}>
                {t("common.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  txCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  txDate: {
    fontSize: 12,
  },
  txContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  txDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  variationName: {
    fontSize: 14,
    marginBottom: 4,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txQuantity: {
    fontSize: 13,
  },
  txAmountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 80,
  },
  txTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  rightActionsContainer: {
    width: 80,
    marginTop: 0,
    marginBottom: 12,
    marginRight: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  rightAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 64,
    height: "100%",
    borderRadius: 12,
  },
  returnAction: {
    backgroundColor: "#FF9500",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyActions: {
    marginTop: 20,
    width: "100%",
    gap: 12,
  },
  emptyPrimaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyPrimaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySecondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  emptySecondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Return Modal Styles
  returnModal: {
    flex: 1,
    marginTop: 20, // Status bar handling for pageSheet
  },
  returnModalLight: {
    backgroundColor: "#fff",
  },
  returnModalDark: {
    backgroundColor: "#1C1C1E",
  },
  returnModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  returnModalHeaderLight: {
    borderBottomColor: "#E5E5EA",
  },
  returnModalHeaderDark: {
    borderBottomColor: "#38383A",
  },
  returnModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  returnModalTitleLight: {
    color: "#000",
  },
  returnModalTitleDark: {
    color: "#fff",
  },
  returnModalContent: {
    padding: 24,
  },
  returnProductName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  returnVariationName: {
    fontSize: 16,
    marginBottom: 24,
  },
  quantityContainer: {
    marginBottom: 24,
  },
  maxQuantityText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  inputContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quantityInput: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  // Filter Modal Styles
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  datePickerRange: {
    marginBottom: 32,
  },
  statusSection: {
    marginBottom: 32,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "500",
  },
  categoryPillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
