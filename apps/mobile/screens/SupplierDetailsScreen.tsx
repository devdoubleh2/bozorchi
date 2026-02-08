import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import {
  Package,
  DollarSign,
  Calendar,
  Plus,
  FileText,
  CreditCard,
} from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

const Tab = createMaterialTopTabNavigator();

type SupplierDetailsRouteProp = RouteProp<
  RootStackParamList,
  "SupplierDetails"
>;

interface SupplierOrder {
  id: string;
  order_number: string;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  status: "pending" | "partial" | "received" | "cancelled";
  total_amount: number;
  notes: string | null;
}

interface SupplierPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: "cash" | "card";
  notes: string | null;
}

interface SupplierDetails {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  totalOrders: number;
  totalPayments: number;
  supplier_orders: SupplierOrder[];
  supplier_payments: SupplierPayment[];
}

// Orders Tab Component
function OrdersTab({ supplier }: { supplier: SupplierDetails }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return colors.success;
      case "partial":
        return colors.warning;
      case "cancelled":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <FlatList
      data={supplier.supplier_orders || []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      scrollEnabled={false}
      ListEmptyComponent={
        <View style={styles.emptyTab}>
          <FileText size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("supplier.noOrders")}
          </Text>
        </View>
      }
      renderItem={({ item: order }) => (
        <View
          style={[
            styles.listRow,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.rowHeader}>
            <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
              {order.order_number}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(order.status) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {t(`supplier.status.${order.status}`)}
              </Text>
            </View>
          </View>
          <View style={styles.rowBody}>
            <View style={styles.rowItem}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={[styles.rowText, { color: colors.textSecondary }]}>
                {new Date(order.order_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.rowItem}>
              <DollarSign size={16} color={colors.textSecondary} />
              <Text style={[styles.rowText, { color: colors.textPrimary }]}>
                {(order.total_amount || 0).toLocaleString()}{" "}
                {t("common.currency")}
              </Text>
            </View>
          </View>
        </View>
      )}
    />
  );
}

// Payments Tab Component
function PaymentsTab({ supplier }: { supplier: SupplierDetails }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return t("supplier.paymentCard");
      default:
        return t("supplier.paymentCash");
    }
  };

  return (
    <FlatList
      data={supplier.supplier_payments || []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      scrollEnabled={false}
      ListEmptyComponent={
        <View style={styles.emptyTab}>
          <CreditCard size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("supplier.noPayments")}
          </Text>
        </View>
      }
      renderItem={({ item: payment }) => (
        <View
          style={[
            styles.listRow,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.paymentRowHeader}>
            <View
              style={[
                styles.paymentIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <CreditCard size={20} color={colors.primary} />
            </View>
            <View style={styles.paymentInfo}>
              <Text
                style={[styles.paymentAmount, { color: colors.textPrimary }]}
              >
                {(payment.amount || 0).toLocaleString()} {t("common.currency")}
              </Text>
              <Text
                style={[styles.paymentMethod, { color: colors.textSecondary }]}
              >
                {getPaymentMethodLabel(payment.payment_method)}
              </Text>
            </View>
            <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
              {new Date(payment.payment_date).toLocaleDateString()}
            </Text>
          </View>
          {payment.notes && (
            <Text style={[styles.paymentNotes, { color: colors.textSecondary }]}>
              {payment.notes}
            </Text>
          )}
        </View>
      )}
    />
  );
}

export default function SupplierDetailsScreen() {
  const route = useRoute<SupplierDetailsRouteProp>();
  const { supplierId } = route.params;
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "cash" as "cash" | "card",
    notes: "",
  });

  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const paymentSheetRef = useRef<BottomSheetModal>(null);

  // Fetch supplier details
  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: async () => {
      const response = await api.get<{ supplier: SupplierDetails }>(
        `/api/suppliers/${supplierId}`
      );
      return response.supplier as SupplierDetails;
    },
  });

  // Update header title with supplier name
  useLayoutEffect(() => {
    if (supplier) {
      navigation.setOptions({
        headerTitle: supplier.name,
      });
    }
  }, [navigation, supplier]);

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async ({
      orderId,
      data,
    }: {
      orderId?: string;
      data: typeof paymentForm;
    }) => {
      if (orderId) {
        return await api.post(`/supplier-orders/${orderId}/payments`, {
          amount: parseFloat(data.amount),
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        });
      }
      // If no order ID, it's a general payment to the supplier
      // This would need a different endpoint, for now we'll use order payment
      throw new Error("General supplier payments not yet implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
      paymentSheetRef.current?.dismiss();
      resetPaymentForm();
      Alert.alert(t("common.success"), t("supplier.paymentRecorded"));
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: "",
      paymentMethod: "cash",
      notes: "",
    });
  };

  const handleRecordPayment = useCallback(() => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      Alert.alert(t("common.error"), t("supplier.invalidAmount"));
      return;
    }

    // Get the latest pending order for this payment
    const pendingOrder = supplier?.supplier_orders.find(
      (order) => order.status === "pending" || order.status === "partial"
    );

    if (pendingOrder) {
      recordPaymentMutation.mutate({
        orderId: pendingOrder.id,
        data: paymentForm,
      });
    } else {
      Alert.alert(t("common.error"), t("supplier.noPendingOrders"));
    }
  }, [paymentForm, supplier, t]);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return t("supplier.paymentCard");
      default:
        return t("supplier.paymentCash");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("supplier.notFound")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="supplier-details-screen"
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text
                style={[styles.balanceLabel, { color: colors.textSecondary }]}
              >
                {t("supplier.totalOrders")}
              </Text>
              <Text
                style={[styles.balanceValue, { color: colors.textPrimary }]}
              >
                {(supplier.totalOrders || 0).toLocaleString()}{" "}
                {t("common.currency")}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text
                style={[styles.balanceLabel, { color: colors.textSecondary }]}
              >
                {t("supplier.totalPaid")}
              </Text>
              <Text style={[styles.balanceValue, { color: colors.success }]}>
                {(supplier.totalPayments || 0).toLocaleString()}{" "}
                {t("common.currency")}
              </Text>
            </View>
          </View>
          <View
            style={[styles.balanceDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.balanceMain}>
            <Text
              style={[styles.balanceLabel, { color: colors.textSecondary }]}
            >
              {t("supplier.balance")}
            </Text>
            <Text
              style={[
                styles.balanceMainValue,
                { color: supplier.balance > 0 ? colors.error : colors.success },
              ]}
            >
              {(supplier.balance || 0).toLocaleString()} {t("common.currency")}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.paymentButton, { backgroundColor: colors.primary }]}
            onPress={() => paymentSheetRef.current?.present()}
          >
            <CreditCard size={20} color="#fff" />
            <Text style={styles.paymentButtonText}>
              {t("supplier.recordPayment")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        {(supplier.phone || supplier.email || supplier.address) && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t("supplier.contactInfo")}
            </Text>
            {supplier.phone && (
              <View style={styles.infoRow}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  {t("supplier.phone")}:
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {supplier.phone}
                </Text>
              </View>
            )}
            {supplier.email && (
              <View style={styles.infoRow}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  {t("supplier.email")}:
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {supplier.email}
                </Text>
              </View>
            )}
            {supplier.address && (
              <View style={styles.infoRow}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  {t("supplier.address")}:
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {supplier.address}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tabs */}
        <View style={{ flex: 1 }}>
          <Tab.Navigator
            screenOptions={{
              tabBarStyle: {
                backgroundColor: isDark
                  ? colors.surfaceSecondary
                  : colors.surface,
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
              tabBarLabelStyle: {
                fontSize: 14,
                fontWeight: "600",
                textTransform: "none",
              },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textSecondary,
              tabBarIndicatorStyle: {
                backgroundColor: colors.primary,
                height: 3,
              },
            }}
          >
            <Tab.Screen
              name="Orders"
              options={{
                tabBarLabel: `${t("supplier.orders")} (${
                  (supplier.supplier_orders || []).length
                })`,
              }}
            >
              {() => <OrdersTab supplier={supplier} />}
            </Tab.Screen>
            <Tab.Screen
              name="Payments"
              options={{
                tabBarLabel: `${t("supplier.payments")} (${
                  (supplier.supplier_payments || []).length
                })`,
              }}
            >
              {() => <PaymentsTab supplier={supplier} />}
            </Tab.Screen>
          </Tab.Navigator>
        </View>
      </ScrollView>

      {/* Payment Bottom Sheet */}
      <BottomSheetModal
        ref={paymentSheetRef}
        index={0}
        snapPoints={["70%"]}
        onDismiss={() => {
          resetPaymentForm();
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
        <BottomSheetScrollView style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
            {t("supplier.recordPayment")}
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("supplier.amount")} *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                },
              ]}
              value={paymentForm.amount}
              onChangeText={(text) =>
                setPaymentForm({ ...paymentForm, amount: text })
              }
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("supplier.paymentMethod")} *
            </Text>
            <View style={styles.paymentMethods}>
              {["cash", "card"].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    {
                      backgroundColor:
                        paymentForm.paymentMethod === method
                          ? colors.primary
                          : colors.backgroundSecondary,
                    },
                  ]}
                  onPress={() =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: method as "cash" | "card",
                    })
                  }
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      {
                        color:
                          paymentForm.paymentMethod === method
                            ? "#fff"
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {getPaymentMethodLabel(method)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("supplier.notes")}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                },
              ]}
              value={paymentForm.notes}
              onChangeText={(text) =>
                setPaymentForm({ ...paymentForm, notes: text })
              }
              placeholder={t("supplier.notesPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleRecordPayment}
            disabled={recordPaymentMutation.isPending}
          >
            {recordPaymentMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t("common.save")}</Text>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  balanceDivider: {
    height: 1,
    marginVertical: 16,
  },
  balanceMain: {
    alignItems: "center",
    marginBottom: 16,
  },
  balanceMainValue: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 8,
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  listRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rowBody: {
    marginTop: 10,
    gap: 10,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowText: {
    fontSize: 14,
  },
  paymentRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 46,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
  },
  paymentDate: {
    fontSize: 12,
  },
  paymentNotes: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyTab: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
