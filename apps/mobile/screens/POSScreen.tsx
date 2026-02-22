import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Linking,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FasterImageView } from "@candlefinance/faster-image";
import {
  Plus,
  Minus,
  ShoppingCart,
  X,
  CreditCard,
  Package,
  UserPlus,
  Edit,
  Trash2,
  Star,
  Gift,
  Tag as TagIcon,
  Receipt,
} from "lucide-react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTheme } from "../context/ThemeContext";
import { useAuthContext } from "../context/AuthContext";
import {
  InventoryItem,
  ProductVariation,
  usePOSStore,
} from "../context/PosStore";
import { posSearchHandlersRef } from "../navigation/AppNavigator";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useHaptics } from "../src/hooks/useHaptics";
import { log } from "../debugging/log";
import { UserStoreInfo } from "@/types";
import {
  PaymentMethodSelector,
  PaymentMethod,
} from "../src/components/PaymentMethodSelector";
import { DynamicQrPaymentModal } from "../src/components/DynamicQrPaymentModal";
import { statusColors } from "../src/utils/sharedStyles";

// Helper function to get payment method label
const getPaymentLabel = (method?: PaymentMethod): string => {
  switch (method) {
    case "card":
      return "Card";
    case "dynamic_qr":
      return "Dynamic QR";
    case "cash":
    default:
      return "Cash";
  }
};

const toTestId = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  store_id: string;
  created_at: string;
  updated_at: string;
  loyalty_card: LoyaltyCard | null;
  _count: {
    transactions: number;
  };
}

interface LoyaltyCard {
  id: string;
  card_number: string;
  customer_id: string;
  points: number;
  created_at: string;
  updated_at: string;
}

// Receipt data structure for displaying after transaction
interface ReceiptLine {
  id: string;
  productName: string;
  variationName: string;
  quantity: number;
  unitName: string | null;
  unitPrice: number;
  lineTotal: number;
}

interface ReceiptData {
  id: string;
  cashierName?: string;
  createdAt: string;
  storeName: string;
  storeAddress?: string | null;
  storePhone?: string | null;
  customerName?: string | null;
  isDebtSale: boolean;
  subtotal: number;
  discountAmount: number;
  total: number;
  lines: ReceiptLine[];
}

interface InventorySection {
  title: string;
  data: InventoryItem[];
}

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

const SEARCH_DEBOUNCE_MS = 300;

const useDebouncedQuery = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Apply clear actions immediately so cancel feels responsive.
    if (!value) {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function POSScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showCustomerSection, setShowCustomerSection] = useState(false);
  const debouncedSearchQuery = useDebouncedQuery(
    searchQuery,
    SEARCH_DEBOUNCE_MS
  );
  const debouncedCustomerSearchQuery = useDebouncedQuery(
    customerSearchQuery,
    SEARCH_DEBOUNCE_MS
  );

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loyaltyCardForm, setLoyaltyCardForm] = useState({
    card_number: "",
    points: "0",
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  // Discount state
  const [customDiscountAmount, setCustomDiscountAmount] = useState("");

  // Bottom Sheet refs
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const addCustomerSheetRef = useRef<BottomSheetModal>(null);
  const loyaltyCardSheetRef = useRef<BottomSheetModal>(null);
  const paymentSelectorSheetRef = useRef<BottomSheetModal>(null);
  const receiptSheetRef = useRef<BottomSheetModal>(null);
  const dynamicQrPaymentSheetRef = useRef<BottomSheetModal>(null);
  const dynamicQrOrderIdRef = useRef<string | null>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  // Dynamic QR payment state
  const [dynamicQrOrderId, setDynamicQrOrderId] = useState<string | null>(null);

  // Receipt state
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);

  // POS Store
  const {
    cart,
    is_processing_transaction: isProcessingTransaction,
    currency,
    discount,
    addToCart: addToCartStore,
    removeFromCart: removeFromCartStore,
    updateCartQuantity: updateCartQuantityStore,
    incrementQuantity,
    decrementQuantity,
    clearCart: clearCartStore,
    setDiscount,
    clearDiscount,
    setIsProcessingTransaction,
    getCartTotal,
    getCartItemCount,
    isItemInCart,
    getCartItem,
    getDiscountAmount,
    getFinalTotal,
    is_debt_sale: isDebtSale,
    setIsDebtSale,
  } = usePOSStore();

  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { triggerHaptic } = useHaptics();
  const user = useAuthContext((state) => state.user);
  const queryClient = useQueryClient();
  const storeData = useAuthContext((state) => state.userStore);

  useEffect(() => {
    if (!selectedCustomer && isDebtSale) {
      setIsDebtSale(false);
    }
  }, [selectedCustomer, isDebtSale, setIsDebtSale]);

  // Set up search handlers
  useEffect(() => {
    posSearchHandlersRef.onSearchChange = (text: string) => {
      setSearchQuery(text);
    };
    posSearchHandlersRef.onSearchSubmit = (text: string) => {
      setSearchQuery(text);
    };
    posSearchHandlersRef.onSearchCancel = () => {
      setSearchQuery("");
    };
  }, []);

  const store_id = storeData?.store?.id;
  // Fetch inventory data with React Query
  const {
    data: inventoryResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventory", store_id],
    queryFn: async (): Promise<{ inventory: InventoryItem[] }> => {
      if (!store_id) {
        // Should not run due to enabled flag; defensive no-op
        log.warn("POSScreen", "No store assigned to user", {
          user_id: user?.id,
          store_id,
        });
        return { inventory: [] };
      }
      try {
        const res = await api.get<{ inventory: InventoryItem[] }>(
          `/api/inventory?storeId=${store_id}&stock_level=in_stock`
        );
        log.info("POSScreen", "Fetched inventory", {
          store_id,
          count: res.inventory.length,
        });
        return res;
      } catch (err) {
        log.error("POSScreen", "Fetch inventory failed", {
          store_id,
          error_message: (err as unknown as { message?: string })?.message,
        });
        throw err;
      }
    },
    enabled: !!store_id,
  });

  // Log inventory errors
  useEffect(() => {
    if (error) {
      log.error("POSScreen", "Inventory query failed", {
        store_id,
        error_message: (error as unknown as { message?: string })?.message,
      });
    }
  }, [error, store_id]);

  // Fetch customers data
  const {
    data: customersResponse,
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["customers", store_id],
    queryFn: async (): Promise<{ customers: Customer[] }> => {
      if (!store_id) {
        // Should not run due to enabled flag; defensive no-op
        return { customers: [] };
      }
      try {
        const res = await api.get<{ customers: Customer[] }>(
          `/api/customers?storeId=${store_id}`
        );
        log.info("POSScreen", "Fetched customers", {
          store_id,
          count: res.customers.length,
        });
        return res;
      } catch (err) {
        log.error("POSScreen", "Fetch customers failed", {
          store_id,
          error_message: (err as unknown as { message?: string })?.message,
        });
        throw err;
      }
    },
    enabled: !!store_id,
  });

  // Extract data from responses
  const inventory = inventoryResponse?.inventory || [];
  const customers = customersResponse?.customers || [];

  // Customer mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: {
      name: string;
      email?: string;
      phone?: string;
      store_id: string;
    }) => {
      try {
        const res = await api.post("/api/customers", customerData);
        log.info("POSScreen", "Create customer success", {
          store_id,
          customer_name: customerData.name,
        });
        return res;
      } catch (err) {
        log.error("POSScreen", "Create customer failed", {
          store_id,
          payload: customerData,
          error_message: (err as unknown as { message?: string })?.message,
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", store_id] });
      addCustomerSheetRef.current?.dismiss();
      resetCustomerForm();
      triggerHaptic("notificationSuccess");
      Alert.alert(t("common.success"), t("customers.customerAdded"));
    },
    onError: (mutation_error, variables) => {
      console.error("Error creating customer:", mutation_error);
      log.error("POSScreen", "Create customer failed", {
        store_id,
        payload: variables,
        error_message: (mutation_error as unknown as { message?: string })
          ?.message,
      });
      triggerHaptic("notificationError");
      Alert.alert(t("common.error"), "Failed to create customer");
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({
      id,
      ...customerData
    }: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
    }) => {
      try {
        const res = await api.put(
          `/api/customers/${id}?storeId=${store_id}`,
          customerData
        );
        log.info("POSScreen", "Update customer success", {
          store_id,
          customer_id: id,
        });
        return res;
      } catch (err) {
        log.error("POSScreen", "Update customer failed", {
          store_id,
          customer_id: id,
          payload: customerData,
          error_message: (err as unknown as { message?: string })?.message,
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", store_id] });
      setEditingCustomer(null);
      resetCustomerForm();
      triggerHaptic("notificationSuccess");
      Alert.alert(t("common.success"), t("customers.customerUpdated"));
    },
    onError: (mutation_error, variables) => {
      console.error("Error updating customer:", mutation_error);
      log.error("POSScreen", "Update customer failed", {
        store_id,
        payload: variables,
        error_message: (mutation_error as unknown as { message?: string })
          ?.message,
      });
      triggerHaptic("notificationError");
      Alert.alert(t("common.error"), "Failed to update customer");
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      try {
        const res = await api.delete(
          `/api/customers/${customerId}?storeId=${store_id}`
        );
        log.info("POSScreen", "Delete customer success", {
          store_id,
          customer_id: customerId,
        });
        return res;
      } catch (err) {
        log.error("POSScreen", "Delete customer failed", {
          store_id,
          customer_id: customerId,
          error_message: (err as unknown as { message?: string })?.message,
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", store_id] });
      triggerHaptic("notificationSuccess");
      Alert.alert(t("common.success"), t("customers.customerDeleted"));
    },
    onError: (mutation_error, customer_id) => {
      console.error("Error deleting customer:", mutation_error);
      log.error("POSScreen", "Delete customer failed", {
        store_id,
        customer_id,
        error_message: (mutation_error as unknown as { message?: string })
          ?.message,
      });
      triggerHaptic("notificationError");
      Alert.alert(t("common.error"), "Failed to delete customer");
    },
  });

  const createLoyaltyCardMutation = useMutation({
    mutationFn: async (loyaltyCardData: {
      customer_id: string;
      card_number: string;
      points?: number;
    }) => {
      try {
        const res = await api.post(
          "/api/customers/loyalty-cards",
          loyaltyCardData
        );
        log.info("POSScreen", "Create loyalty card success", {
          store_id,
          customer_id: loyaltyCardData.customer_id,
        });
        return res;
      } catch (err) {
        log.error("POSScreen", "Create loyalty card failed", {
          store_id,
          payload: loyaltyCardData,
          error_message: (err as unknown as { message?: string })?.message,
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", store_id] });
      loyaltyCardSheetRef.current?.dismiss();
      resetLoyaltyCardForm();
      triggerHaptic("notificationSuccess");
      Alert.alert(t("common.success"), t("customers.loyaltyCardAdded"));
    },
    onError: (mutation_error, variables) => {
      console.error("Error creating loyalty card:", mutation_error);
      log.error("POSScreen", "Create loyalty card failed", {
        store_id,
        payload: variables,
        error_message: (mutation_error as unknown as { message?: string })
          ?.message,
      });
      triggerHaptic("notificationError");
      Alert.alert(t("common.error"), "Failed to create loyalty card");
    },
  });

  // Form reset functions
  const resetCustomerForm = () => {
    setCustomerForm({ name: "", email: "", phone: "" });
  };

  const resetLoyaltyCardForm = () => {
    setLoyaltyCardForm({ card_number: "", points: "0" });
  };

  // Customer management functions
  const handleAddCustomer = () => {
    if (!customerForm.name.trim()) {
      log.warn("POSScreen", "Customer name missing on add");
      Alert.alert(t("common.error"), t("customers.nameRequired"));
      return;
    }

    if (
      customerForm.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)
    ) {
      log.warn("POSScreen", "Email format invalid on add", {
        email: customerForm.email,
      });
      Alert.alert(t("common.error"), t("customers.emailInvalid"));
      return;
    }

    createCustomerMutation.mutate({
      name: customerForm.name.trim(),
      email: customerForm.email.trim() || undefined,
      phone: customerForm.phone.trim() || undefined,
      store_id: store_id!,
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
    });
    addCustomerSheetRef.current?.present();
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer || !customerForm.name.trim()) {
      log.warn("POSScreen", "Customer name missing on update", {
        editing_customer_id: editingCustomer?.id,
      });
      Alert.alert(t("common.error"), t("customers.nameRequired"));
      return;
    }

    if (
      customerForm.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)
    ) {
      log.warn("POSScreen", "Email format invalid on update", {
        email: customerForm.email,
        editing_customer_id: editingCustomer.id,
      });
      Alert.alert(t("common.error"), t("customers.emailInvalid"));
      return;
    }

    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      name: customerForm.name.trim(),
      email: customerForm.email.trim() || undefined,
      phone: customerForm.phone.trim() || undefined,
    });
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Alert.alert(t("common.confirm"), t("customers.deleteCustomerConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteCustomerMutation.mutate(customer.id),
      },
    ]);
  };

  const handleAddLoyaltyCard = (customer: Customer) => {
    setEditingCustomer(customer);
    setLoyaltyCardForm({ card_number: "", points: "0" });
    loyaltyCardSheetRef.current?.present();
  };

  const handleCreateLoyaltyCard = () => {
    if (!editingCustomer || !loyaltyCardForm.card_number.trim()) {
      log.warn("POSScreen", "Loyalty card validation failed", {
        editing_customer_id: editingCustomer?.id,
        card_number: loyaltyCardForm.card_number,
      });
      Alert.alert(t("common.error"), t("customers.cardNumberRequired"));
      return;
    }

    createLoyaltyCardMutation.mutate({
      customer_id: editingCustomer.id,
      card_number: loyaltyCardForm.card_number.trim(),
      points: parseInt(loyaltyCardForm.points) || 0,
    });
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSection(true);
    triggerHaptic("impactLight");
  };

  const handleRemoveSelectedCustomer = () => {
    setSelectedCustomer(null);
    setShowCustomerSection(false);
    triggerHaptic("impactLight");
  };

  // Discount handlers
  const handleApplyPercentageDiscount = (percentage: number) => {
    setDiscount({ type: "percentage", value: percentage });
    triggerHaptic("impactLight");
  };

  const handleApplyCustomDiscount = () => {
    const amount = parseFloat(customDiscountAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t("common.error"), t("pos.invalidDiscount"));
      return;
    }

    const cartTotal = getCartTotal();
    if (amount > cartTotal) {
      Alert.alert(t("common.error"), t("pos.discountExceedsTotal"));
      return;
    }

    setDiscount({ type: "amount", value: amount });
    setCustomDiscountAmount("");
    triggerHaptic("impactLight");
  };

  const handleRemoveDiscount = () => {
    clearDiscount();
    triggerHaptic("impactLight");
  };

  // Initial load
  useEffect(() => {
    refetch();
    refetchCustomers();
  }, [refetch, refetchCustomers]);

  // Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchCustomers()]);
    setRefreshing(false);
  }, [refetch, refetchCustomers]);

  // Filter inventory based on search
  const filteredInventory = useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim();
    if (!normalizedQuery) {
      return inventory;
    }

    const searchLower = normalizedQuery.toLowerCase();
    return inventory.filter((item) => {
      return (
        item.product_variation.name.toLowerCase().includes(searchLower) ||
        item.product_variation.product.name
          .toLowerCase()
          .includes(searchLower) ||
        item.product_variation.barcode.includes(normalizedQuery) ||
        (item.product_variation.sku &&
          item.product_variation.sku.toLowerCase().includes(searchLower))
      );
    });
  }, [inventory, debouncedSearchQuery]);

  // Group inventory by category for SectionList
  const groupedInventory: InventorySection[] = useMemo(() => {
    const sections = filteredInventory.reduce((sections, item) => {
      const categoryName =
        item.product_variation.product.category?.name ??
        t("products.noCategory");
      const existingSection = sections.find(
        (section) => section.title === categoryName
      );

      if (existingSection) {
        existingSection.data.push(item);
      } else {
        sections.push({
          title: categoryName,
          data: [item],
        });
      }

      return sections;
    }, [] as InventorySection[]);

    // Sort sections alphabetically
    sections.sort((a, b) => a.title.localeCompare(b.title));
    return sections;
  }, [filteredInventory, t]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = debouncedCustomerSearchQuery.trim();
    if (!normalizedQuery) {
      return customers;
    }

    const searchLower = normalizedQuery.toLowerCase();
    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.email &&
          customer.email.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.includes(normalizedQuery))
      );
    });
  }, [customers, debouncedCustomerSearchQuery]);

  // Cart calculations from store
  const cartTotal = getCartTotal();
  const cartItemCount = getCartItemCount();
  const discountAmount = getDiscountAmount();
  const finalTotal = getFinalTotal();

  // Cart functions with haptic feedback and validation
  const handleAddToCart = useCallback(
    (item: InventoryItem) => {
      triggerHaptic("impactLight");

      const existingItem = getCartItem(item.id);
      const isService = item.is_service || item.product_variation?.product?.type === "service";

      // Services have unlimited stock, no validation needed
      if (
        !isService &&
        existingItem &&
        existingItem.cart_quantity >= item.quantity_in_stock
      ) {
        log.warn("POSScreen", "Insufficient stock on add to cart", {
          inventory_item_id: item.id,
          stock: item.quantity_in_stock,
          requested: existingItem.cart_quantity + 1,
        });
        Alert.alert(t("pos.warning"), t("pos.insufficientStock"));
        return;
      }

      addToCartStore(item);
    },
    [addToCartStore, getCartItem, triggerHaptic, t]
  );

  const handleIncrementQuantity = useCallback(
    (item_id: string) => {
      triggerHaptic("impactLight");
      incrementQuantity(item_id);
    },
    [incrementQuantity, triggerHaptic]
  );

  const handleDecrementQuantity = useCallback(
    (item_id: string) => {
      triggerHaptic("impactLight");
      decrementQuantity(item_id);
    },
    [decrementQuantity, triggerHaptic]
  );

  const removeFromCart = useCallback(
    (item_id: string) => {
      triggerHaptic("impactLight");
      removeFromCartStore(item_id);
    },
    [removeFromCartStore, triggerHaptic]
  );

  const updateCartQuantity = useCallback(
    (item_id: string, quantity: number) => {
      const item = inventory.find((inv) => inv.id === item_id);
      if (!item) {
        return;
      }

      const isService = item.is_service || item.product_variation?.product?.type === "service";

      // Services have unlimited stock, no validation needed
      if (!isService && quantity > item.quantity_in_stock) {
        log.warn("POSScreen", "Insufficient stock on manual quantity", {
          inventory_item_id: item.id,
          stock: item.quantity_in_stock,
          requested: quantity,
        });
        Alert.alert(t("pos.warning"), t("pos.insufficientStock"));
        return;
      }

      updateCartQuantityStore(item_id, quantity);
    },
    [inventory, updateCartQuantityStore, t]
  );

  const clearCart = useCallback(() => {
    clearCartStore();
  }, [clearCartStore]);

  const handleDebtToggle = useCallback(
    (value: boolean) => {
      if (value && !selectedCustomer) {
        Alert.alert(t("pos.debtSale"), t("pos.debtCustomerRequired"));
        return;
      }
      setIsDebtSale(value);
    },
    [selectedCustomer, setIsDebtSale, t]
  );

  // Bottom sheet handlers
  const handlePresentBottomSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  // Transaction processing
  const processTransaction = useCallback(
    async (paymentMethod?: PaymentMethod, bypassModal: boolean = false) => {
      if (cart.length === 0) {
        log.warn("POSScreen", "Checkout attempted with empty cart");
        Alert.alert(t("pos.warning"), t("pos.emptyCart"));
        return;
      }

      if (!store_id) {
        log.error("POSScreen", "Checkout attempted without store_id");
        Alert.alert(t("common.error"), t("pos.noStoreSelected"));
        return;
      }

      if (isDebtSale && !selectedCustomer) {
        Alert.alert(t("pos.debtSale"), t("pos.debtCustomerRequired"));
        return;
      }

      // If no payment method specified, show payment selector
      if (!paymentMethod && !isDebtSale) {
        paymentSelectorSheetRef.current?.present();
        return;
      }

      // Handle Dynamic QR payment
      if (paymentMethod === "dynamic_qr" && !bypassModal) {
        if (!dynamicQrOrderIdRef.current) {
          const newOrderId = `ORDER-${Date.now()}`;
          dynamicQrOrderIdRef.current = newOrderId;
          setDynamicQrOrderId(newOrderId);
        }
        dynamicQrPaymentSheetRef.current?.present();
        return;
      }

      setIsProcessingTransaction(true);

      try {
        let transactionIds: string[] = [];

        // Create transactions for each cart item
        const discountInfo = discount
          ? ` - Discount: ${discount.type === "percentage"
            ? `${discount.value}%`
            : formatPrice(discount.value)
          }`
          : "";

        const transactionPromises = cart.map((item) => {
          const formattedPaymentLabel = getPaymentLabel(paymentMethod);

          return api.post("/api/transactions", {
            product_variation_id: item.product_variation.id,
            quantity: item.cart_quantity,
            unit_price: item.product_variation.selling_price,
            total_amount:
              item.product_variation.selling_price * item.cart_quantity,
            transaction_type: isDebtSale ? "debt" : "export",
            store_id: store_id,
            customer_id: selectedCustomer?.id,
            remarks: `POS Sale - ${item.product_variation.name}${selectedCustomer ? ` - Customer: ${selectedCustomer.name}` : ""
              }${discountInfo} - ${isDebtSale
                ? t("pos.debtSaleLabel")
                : t("pos.paymentMethodRemark", {
                  method: formattedPaymentLabel,
                })
              }`,
          });
        });

        const transactionResults = (await Promise.all(
          transactionPromises
        )) as Array<{ transaction: { id: string } }>;
        transactionIds = transactionResults.map(
          (result) => result.transaction.id
        );

        log.info("POSScreen", "Transaction batch completed", {
          store_id,
          items: cart.map((i) => ({
            inventory_item_id: i.id,
            qty: i.cart_quantity,
            pv_id: i.product_variation.id,
          })),
          customer_id: selectedCustomer?.id || null,
          total: cartTotal,
        });

        // Create receipt data for display
        const receiptId = `${Date.now()}${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`;
        const discountAmount = getDiscountAmount();
        const receiptData: ReceiptData = {
          id: receiptId,
          cashierName: user?.name ?? user?.email ?? undefined,
          createdAt: new Date().toISOString(),
          storeName: storeData?.store?.name ?? "Store",
          storeAddress: storeData?.store?.address ?? null,
          storePhone: storeData?.store?.phone ?? null,
          customerName: selectedCustomer?.name ?? null,
          isDebtSale,
          subtotal: cartTotal,
          discountAmount,
          total: finalTotal,
          lines: cart.map((item) => ({
            id: item.id,
            productName: item.product_variation.product.name,
            variationName: item.product_variation.name,
            quantity: item.cart_quantity,
            unitName: item.product_variation.unit?.name ?? null,
            unitPrice: item.product_variation.selling_price,
            lineTotal: item.product_variation.selling_price * item.cart_quantity,
          })),
        };
        setLastReceipt(receiptData);

        triggerHaptic("notificationSuccess");

        // Clear cart and dismiss other sheets first
        clearCart();
        setSelectedCustomer(null);
        setSelectedPaymentMethod(null);
        setIsDebtSale(false);
        paymentSelectorSheetRef.current?.dismiss();
        handleCloseBottomSheet();

        // Show receipt modal
        setTimeout(() => {
          receiptSheetRef.current?.present();
        }, 300);

        refetch(); // Refresh inventory to show updated stock
      } catch (err) {
        console.error("Transaction error:", err);
        log.error("POSScreen", "Transaction batch failed", {
          store_id,
          error_message: (err as unknown as { message?: string })?.message,
          items: cart.map((i) => ({
            inventory_item_id: i.id,
            qty: i.cart_quantity,
            pv_id: i.product_variation.id,
          })),
          customer_id: selectedCustomer?.id || null,
          total: cartTotal,
        });
        triggerHaptic("notificationError");
        Alert.alert(t("common.error"), t("pos.transactionFailed"));
      } finally {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["store"] });
        setIsProcessingTransaction(false);
      }
    },
    [
      cart,
      store_id,
      cartTotal,
      selectedCustomer,
      triggerHaptic,
      t,
      clearCart,
      setIsProcessingTransaction,
      refetch,
      handleCloseBottomSheet,
    ]
  );

  // Format price
  const formatPrice = useCallback(
    (price: number) => {
      const symbol = t(`currency.${currency}`, { defaultValue: currency });
      return `${price.toLocaleString()} ${symbol}`;
    },
    [currency, t]
  );

  // Get stock status
  const getStockStatus = useCallback(
    (quantity: number, isService?: boolean) => {
      // Services always show as "available" regardless of stock
      if (isService) {
        return {
          status: "service",
          color: statusColors.success,
          label: t("inventory.service") || t("inventory.inStock"),
        };
      }
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
    },
    [t]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: InventorySection }) => (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {section.title.toUpperCase()}
        </Text>
      </View>
    ),
    [colors]
  );

  // Render inventory item with increment/decrement buttons
  const renderInventoryItem = useCallback(
    ({ item }: { item: InventoryItem }) => {
      const isService = item.is_service || item.product_variation?.product?.type === "service";
      const stockStatus = getStockStatus(item.quantity_in_stock, isService);
      const cartItem = getCartItem(item.id);
      const inCart = isItemInCart(item.id);

      return (
        <View
          style={[
            styles.card,
            {
              borderColor: colors.border,
              backgroundColor: isDark
                ? colors.surfaceSecondary
                : colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <FasterImageView
            source={{
              url: getImageUrl(
                item.product_variation.image_url,
                item.product_variation.product.image_url
              ),
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
              {item.product_variation.product.name}
            </Text>
            <Text style={[styles.priceText, { color: colors.textSecondary }]}>
              {formatPrice(item.product_variation.selling_price)}
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

              {/* Product Tags */}
              <View style={styles.tagsContainer}>
                {item.product_variation.name && (
                  <View
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
                      {item.product_variation.name}
                    </Text>
                  </View>
                )}
                {item.product_variation.unit && (
                  <View
                    style={[
                      styles.tag,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundSecondary
                          : colors.backgroundSecondary,
                      },
                    ]}
                  >
                    <Package size={12} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.tagText,
                        { color: colors.textPrimary, marginLeft: 4 },
                      ]}
                    >
                      {item.product_variation.unit.name}
                    </Text>
                  </View>
                )}
                {item.product_variation.color && (
                  <View
                    style={[
                      styles.tag,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundSecondary
                          : colors.backgroundSecondary,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        {
                          backgroundColor: item.product_variation.color,
                          borderColor: colors.textSecondary,
                        },
                      ]}
                    />
                  </View>
                )}
                {/* Quantity Tag */}
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundSecondary
                        : colors.backgroundSecondary,
                    },
                  ]}
                >
                  <Package size={12} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.tagText,
                      { color: colors.textPrimary, marginLeft: 4 },
                    ]}
                  >
                    {item.quantity_in_stock} {t("pos.inStock")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.trailingContainer}>
            {/* Quantity Controls */}
            <View style={styles.quantityControls}>
              {inCart && cartItem ? (
                // Show increment/decrement controls when item is in cart
                <>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundSecondary
                          : colors.backgroundSecondary,
                      },
                    ]}
                    onPress={() => handleDecrementQuantity(item.id)}
                  >
                    <Minus size={16} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text
                    style={[styles.quantityText, { color: colors.textPrimary }]}
                  >
                    {cartItem.cart_quantity}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundSecondary
                          : colors.backgroundSecondary,
                      },
                      cartItem.cart_quantity >= item.quantity_in_stock &&
                      styles.quantityButtonDisabled,
                    ]}
                    onPress={() => handleIncrementQuantity(item.id)}
                    disabled={cartItem.cart_quantity >= item.quantity_in_stock}
                  >
                    <Plus size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                </>
              ) : (
                // Show add button when item is not in cart
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                    item.quantity_in_stock === 0 && styles.addButtonDisabled,
                  ]}
                  onPress={() => handleAddToCart(item)}
                  disabled={item.quantity_in_stock === 0}
                  testID={`pos-add-to-cart-${toTestId(
                    item.product_variation.product.name
                  )}`}
                >
                  <Plus size={20} color={colors.textInverse} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    },
    [
      handleAddToCart,
      handleIncrementQuantity,
      handleDecrementQuantity,
      formatPrice,
      getStockStatus,
      getCartItem,
      isItemInCart,
      isDark,
      colors,
      t,
    ]
  );

  // Render customer item for bottom sheet
  const renderCustomerItem = useCallback(
    ({ item }: { item: Customer }) => (
      <View
        style={[
          styles.customerItem,
          {
            backgroundColor: isDark
              ? colors.surfaceSecondary
              : colors.background,
          },
        ]}
      >
        <View style={styles.customerInfo}>
          <Text
            style={[styles.customerName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.email && (
            <Text
              style={[styles.customerEmail, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.email}
            </Text>
          )}
          {item.phone && (
            <Text
              style={[styles.customerPhone, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.phone}
            </Text>
          )}
          <View style={styles.customerStats}>
            <Text
              style={[styles.customerStat, { color: colors.textSecondary }]}
            >
              {t("customers.totalTransactions")}: {item._count.transactions}
            </Text>
            {item.loyalty_card && (
              <View style={styles.loyaltyInfo}>
                <Star size={12} color="#FFD700" />
                <Text style={[styles.loyaltyPoints, { color: "#FFD700" }]}>
                  {item.loyalty_card.points} {t("customers.loyaltyPoints")}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.customerActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.selectButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => handleSelectCustomer(item)}
          >
            <Text
              style={[styles.selectButtonText, { color: colors.textInverse }]}
            >
              {t("customers.selectCustomer")}
            </Text>
          </TouchableOpacity>

          <View style={styles.customerActionButtons}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark
                    ? colors.backgroundSecondary
                    : colors.backgroundSecondary,
                },
              ]}
              onPress={() => handleEditCustomer(item)}
            >
              <Edit size={16} color={colors.textPrimary} />
            </TouchableOpacity>

            {!item.loyalty_card && (
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: isDark
                      ? colors.backgroundSecondary
                      : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => handleAddLoyaltyCard(item)}
              >
                <Gift size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: statusColors.error },
              ]}
              onPress={() => handleDeleteCustomer(item)}
            >
              <Trash2 size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [
      isDark,
      colors,
      t,
      handleSelectCustomer,
      handleEditCustomer,
      handleAddLoyaltyCard,
      handleDeleteCustomer,
    ]
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
          {t("pos.loadingInventory")}
        </Text>
      </View>
    );
  }

  // Add error handling for inventory loading
  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
          {t("pos.errorLoadingInventory")}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>
            {t("common.retry")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="pos-screen"
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Main content */}
      <View style={styles.content}>
        <SectionList
          sections={groupedInventory}
          renderItem={renderInventoryItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          // Performance optimizations
          windowSize={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === "android"}
          initialNumToRender={15}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={64} color={colors.textTertiary} />
              <Text
                style={[styles.emptyStateText, { color: colors.textPrimary }]}
              >
                {searchQuery ? t("pos.noSearchResults") : t("pos.noInventory")}
              </Text>
              {searchQuery && (
                <Text
                  style={[
                    styles.emptyStateSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("pos.tryDifferentSearch")}
                </Text>
              )}
              {!searchQuery && (
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => refetch()}
                >
                  <Text
                    style={[
                      styles.retryButtonText,
                      { color: colors.textInverse },
                    ]}
                  >
                    {t("common.retry")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>

      {/* Cart Button - Opens Bottom Sheet */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={[
            styles.cartButton,
            {
              backgroundColor: colors.primary,
              bottom: 34 + insets.bottom,
            },
          ]}
          onPress={handlePresentBottomSheet}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="pos-cart-button"
        >
          <View style={styles.cartButtonContent}>
            <ShoppingCart size={24} color={colors.textInverse} />
            <View
              style={[styles.cartBadge, { backgroundColor: colors.background }]}
            >
              <Text style={[styles.cartBadgeText, { color: colors.primary }]}>
                {cartItemCount}
              </Text>
            </View>
            <Text
              style={[styles.cartButtonText, { color: colors.textInverse }]}
            >
              {formatPrice(finalTotal)}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom Sheet for Cart, Customer Selection and Loyalty Cards */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={1}
        onDismiss={() => { }}
        backgroundStyle={[
          styles.bottomSheetBackground,
          {
            backgroundColor: isDark
              ? colors.surfaceSecondary
              : colors.background,
          },
        ]}
        handleIndicatorStyle={[
          styles.bottomSheetIndicator,
          { backgroundColor: colors.border },
        ]}
        bottomInset={insets.bottom}
        detached={false}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.bottomSheetScrollViewContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* Header */}
          <View style={[styles.bottomSheetHeader]}>
            <Text
              style={[styles.bottomSheetTitle, { color: colors.textPrimary }]}
            >
              {t("pos.shoppingCart")}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseBottomSheet}
            >
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Customer Selection Section */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.sectionHeaderButton}
              onPress={() => setShowCustomerSection(!showCustomerSection)}
            >
              <View style={styles.sectionHeaderContent}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textPrimary }]}
                >
                  {t("customers.title")} {t("common.optional")}
                </Text>
                {selectedCustomer && (
                  <View
                    style={[
                      styles.selectedCustomerBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectedCustomerBadgeText,
                        { color: colors.textInverse },
                      ]}
                    >
                      {selectedCustomer.name}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.toggleIcon, { color: colors.primary }]}>
                {showCustomerSection ? "−" : "+"}
              </Text>
            </TouchableOpacity>

            {showCustomerSection && (
              <>
                {selectedCustomer ? (
                  <View
                    style={[
                      styles.selectedCustomerContainer,
                      { backgroundColor: colors.infoLight },
                    ]}
                  >
                    <View style={styles.selectedCustomerInfo}>
                      <Text
                        style={[
                          styles.selectedCustomerName,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {selectedCustomer.name}
                      </Text>
                      {selectedCustomer.loyalty_card && (
                        <View style={styles.loyaltyInfo}>
                          <Star size={14} color="#FFD700" />
                          <Text
                            style={[styles.loyaltyPoints, { color: "#FFD700" }]}
                          >
                            {selectedCustomer.loyalty_card.points}{" "}
                            {t("customers.loyaltyPoints")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeSelectedCustomerButton}
                      onPress={handleRemoveSelectedCustomer}
                    >
                      <X size={16} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={[
                        styles.searchInput,
                        {
                          backgroundColor: isDark
                            ? colors.surfaceSecondary
                            : colors.background,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder={t("customers.searchCustomers")}
                      placeholderTextColor={colors.textTertiary}
                      value={customerSearchQuery}
                      onChangeText={setCustomerSearchQuery}
                    />

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.customersHorizontalList}
                    >
                      {filteredCustomers.slice(0, 5).map((customer) => (
                        <TouchableOpacity
                          key={customer.id}
                          style={[
                            styles.customerQuickSelect,
                            {
                              backgroundColor: isDark
                                ? colors.backgroundSecondary
                                : colors.backgroundSecondary,
                            },
                          ]}
                          onPress={() => handleSelectCustomer(customer)}
                        >
                          <Text
                            style={[
                              styles.customerQuickSelectName,
                              { color: colors.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {customer.name}
                          </Text>
                          {customer.loyalty_card && (
                            <Star size={12} color="#FFD700" />
                          )}
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={[
                          styles.addCustomerQuickButton,
                          { backgroundColor: colors.success },
                        ]}
                        onPress={() => {
                          setEditingCustomer(null);
                          resetCustomerForm();
                          addCustomerSheetRef.current?.present();
                        }}
                        testID="pos-add-customer-button"
                      >
                        <UserPlus size={16} color={colors.textInverse} />
                      </TouchableOpacity>
                    </ScrollView>
                  </>
                )}
              </>
            )}
          </View>

          {/* Discount Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.discountSectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {t("pos.discount")} {t("common.optional")}
              </Text>
              {discount && (
                <View
                  style={[
                    styles.selectedDiscountBadge,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectedDiscountBadgeText,
                      { color: colors.textInverse },
                    ]}
                  >
                    {discount.type === "percentage"
                      ? `${discount.value}%`
                      : formatPrice(discount.value)}
                  </Text>
                </View>
              )}
            </View>

            {discount ? (
              <View
                style={[
                  styles.selectedDiscountContainer,
                  { backgroundColor: colors.successLight },
                ]}
              >
                <View style={styles.selectedDiscountInfo}>
                  <Text
                    style={[
                      styles.selectedDiscountText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {discount.type === "percentage"
                      ? `${discount.value}% ${t("pos.discount")}`
                      : `${formatPrice(discount.value)} ${t("pos.discount")}`}
                  </Text>
                  <Text
                    style={[
                      styles.discountAmountText,
                      { color: colors.success },
                    ]}
                  >
                    -{formatPrice(discountAmount)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeDiscountButton}
                  onPress={handleRemoveDiscount}
                >
                  <X size={16} color="#f44336" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Percentage Buttons */}
                <View style={styles.percentageSection}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textPrimary }]}
                  >
                    {t("pos.percentage")}
                  </Text>
                  <View style={styles.percentageButtons}>
                    {[10, 20, 30].map((percentage) => (
                      <TouchableOpacity
                        key={percentage}
                        style={[
                          styles.percentageButton,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() =>
                          handleApplyPercentageDiscount(percentage)
                        }
                      >
                        <Text
                          style={[
                            styles.percentageButtonText,
                            { color: colors.textInverse },
                          ]}
                        >
                          {percentage}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Custom Amount Section */}
                <View style={styles.customAmountSection}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textPrimary }]}
                  >
                    {t("pos.customAmount")}
                  </Text>
                  <TextInput
                    style={[
                      styles.discountInput,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceSecondary
                          : colors.background,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder={t("pos.enterDiscountAmount")}
                    placeholderTextColor={colors.textTertiary}
                    value={customDiscountAmount}
                    onChangeText={setCustomDiscountAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyCustomButton,
                      { backgroundColor: colors.success },
                      !customDiscountAmount.trim() &&
                      styles.applyCustomButtonDisabled,
                    ]}
                    onPress={handleApplyCustomDiscount}
                    disabled={!customDiscountAmount.trim()}
                  >
                    <Text
                      style={[
                        styles.applyCustomButtonText,
                        { color: colors.textInverse },
                      ]}
                    >
                      {t("common.apply")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Cart Items */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t("pos.cartItems")} ({cartItemCount})
            </Text>

            {cart.map((item) => (
              <View
                key={item.id}
                style={[styles.cartItem, { borderBottomColor: colors.border }]}
              >
                <FasterImageView
                  source={{
                    url: getImageUrl(
                      item.product_variation.image_url,
                      item.product_variation.product.image_url
                    ),
                    cachePolicy: "discWithCacheControl",
                    transitionDuration: 0.2,
                  }}
                  style={styles.cartItemImage}
                />
                <View style={styles.cartItemInfo}>
                  <Text
                    style={[styles.cartItemName, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {item.product_variation.name}
                  </Text>
                  <Text
                    style={[
                      styles.cartItemPrice,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatPrice(item.product_variation.selling_price)} ×{" "}
                    {item.cart_quantity}
                  </Text>
                  <Text
                    style={[styles.cartItemTotal, { color: colors.primary }]}
                  >
                    {formatPrice(
                      item.product_variation.selling_price * item.cart_quantity
                    )}
                  </Text>
                </View>

                <View style={styles.cartQuantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundSecondary
                          : colors.backgroundSecondary,
                      },
                    ]}
                    onPress={() => handleDecrementQuantity(item.id)}
                  >
                    <Minus size={16} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.quantityInput,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {item.cart_quantity}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      {
                        backgroundColor: isDark
                          ? colors.backgroundSecondary
                          : colors.backgroundSecondary,
                      },
                      item.cart_quantity >= item.quantity_in_stock &&
                      styles.quantityButtonDisabled,
                    ]}
                    onPress={() => handleIncrementQuantity(item.id)}
                    disabled={item.cart_quantity >= item.quantity_in_stock}
                  >
                    <Plus size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Summary Section */}
          <View
            style={[
              styles.cartSummary,
              {
                backgroundColor: isDark
                  ? colors.surfaceSecondary
                  : colors.backgroundSecondary,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colors.textSecondary }]}
              >
                {t("pos.subtotal")}:
              </Text>
              <Text
                style={[styles.summaryValue, { color: colors.textPrimary }]}
              >
                {formatPrice(cartTotal)}
              </Text>
            </View>

            {discount && (
              <View style={styles.summaryRow}>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  {t("pos.discount")} (
                  {discount.type === "percentage"
                    ? `${discount.value}%`
                    : t("pos.customAmount")}
                  ):
                </Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  -{formatPrice(discountAmount)}
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
                {t("pos.finalTotal")}:
              </Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {formatPrice(finalTotal)}
              </Text>
            </View>
          </View>

          {/* Debt Toggle */}
          <View
            style={[
              styles.debtToggleRow,
              {
                backgroundColor: isDark
                  ? colors.surfaceSecondary
                  : colors.backgroundSecondary,
              },
            ]}
          >
            <View style={styles.debtToggleTextContainer}>
              <Text
                style={[styles.debtToggleTitle, { color: colors.textPrimary }]}
              >
                {t("pos.debtSale")}
              </Text>
              <Text
                style={[
                  styles.debtToggleSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t("pos.debtSaleDescription")}
              </Text>
            </View>
            <Switch
              value={isDebtSale}
              onValueChange={handleDebtToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDebtSale ? colors.textInverse : colors.background}
            />
          </View>
          {isDebtSale && !selectedCustomer && (
            <Text style={[styles.debtWarning, { color: colors.error }]}>
              {t("pos.debtCustomerRequired")}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.clearButton]} onPress={clearCart}>
              <Text
                style={[
                  styles.clearButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                {t("pos.clearCart")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                { backgroundColor: colors.primary },
                isProcessingTransaction && styles.checkoutButtonDisabled,
              ]}
              onPress={() => processTransaction()}
              disabled={isProcessingTransaction}
            >
              {isProcessingTransaction ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <CreditCard size={20} color={colors.textInverse} />
                  <Text
                    style={[
                      styles.checkoutButtonText,
                      { color: colors.textInverse },
                    ]}
                  >
                    {t("pos.checkout")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Add/Edit Customer BottomSheet */}
      <BottomSheetModal
        ref={addCustomerSheetRef}
        index={0}
        snapPoints={["70%"]}
        onDismiss={() => {
          setEditingCustomer(null);
          resetCustomerForm();
        }}
        bottomInset={insets.bottom}
        detached={false}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <Text
            style={[
              styles.customerTitle,
              { color: colors.textPrimary, marginBottom: 20 },
            ]}
          >
            {editingCustomer
              ? t("customers.editCustomer")
              : t("customers.addCustomer")}
          </Text>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("customers.customerName")} *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t("customers.enterCustomerName")}
                placeholderTextColor={colors.textTertiary}
                value={customerForm.name}
                onChangeText={(text) =>
                  setCustomerForm((prev) => ({ ...prev, name: text }))
                }
                testID="pos-customer-name-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("customers.customerEmail")}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t("customers.enterCustomerEmail")}
                placeholderTextColor={colors.textTertiary}
                value={customerForm.email}
                onChangeText={(text) =>
                  setCustomerForm((prev) => ({ ...prev, email: text }))
                }
                keyboardType="email-address"
                autoCapitalize="none"
                testID="pos-customer-email-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("customers.customerPhone")}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t("customers.enterCustomerPhone")}
                placeholderTextColor={colors.textTertiary}
                value={customerForm.phone}
                onChangeText={(text) =>
                  setCustomerForm((prev) => ({ ...prev, phone: text }))
                }
                keyboardType="phone-pad"
                testID="pos-customer-phone-input"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.success },
                (createCustomerMutation.isPending ||
                  updateCustomerMutation.isPending) &&
                styles.saveButtonDisabled,
              ]}
              onPress={
                editingCustomer ? handleUpdateCustomer : handleAddCustomer
              }
              disabled={
                createCustomerMutation.isPending ||
                updateCustomerMutation.isPending
              }
              testID="pos-customer-save-button"
            >
              {createCustomerMutation.isPending ||
                updateCustomerMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text
                  style={[styles.saveButtonText, { color: colors.textInverse }]}
                >
                  {editingCustomer
                    ? t("common.save")
                    : t("customers.addCustomer")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Loyalty Card BottomSheet */}
      <BottomSheetModal
        ref={loyaltyCardSheetRef}
        index={0}
        snapPoints={["70%"]}
        onDismiss={() => {
          setEditingCustomer(null);
          resetLoyaltyCardForm();
        }}
        bottomInset={insets.bottom}
        detached={false}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <Text
            style={[
              styles.customerTitle,
              { color: colors.textPrimary, marginBottom: 20 },
            ]}
          >
            {t("customers.addLoyaltyCard")}
          </Text>
          <View style={styles.formContainer}>
            {editingCustomer && (
              <View
                style={[
                  styles.customerInfoCard,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.backgroundSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.customerInfoTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("customers.customerName")}
                </Text>
                <Text
                  style={[
                    styles.customerInfoText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {editingCustomer.name}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("customers.cardNumber")} *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t("customers.enterCardNumber")}
                placeholderTextColor={colors.textTertiary}
                value={loyaltyCardForm.card_number}
                onChangeText={(text) =>
                  setLoyaltyCardForm((prev) => ({
                    ...prev,
                    card_number: text,
                  }))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("customers.loyaltyPoints")}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t("customers.enterPointsAmount")}
                placeholderTextColor={colors.textTertiary}
                value={loyaltyCardForm.points}
                onChangeText={(text) =>
                  setLoyaltyCardForm((prev) => ({ ...prev, points: text }))
                }
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.success },
                createLoyaltyCardMutation.isPending &&
                styles.saveButtonDisabled,
              ]}
              onPress={handleCreateLoyaltyCard}
              disabled={createLoyaltyCardMutation.isPending}
            >
              {createLoyaltyCardMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text
                  style={[styles.saveButtonText, { color: colors.textInverse }]}
                >
                  {t("customers.addLoyaltyCard")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Payment Method Selector BottomSheet */}
      <BottomSheetModal
        ref={paymentSelectorSheetRef}
        index={0}
        snapPoints={["60%"]}
        onDismiss={() => {
          setSelectedPaymentMethod(null);
        }}
        bottomInset={insets.bottom}
        detached={false}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <Text
            style={[
              styles.paymentTitle,
              { color: colors.textPrimary, marginBottom: 20 },
            ]}
          >
            {t("payment.selectPaymentMethod")}
          </Text>

          <PaymentMethodSelector
            totalAmount={cartTotal}
            onPaymentMethodSelected={(method) => {
              setSelectedPaymentMethod(method);
              paymentSelectorSheetRef.current?.dismiss();
              processTransaction(method);
            }}
            disabled={isProcessingTransaction}
            isDark={isDark}
            colors={colors}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Receipt BottomSheet */}
      <BottomSheetModal
        ref={receiptSheetRef}
        index={0}
        snapPoints={["85%"]}
        bottomInset={insets.bottom}
        detached={false}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          {lastReceipt && (
            <View style={styles.receiptContainer}>
              {/* Receipt Header */}
              <View style={styles.receiptHeader}>
                <Receipt size={32} color={colors.primary} />
                <Text style={[styles.receiptTitle, { color: colors.textPrimary }]}>
                  {t("pos.receipt", { defaultValue: "Receipt" })}
                </Text>
              </View>

              {/* Store Info */}
              <View style={[styles.receiptSection, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptStoreName, { color: colors.textPrimary }]}>
                  {lastReceipt.storeName}
                </Text>
                {lastReceipt.storeAddress && (
                  <Text style={[styles.receiptStoreInfo, { color: colors.textSecondary }]}>
                    {lastReceipt.storeAddress}
                  </Text>
                )}
                {lastReceipt.storePhone && (
                  <Text style={[styles.receiptStoreInfo, { color: colors.textSecondary }]}>
                    {lastReceipt.storePhone}
                  </Text>
                )}
              </View>

              {/* Transaction Info */}
              <View style={[styles.receiptSection, { borderBottomColor: colors.border }]}>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                    {t("transactions.receiptId", { defaultValue: "Receipt #" })}
                  </Text>
                  <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                    {lastReceipt.id}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                    {t("transactions.date", { defaultValue: "Date" })}
                  </Text>
                  <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                    {new Date(lastReceipt.createdAt).toLocaleString()}
                  </Text>
                </View>
                {lastReceipt.cashierName && (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                      {t("transactions.cashier", { defaultValue: "Cashier" })}
                    </Text>
                    <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                      {lastReceipt.cashierName}
                    </Text>
                  </View>
                )}
                {lastReceipt.customerName && (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                      {t("transactions.customer", { defaultValue: "Customer" })}
                    </Text>
                    <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                      {lastReceipt.customerName}
                    </Text>
                  </View>
                )}
              </View>

              {/* Line Items */}
              <View style={[styles.receiptSection, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptSectionTitle, { color: colors.textPrimary }]}>
                  {t("pos.items", { defaultValue: "Items" })}
                </Text>
                {lastReceipt.lines.map((line) => (
                  <View key={line.id} style={styles.receiptLineItem}>
                    <View style={styles.receiptLineTop}>
                      <Text
                        style={[styles.receiptLineName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {line.productName}
                        {line.variationName ? ` (${line.variationName})` : ""}
                      </Text>
                      <Text style={[styles.receiptLineTotal, { color: colors.textPrimary }]}>
                        {formatPrice(line.lineTotal)}
                      </Text>
                    </View>
                    <View style={styles.receiptLineBottom}>
                      <Text style={[styles.receiptLineQty, { color: colors.textSecondary }]}>
                        {line.quantity} {line.unitName ?? ""} × {formatPrice(line.unitPrice)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Totals */}
              <View style={[styles.receiptSection, { borderBottomWidth: 0 }]}>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                    {t("pos.subtotal", { defaultValue: "Subtotal" })}
                  </Text>
                  <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                    {formatPrice(lastReceipt.subtotal)}
                  </Text>
                </View>
                {lastReceipt.discountAmount > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                      {t("pos.discount", { defaultValue: "Discount" })}
                    </Text>
                    <Text style={[styles.receiptValue, { color: statusColors.error }]}>
                      - {formatPrice(lastReceipt.discountAmount)}
                    </Text>
                  </View>
                )}
                <View style={[styles.receiptRow, styles.receiptTotalRow]}>
                  <Text style={[styles.receiptTotalLabel, { color: colors.textPrimary }]}>
                    {t("pos.total", { defaultValue: "Total" })}
                  </Text>
                  <Text style={[styles.receiptTotalValue, { color: colors.primary }]}>
                    {formatPrice(lastReceipt.total)}
                  </Text>
                </View>
                {lastReceipt.isDebtSale && (
                  <View style={[styles.debtSaleBadge, { backgroundColor: statusColors.warning + "20" }]}>
                    <Text style={[styles.debtSaleText, { color: statusColors.warning }]}>
                      {t("pos.debtSaleLabel", { defaultValue: "Debt Sale" })}
                    </Text>
                  </View>
                )}
              </View>

              {/* Thank You Message */}
              <View style={styles.receiptFooter}>
                <Text style={[styles.receiptThankYou, { color: colors.textSecondary }]}>
                  {t("pos.thankYou", { defaultValue: "Thank you for shopping with us!" })}
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.receiptCloseButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  receiptSheetRef.current?.dismiss();
                  setLastReceipt(null);
                }}
              >
                <Text style={styles.receiptCloseButtonText}>
                  {t("common.close", { defaultValue: "Close" })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Dynamic QR Payment Modal */}
      <DynamicQrPaymentModal
        bottomSheetRef={dynamicQrPaymentSheetRef}
        amount={finalTotal}
        orderId={dynamicQrOrderIdRef.current || dynamicQrOrderId || ""}
        groupId={undefined}
        onPaymentSuccess={(_data: { paymentId: string; transactionId: string; clientPhoneNumber?: string }) => {
          dynamicQrPaymentSheetRef.current?.dismiss();
          dynamicQrOrderIdRef.current = null;
          setDynamicQrOrderId(null);
          // Continue with transaction processing after successful Dynamic QR payment
          // Pass true to bypass modal check
          processTransaction("dynamic_qr", true);
        }}
        onPaymentFailed={(error: string) => {
          Alert.alert(
            t("payment.paymentFailed", { defaultValue: "Payment Failed" }),
            error
          );
        }}
        onCancel={() => {
          setSelectedPaymentMethod(null);
          dynamicQrOrderIdRef.current = null;
          setDynamicQrOrderId(null);
        }}
        isDark={isDark}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
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
    position: "relative",
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
    marginBottom: 4,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
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
    marginRight: 4,
  },
  trailingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#8E8E93",
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
    marginVertical: 2,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  cartButton: {
    position: "absolute",
    // bottom is set dynamically with safe area insets
    left: 20,
    right: 20,
    borderRadius: 16,
    // Add shadow for better visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  cartBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    marginRight: 12,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetIndicator: {},
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  bottomSheetScrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionContainer: {
    marginVertical: 16,
  },
  discountSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedCustomerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  selectedCustomerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleIcon: {
    fontSize: 24,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  selectedCustomerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedCustomerInfo: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  removeSelectedCustomerButton: {
    padding: 4,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  customersHorizontalList: {
    maxHeight: 80,
  },
  customerQuickSelect: {
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    maxWidth: 120,
  },
  customerQuickSelectName: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  addCustomerQuickButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#E5E5EA",
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    marginBottom: 4,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cartQuantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityInput: {
    fontSize: 16,
    width: 40,
    textAlign: "center",
  },
  cartSummary: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  debtToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 12,
  },
  debtToggleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  debtToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  debtToggleSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  debtWarning: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "column-reverse",
    justifyContent: "flex-start",
    gap: 10,
  },
  clearButton: {
    borderRadius: 8,
    alignItems: "center",
    padding: 12,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkoutButton: {
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#ccc",
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  customerItem: {
    borderRadius: 16,
    marginVertical: 4,
    padding: 12,
  },
  customerInfo: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    marginBottom: 1,
  },
  customerPhone: {
    fontSize: 12,
    marginBottom: 4,
  },
  customerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerStat: {
    fontSize: 10,
  },
  loyaltyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  loyaltyPoints: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: "600",
  },
  customerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  selectButton: {
    flex: 1,
    marginRight: 8,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  customerActionButtons: {
    flexDirection: "row",
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  customerModal: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  customerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  customerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  customerInfoCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  customerInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  customerInfoText: {
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  paymentModal: {
    flex: 1,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  discountTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  percentageSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  percentageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  percentageButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  percentageButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  customAmountSection: {
    marginBottom: 20,
  },
  discountInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  applyCustomButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyCustomButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  applyCustomButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedDiscountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  selectedDiscountBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectedDiscountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedDiscountInfo: {
    flex: 1,
  },
  selectedDiscountText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  discountAmountText: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeDiscountButton: {
    padding: 4,
  },
  // Receipt styles
  receiptContainer: {
    flex: 1,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  receiptSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  receiptStoreName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  receiptStoreInfo: {
    fontSize: 14,
    textAlign: "center",
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 14,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  receiptLineItem: {
    marginBottom: 12,
  },
  receiptLineTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  receiptLineName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  receiptLineTotal: {
    fontSize: 14,
    fontWeight: "600",
  },
  receiptLineBottom: {
    marginTop: 2,
  },
  receiptLineQty: {
    fontSize: 12,
  },
  receiptTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  debtSaleBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  debtSaleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  receiptFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  receiptThankYou: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  receiptCloseButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  receiptCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
