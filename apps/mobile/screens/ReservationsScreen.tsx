import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Plus,
  X,
  Check,
  XCircle,
  Calendar,
  Package,
  User,
} from "lucide-react-native";
import { format } from "date-fns";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

const Tab = createMaterialTopTabNavigator();

interface Reservation {
  id: string;
  productVariationId: string;
  customerId: string;
  storeId: string;
  quantity: number;
  reservedQuantity: number;
  fulfilledQuantity: number;
  status: "pending" | "partial" | "fulfilled" | "cancelled";
  reservedDate: string;
  expectedPickupDate?: string;
  depositAmount: number;
  totalAmount: number;
  notes?: string;
  productVariation: {
    id: string;
    name: string;
    product: {
      name: string;
    };
  };
  customer: {
    id: string;
    name: string;
  };
}

// Shared modal state
let sharedFulfillModalVisible = false;
let sharedSetFulfillModalVisible: ((visible: boolean) => void) | null = null;
let sharedSelectedReservation: Reservation | null = null;
let sharedSetSelectedReservation: ((res: Reservation | null) => void) | null =
  null;
let sharedFulfillQuantity = "";
let sharedSetFulfillQuantity: ((q: string) => void) | null = null;

// Tab component for each status
function ReservationsTab({
  status,
}: {
  status: "all" | "pending" | "partial" | "fulfilled" | "cancelled";
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", status],
    queryFn: async () => {
      const params = status !== "all" ? `?status=${status}` : "";
      const res = await api.get<{ reservations: Reservation[] }>(
        `/api/reservations${params}`
      );
      return res;
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return api.put(`/api/reservations/${id}/fulfill`, {
        fulfilledQuantity: quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      if (sharedSetFulfillModalVisible) sharedSetFulfillModalVisible(false);
      if (sharedSetSelectedReservation) sharedSetSelectedReservation(null);
      if (sharedSetFulfillQuantity) sharedSetFulfillQuantity("");
      Alert.alert(t("common.success"), t("reservation.fulfillSuccess"));
    },
    onError: (error) => {
      console.error("Fulfill reservation error:", error);
      Alert.alert(t("common.error"), t("errors.generic"));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/reservations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      Alert.alert(t("common.success"), t("reservation.cancelSuccess"));
    },
    onError: (error) => {
      console.error("Cancel reservation error:", error);
      Alert.alert(t("common.error"), t("errors.generic"));
    },
  });

  const handleFulfill = (reservation: Reservation) => {
    if (sharedSetSelectedReservation) sharedSetSelectedReservation(reservation);
    const remaining = reservation.quantity - reservation.fulfilledQuantity;
    if (sharedSetFulfillQuantity)
      sharedSetFulfillQuantity(remaining.toString());
    if (sharedSetFulfillModalVisible) sharedSetFulfillModalVisible(true);
  };

  const handleCancel = (id: string) => {
    Alert.alert(
      t("reservation.cancelled_action"),
      t("reservation.cancelConfirm"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("reservation.cancelled_action"),
          style: "destructive",
          onPress: () => cancelMutation.mutate(id),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return colors.warning;
      case "partial":
        return colors.primary;
      case "fulfilled":
        return colors.success;
      case "cancelled":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const renderReservation = ({ item }: { item: Reservation }) => {
    const canFulfill = item.status === "pending" || item.status === "partial";
    const canCancel = item.status === "pending" || item.status === "partial";
    const remaining = item.quantity - item.fulfilledQuantity;

    return (
      <View
        style={[
          styles.reservationCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.reservationHeader}>
          <View style={styles.reservationInfo}>
            <Text style={[styles.productName, { color: colors.textPrimary }]}>
              {item.productVariation.product.name} -{" "}
              {item.productVariation.name}
            </Text>
            <Text
              style={[styles.customerName, { color: colors.textSecondary }]}
            >
              {item.customer.name}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {t(`reservation.${item.status}`)}
            </Text>
          </View>
        </View>

        <View style={styles.reservationDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              {t("reservation.quantity")}:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {item.fulfilledQuantity}/{item.quantity}
            </Text>
          </View>
          {remaining > 0 && (
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                {t("common.remaining")}:
              </Text>
              <Text style={[styles.detailValue, { color: colors.warning }]}>
                {remaining}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              {t("reservation.totalAmount")}:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {item.totalAmount.toLocaleString()} {t("common.currency")}
            </Text>
          </View>
          {item.depositAmount > 0 && (
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                {t("reservation.depositAmount")}:
              </Text>
              <Text style={[styles.detailValue, { color: colors.success }]}>
                {item.depositAmount.toLocaleString()} {t("common.currency")}
              </Text>
            </View>
          )}
          {item.expectedPickupDate && (
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                {t("reservation.expectedPickupDate")}:
              </Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {format(new Date(item.expectedPickupDate), "dd.MM.yyyy")}
              </Text>
            </View>
          )}
        </View>

        {(canFulfill || canCancel) && (
          <View style={styles.reservationActions}>
            {canFulfill && (
              <TouchableOpacity
                style={[
                  styles.fulfillButton,
                  { backgroundColor: colors.success },
                ]}
                onPress={() => handleFulfill(item)}
              >
                <Check size={16} color={colors.textInverse} />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: colors.textInverse },
                  ]}
                >
                  {t("reservation.fulfilled_action")}
                </Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                style={[
                  styles.cancelActionButton,
                  { backgroundColor: colors.error },
                ]}
                onPress={() => handleCancel(item.id)}
              >
                <XCircle size={16} color={colors.textInverse} />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: colors.textInverse },
                  ]}
                >
                  {t("reservation.cancelled_action")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={data?.reservations || []}
      renderItem={renderReservation}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        { backgroundColor: colors.background },
      ]}
      style={{ backgroundColor: colors.background }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("reservation.noReservations")}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {t("reservation.addFirst")}
          </Text>
        </View>
      }
    />
  );
}

export default function ReservationsScreen() {
  const { isDark, colors, theme } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [fulfillModalVisible, setFulfillModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [fulfillQuantity, setFulfillQuantity] = useState("");
  const [isFulfilling, setIsFulfilling] = useState(false);

  // Create reservation form state
  const createSheetRef = useRef<BottomSheetModal>(null);
  const [formData, setFormData] = useState({
    productVariationId: "",
    customerId: "",
    quantity: "",
    expectedPickupDate: "",
    depositAmount: "",
    totalAmount: "",
    notes: "",
  });
  const [openDropdown, setOpenDropdown] = useState<
    "product" | "customer" | null
  >(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch products for reservation form
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get<{
        products: {
          name: string;
          product_variations: {
            id: string;
            name: string;
            selling_price: number;
          }[];
        }[];
      }>("/api/products/list");
      return res.products;
    },
  });

  // Fetch customers for reservation form
  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get<{
        customers: { id: string; name: string }[];
      }>("/api/customers");
      return res.customers;
    },
  });

  // Create reservation mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post("/api/reservations", {
        productVariationId: data.productVariationId,
        customerId: data.customerId,
        quantity: parseInt(data.quantity),
        expectedPickupDate: data.expectedPickupDate
          ? new Date(data.expectedPickupDate).toISOString()
          : undefined,
        depositAmount: parseFloat(data.depositAmount) || 0,
        totalAmount: parseFloat(data.totalAmount),
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      createSheetRef.current?.dismiss();
      resetForm();
      Alert.alert(t("common.success"), t("reservation.created"));
    },
    onError: (error) => {
      console.error("Create reservation error:", error);
      Alert.alert(t("common.error"), t("errors.generic"));
    },
  });

  // Reset form function
  const resetForm = () => {
    setFormData({
      productVariationId: "",
      customerId: "",
      quantity: "",
      expectedPickupDate: "",
      depositAmount: "",
      totalAmount: "",
      notes: "",
    });
    setOpenDropdown(null);
    setProductSearchQuery("");
    setCustomerSearchQuery("");
    setShowDatePicker(false);
    setSelectedDate(new Date());
  };

  // Update shared state references
  sharedFulfillModalVisible = fulfillModalVisible;
  sharedSetFulfillModalVisible = setFulfillModalVisible;
  sharedSelectedReservation = selectedReservation;
  sharedSetSelectedReservation = setSelectedReservation;
  sharedFulfillQuantity = fulfillQuantity;
  sharedSetFulfillQuantity = setFulfillQuantity;

  const handleConfirmFulfill = () => {
    if (!selectedReservation) return;

    const quantity = parseInt(fulfillQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert(t("common.error"), t("reservation.quantityRequired"));
      return;
    }

    const remaining =
      selectedReservation.quantity - selectedReservation.fulfilledQuantity;
    if (quantity > remaining) {
      Alert.alert(
        t("common.error"),
        `${t("reservation.quantityRequired")}: ${remaining}`
      );
      return;
    }

    // Call the mutation from any tab
    setIsFulfilling(true);
    api
      .put(`/api/reservations/${selectedReservation.id}/fulfill`, {
        fulfilledQuantity: quantity,
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        setFulfillModalVisible(false);
        setSelectedReservation(null);
        setFulfillQuantity("");
        Alert.alert(t("common.success"), t("reservation.fulfillSuccess"));
      })
      .catch((error) => {
        console.error("Fulfill reservation error:", error);
        Alert.alert(t("common.error"), t("errors.generic"));
      })
      .finally(() => {
        setIsFulfilling(false);
      });
  };

  // Get all product variations from products data
  const allProductVariations =
    productsData?.flatMap((product) =>
      product.product_variations.map((variation) => ({
        ...variation,
        productName: product.name,
      }))
    ) || [];

  // Filtered lists for pickers
  const filteredProductVariations = allProductVariations.filter((variation) =>
    `${variation.productName} ${variation.name}`
      .toLowerCase()
      .includes(productSearchQuery.toLowerCase())
  );

  const filteredCustomers =
    customersData?.filter((customer) =>
      customer.name
        .toLowerCase()
        .includes(customerSearchQuery.toLowerCase())
    ) || [];

  const selectedProductVariation = allProductVariations.find(
    (pv) => pv.id === formData.productVariationId
  );
  const selectedCustomer = customersData?.find(
    (c) => c.id === formData.customerId
  );

  // Render reservation form
  const renderReservationForm = () => (
    <View style={styles.formContainer}>
      {/* Product Selection */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
          {t("reservation.product")} *
        </Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              setOpenDropdown(openDropdown === "product" ? null : "product")
            }
          >
            <Package size={20} color={colors.textSecondary} />
            <Text
              style={[
                styles.pickerText,
                {
                  color: selectedProductVariation
                    ? colors.textPrimary
                    : colors.textSecondary,
                },
              ]}
            >
              {selectedProductVariation
                ? `${selectedProductVariation.productName} - ${selectedProductVariation.name}`
                : t("reservation.selectProduct")}
            </Text>
          </TouchableOpacity>

          {openDropdown === "product" && (
            <>
              <TouchableOpacity
                style={styles.dropdownBackdrop}
                onPress={() => setOpenDropdown(null)}
              />
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.dropdownSearch,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={t("reservation.selectProduct")}
                  placeholderTextColor={colors.textSecondary}
                  value={productSearchQuery}
                  onChangeText={setProductSearchQuery}
                />
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {filteredProductVariations.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dropdownItem,
                        {
                          backgroundColor:
                            item.id === formData.productVariationId
                              ? colors.primary + "20"
                              : "transparent",
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        setFormData({
                          ...formData,
                          productVariationId: item.id,
                        });
                        setOpenDropdown(null);
                        setProductSearchQuery("");
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <Text
                          style={[
                            styles.dropdownItemTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {item.productName} - {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.dropdownItemSubtitle,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.selling_price.toLocaleString()}{" "}
                          {t("common.currency")}
                        </Text>
                      </View>
                      {item.id === formData.productVariationId && (
                        <Check size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {filteredProductVariations.length === 0 && (
                    <View style={styles.dropdownEmpty}>
                      <Text
                        style={[
                          styles.dropdownEmptyText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("common.noData")}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Customer Selection */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
          {t("reservation.customer")} *
        </Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              setOpenDropdown(
                openDropdown === "customer" ? null : "customer"
              )
            }
          >
            <User size={20} color={colors.textSecondary} />
            <Text
              style={[
                styles.pickerText,
                {
                  color: selectedCustomer
                    ? colors.textPrimary
                    : colors.textSecondary,
                },
              ]}
            >
              {selectedCustomer
                ? selectedCustomer.name
                : t("reservation.selectCustomer")}
            </Text>
          </TouchableOpacity>

          {openDropdown === "customer" && (
            <>
              <TouchableOpacity
                style={styles.dropdownBackdrop}
                onPress={() => setOpenDropdown(null)}
              />
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.dropdownSearch,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={t("reservation.selectCustomer")}
                  placeholderTextColor={colors.textSecondary}
                  value={customerSearchQuery}
                  onChangeText={setCustomerSearchQuery}
                />
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {filteredCustomers.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dropdownItem,
                        {
                          backgroundColor:
                            item.id === formData.customerId
                              ? colors.primary + "20"
                              : "transparent",
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, customerId: item.id });
                        setOpenDropdown(null);
                        setCustomerSearchQuery("");
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <Text
                          style={[
                            styles.dropdownItemTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {item.name}
                        </Text>
                      </View>
                      {item.id === formData.customerId && (
                        <Check size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <View style={styles.dropdownEmpty}>
                      <Text
                        style={[
                          styles.dropdownEmptyText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("common.noData")}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Quantity */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
          {t("reservation.quantity")} *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          value={formData.quantity}
          onChangeText={(text) => setFormData({ ...formData, quantity: text })}
          placeholder={t("reservation.quantity")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      {/* Expected Pickup Date */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
          {t("reservation.expectedPickupDate")}
        </Text>
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                flex: 1,
              },
            ]}
            onPress={() => {
              setShowDatePicker(true);
            }}
          >
            <Calendar size={20} color={colors.textSecondary} />
            <Text
              style={[
                styles.pickerText,
                {
                  color: formData.expectedPickupDate
                    ? colors.textPrimary
                    : colors.textSecondary,
                },
              ]}
            >
              {formData.expectedPickupDate
                ? format(new Date(formData.expectedPickupDate), "dd.MM.yyyy")
                : t("reservation.expectedPickupDate")}
            </Text>
          </TouchableOpacity>
          {formData.expectedPickupDate && (
            <TouchableOpacity
              style={[
                styles.clearButton,
                {
                  backgroundColor: colors.error + "20",
                  borderColor: colors.error,
                },
              ]}
              onPress={() => {
                setFormData({ ...formData, expectedPickupDate: "" });
              }}
            >
              <X size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Total Amount */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
          {t("reservation.totalAmount")} *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          value={formData.totalAmount}
          onChangeText={(text) =>
            setFormData({ ...formData, totalAmount: text })
          }
          placeholder={t("reservation.totalAmount")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      {/* Deposit Amount */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
          {t("reservation.depositAmount")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          value={formData.depositAmount}
          onChangeText={(text) =>
            setFormData({ ...formData, depositAmount: text })
          }
          placeholder={t("reservation.depositAmount")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textPrimary }]}>
          {t("reservation.notes")}
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder={t("reservation.notes")}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        testID="reservations-screen"
      >
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: colors.surface,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
              textTransform: "none",
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarIndicatorStyle: {
              backgroundColor: colors.primary,
              height: 2,
            },
            tabBarScrollEnabled: true,
            tabBarItemStyle: {
              width: "auto",
              minWidth: 80,
            },
          }}
        >
          <Tab.Screen name="All" options={{ tabBarLabel: t("common.all") }}>
            {() => <ReservationsTab status="all" />}
          </Tab.Screen>
          <Tab.Screen
            name="Pending"
            options={{ tabBarLabel: t("reservation.pending") }}
          >
            {() => <ReservationsTab status="pending" />}
          </Tab.Screen>
          <Tab.Screen
            name="Partial"
            options={{ tabBarLabel: t("reservation.partial") }}
          >
            {() => <ReservationsTab status="partial" />}
          </Tab.Screen>
          <Tab.Screen
            name="Fulfilled"
            options={{ tabBarLabel: t("reservation.fulfilled") }}
          >
            {() => <ReservationsTab status="fulfilled" />}
          </Tab.Screen>
          <Tab.Screen
            name="Cancelled"
            options={{ tabBarLabel: t("reservation.cancelled") }}
          >
            {() => <ReservationsTab status="cancelled" />}
          </Tab.Screen>
        </Tab.Navigator>

        {/* FAB Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => {
            resetForm();
            createSheetRef.current?.present();
          }}
        >
          <Plus size={28} color={colors.textInverse} />
        </TouchableOpacity>

        {/* Create Reservation Bottom Sheet */}
        <BottomSheetModal
          ref={createSheetRef}
          index={0}
          snapPoints={["90%"]}
          onDismiss={() => {
            resetForm();
          }}
          backdropComponent={(props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              pressBehavior="close"
            />
          )}
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.bottomSheetContent}
          >
            <View style={styles.bottomSheetHeader}>
              <Text
                style={[styles.bottomSheetTitle, { color: colors.textPrimary }]}
              >
                {t("reservation.addReservation")}
              </Text>
              <TouchableOpacity
                onPress={() => createSheetRef.current?.dismiss()}
                style={styles.closeButton}
              >
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {renderReservationForm()}
            <View style={styles.bottomSheetFooter}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => createSheetRef.current?.dismiss()}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (
                    !formData.productVariationId ||
                    !formData.customerId ||
                    !formData.quantity ||
                    !formData.totalAmount
                  ) {
                    Alert.alert(
                      t("common.error"),
                      t("reservation.quantityRequired")
                    );
                    return;
                  }
                  createMutation.mutate(formData);
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: colors.textInverse },
                    ]}
                  >
                    {t("common.save")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </BottomSheetModal>

        {/* Fulfill Modal */}
        <Modal
          visible={fulfillModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFulfillModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.modalTitle, { color: colors.textPrimary }]}
                >
                  {t("reservation.fulfilled_action")}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFulfillModalVisible(false);
                    setSelectedReservation(null);
                    setFulfillQuantity("");
                  }}
                >
                  <X size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {selectedReservation && (
                <View style={styles.modalBody}>
                  <Text
                    style={[styles.modalLabel, { color: colors.textSecondary }]}
                  >
                    {selectedReservation.productVariation.product.name} -{" "}
                    {selectedReservation.productVariation.name}
                  </Text>
                  <Text
                    style={[styles.modalInfo, { color: colors.textSecondary }]}
                  >
                    {t("reservation.reservedQuantity")}:{" "}
                    {selectedReservation.reservedQuantity}
                  </Text>
                  <Text
                    style={[styles.modalInfo, { color: colors.textSecondary }]}
                  >
                    {t("reservation.fulfilledQuantity")}:{" "}
                    {selectedReservation.fulfilledQuantity}
                  </Text>
                  <Text style={[styles.modalInfo, { color: colors.warning }]}>
                    {t("common.remaining")}:{" "}
                    {selectedReservation.quantity -
                      selectedReservation.fulfilledQuantity}
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder={t("reservation.fulfillQuantity")}
                    placeholderTextColor={colors.textSecondary}
                    value={fulfillQuantity}
                    onChangeText={setFulfillQuantity}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setFulfillModalVisible(false);
                    setSelectedReservation(null);
                    setFulfillQuantity("");
                  }}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.success },
                  ]}
                  onPress={handleConfirmFulfill}
                  disabled={isFulfilling}
                >
                  {isFulfilling ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text
                      style={[
                        styles.saveButtonText,
                        { color: colors.textInverse },
                      ]}
                    >
                      {t("reservation.fulfilled_action")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                setShowDatePicker(false);
              }
              if (date && event.type === "set") {
                setSelectedDate(date);
                setFormData({
                  ...formData,
                  expectedPickupDate: date.toISOString().split("T")[0],
                });
                if (Platform.OS === "ios") {
                  setShowDatePicker(false);
                }
              } else if (event.type === "dismissed") {
                setShowDatePicker(false);
              }
            }}
            minimumDate={new Date()}
            themeVariant={theme === "dark" ? "dark" : "light"}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  reservationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  reservationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reservationInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reservationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  reservationActions: {
    flexDirection: "row",
    gap: 8,
  },
  fulfillButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // FAB styles
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  // Bottom sheet styles
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  bottomSheetFooter: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  // Form styles
  formContainer: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: "top",
  },
  // Date picker styles
  datePickerContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Dropdown styles
  dropdownContainer: {
    position: "relative",
  },
  dropdownBackdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  dropdown: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownSearch: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  dropdownItemSubtitle: {
    fontSize: 14,
  },
  dropdownEmpty: {
    padding: 24,
    alignItems: "center",
  },
  dropdownEmptyText: {
    fontSize: 16,
  },
});
