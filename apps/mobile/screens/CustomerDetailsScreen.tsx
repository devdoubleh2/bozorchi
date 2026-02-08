import React from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";
import {
  User,
  Mail,
  Phone,
  Star,
  Calendar,
  ShoppingBag,
  DollarSign,
  TrendingUp,
} from "lucide-react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthContext } from "../context/AuthContext";
import { formatPrice } from "@/src/utils/currency";
import { useShallow } from "zustand/react/shallow";
import { SkeletonLoader } from "@/src/components/SkeletonLoader";

interface LoyaltyCard {
  id: string;
  card_number: string;
  customer_id: string;
  points: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  product_variation_id: string;
  quantity: number;
  selling_price: number;
  delivery_cost: number;
  unit_price: number;
  total_amount: number;
  transaction_type: string;
  transaction_date: string;
  remarks: string | null;
  product_variation: {
    name: string;
    product: {
      name: string;
      image_url: string | null;
    };
  };
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  store_id: string;
  created_at: string;
  updated_at: string;
  loyalty_card: LoyaltyCard | null;
  transactions: Transaction[];
}

type CustomerDetailsRouteProp = RouteProp<
  RootStackParamList,
  "CustomerDetails"
>;

const isSaleTransaction = (type?: string | null) =>
  type === "export" || type === "debt";

export default function CustomerDetailsScreen() {
  const route = useRoute<CustomerDetailsRouteProp>();
  const { customerId } = route.params;
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { storeData } = useAuthContext(
    useShallow((state) => ({ storeData: state.userStore }))
  );

  const {
    data: customer,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["customer", customerId, storeData?.store?.id],
    queryFn: async () => {
      if (!storeData?.store?.id) throw new Error("Store ID not available");
      const res = await api.get<{ customer: Customer }>(
        `/api/customers/${customerId}?storeId=${storeData.store.id}`
      );
      return res.customer;
    },
    enabled: !!storeData?.store?.id && !!customerId,
  });

  if (isLoading || (isFetching && !customer)) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.customerHeader}>
              <SkeletonLoader
                width={72}
                height={72}
                borderRadius={36}
                style={styles.skeletonAvatar}
              />
              <View style={styles.customerHeaderInfo}>
                <SkeletonLoader
                  width="60%"
                  height={22}
                  style={styles.skeletonLineLarge}
                />
                <SkeletonLoader
                  width="80%"
                  height={14}
                  style={styles.skeletonLine}
                />
                <SkeletonLoader width="50%" height={14} />
              </View>
            </View>
            <View style={[styles.loyaltyCard, isDark && styles.loyaltyCardDark]}>
              <SkeletonLoader
                width="40%"
                height={16}
                style={styles.skeletonLine}
              />
              <SkeletonLoader
                width="70%"
                height={26}
                style={styles.skeletonLineLarge}
              />
              <View style={styles.pointsContainer}>
                <SkeletonLoader
                  width={80}
                  height={24}
                  style={styles.pointsSkeletonValue}
                />
                <SkeletonLoader width={120} height={16} />
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[styles.statCard, isDark && styles.statCardDark]}
              >
                <SkeletonLoader
                  width="40%"
                  height={16}
                  style={styles.skeletonLine}
                />
                <SkeletonLoader width="60%" height={24} />
              </View>
            ))}
          </View>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <SkeletonLoader
              width="50%"
              height={20}
              style={styles.skeletonLineLarge}
            />
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.transactionItem,
                  isDark && styles.transactionItemDark,
                ]}
              >
                <View style={styles.transactionLeft}>
                  <SkeletonLoader
                    width="80%"
                    height={16}
                    style={styles.skeletonLine}
                  />
                  <SkeletonLoader width="60%" height={12} />
                </View>
                <View style={styles.transactionRight}>
                  <SkeletonLoader
                    width={90}
                    height={16}
                    style={styles.skeletonLine}
                  />
                  <SkeletonLoader width={70} height={12} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
            {t("customers.customerNotFound")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, isDark && styles.containerDark]}
      testID="customer-details-screen"
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Info Card */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.customerHeader}>
            <View
              style={[styles.avatarLarge, isDark && styles.avatarLargeDark]}
            >
              <User size={48} color={isDark ? "#fff" : "#000"} />
            </View>
            <View style={styles.customerHeaderInfo}>
              <Text
                style={[styles.customerName, isDark && styles.customerNameDark]}
              >
                {customer.name}
              </Text>
              {customer.email && (
                <View style={styles.contactRow}>
                  <Mail size={16} color="#6B7280" />
                  <Text
                    style={[
                      styles.contactText,
                      isDark && styles.contactTextDark,
                    ]}
                  >
                    {customer.email}
                  </Text>
                </View>
              )}
              {customer.phone && (
                <View style={styles.contactRow}>
                  <Phone size={16} color="#6B7280" />
                  <Text
                    style={[
                      styles.contactText,
                      isDark && styles.contactTextDark,
                    ]}
                  >
                    {customer.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {customer.loyalty_card && (
            <View
              style={[styles.loyaltyCard, isDark && styles.loyaltyCardDark]}
            >
              <View style={styles.loyaltyCardHeader}>
                <Star size={20} color="#FFD700" fill="#FFD700" />
                <Text
                  style={[
                    styles.loyaltyCardTitle,
                    isDark && styles.loyaltyCardTitleDark,
                  ]}
                >
                  {t("customers.loyaltyCard")}
                </Text>
              </View>
              <Text
                style={[styles.cardNumber, isDark && styles.cardNumberDark]}
              >
                {customer.loyalty_card.card_number}
              </Text>
              <View style={styles.pointsContainer}>
                <Text
                  style={[styles.pointsValue, isDark && styles.pointsValueDark]}
                >
                  {customer.loyalty_card.points}
                </Text>
                <Text
                  style={[styles.pointsLabel, isDark && styles.pointsLabelDark]}
                >
                  {t("customers.loyaltyPoints")}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <DollarSign size={24} color="#10B981" />
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {formatPrice(
                customer.transactions.reduce((acc, transaction) => {
                  return acc + transaction.total_amount;
                }, 0),
                storeData?.store?.currency || "UZS"
              )}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
              {t("home.totalSpent")}
            </Text>
          </View>

          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <ShoppingBag size={24} color="#3B82F6" />
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {customer.transactions.length}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
              {t("customers.totalTransactions")}
            </Text>
          </View>

          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <TrendingUp size={24} color="#F59E0B" />
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {formatPrice(
                customer.transactions.reduce((acc, transaction) => {
                  return acc + transaction.total_amount;
                }, 0) / customer.transactions.length,
                storeData?.store?.currency || "UZS"
              )}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
              {t("home.avgOrderValue")}
            </Text>
          </View>

          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <Calendar size={24} color="#8B5CF6" />
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {customer.transactions.length > 0
                ? new Date(
                  customer.transactions[0].transaction_date
                ).toLocaleDateString()
                : t("customers.never")}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
              {t("customers.lastTransaction")}
            </Text>
          </View>
        </View>

        {/* Transaction History */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text
            style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
          >
            {t("transactions.title")}
          </Text>

          {customer.transactions && customer.transactions.length > 0 ? (
            customer.transactions.slice(0, 10).map((transaction) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  isDark && styles.transactionItemDark,
                ]}
              >
                <View style={styles.transactionLeft}>
                  <Text
                    style={[
                      styles.transactionName,
                      isDark && styles.transactionNameDark,
                    ]}
                  >
                    {transaction.product_variation.product.name} -{" "}
                    {transaction.product_variation.name}
                  </Text>
                  <Text
                    style={[
                      styles.transactionDate,
                      isDark && styles.transactionDateDark,
                    ]}
                  >
                    {new Date(
                      transaction.transaction_date
                    ).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      isDark && styles.transactionAmountDark,
                      isSaleTransaction(transaction.transaction_type) &&
                      styles.transactionAmountPositive,
                      transaction.transaction_type === "return" &&
                      styles.transactionAmountNegative,
                    ]}
                  >
                    {isSaleTransaction(transaction.transaction_type) ? "+" : "-"}
                    {formatPrice(
                      transaction.total_amount,
                      storeData?.store?.currency || "UZS"
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.transactionQuantity,
                      isDark && styles.transactionQuantityDark,
                    ]}
                  >
                    {transaction.quantity} {t("common.units")}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.noDataText, isDark && styles.noDataTextDark]}>
              {t("common.noData")}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerDark: {
    backgroundColor: "#1C1C1E",
    borderBottomColor: "#2C2C2E",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerTitleDark: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },
  errorTextDark: {
    color: "#EF4444",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarLargeDark: {
    backgroundColor: "#2C2C2E",
  },
  skeletonAvatar: {
    marginRight: 16,
  },
  skeletonLineLarge: {
    marginBottom: 12,
  },
  skeletonLine: {
    marginBottom: 8,
  },
  customerHeaderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  customerNameDark: {
    color: "#fff",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  contactText: {
    fontSize: 14,
    color: "#6B7280",
  },
  contactTextDark: {
    color: "#9CA3AF",
  },
  loyaltyCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  loyaltyCardDark: {
    backgroundColor: "#422006",
  },
  loyaltyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  loyaltyCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E",
  },
  loyaltyCardTitleDark: {
    color: "#FCD34D",
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#78350F",
    marginBottom: 12,
    letterSpacing: 2,
  },
  cardNumberDark: {
    color: "#FDE68A",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#92400E",
  },
  pointsValueDark: {
    color: "#FCD34D",
  },
  pointsSkeletonValue: {
    marginRight: 12,
  },
  pointsLabel: {
    fontSize: 14,
    color: "#92400E",
  },
  pointsLabelDark: {
    color: "#FDE68A",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statCardDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statValueDark: {
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  statLabelDark: {
    color: "#9CA3AF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: "#fff",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  transactionItemDark: {
    borderBottomColor: "#2C2C2E",
  },
  transactionLeft: {
    flex: 1,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  transactionNameDark: {
    color: "#fff",
  },
  transactionDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  transactionDateDark: {
    color: "#9CA3AF",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  transactionAmountDark: {
    color: "#fff",
  },
  transactionAmountPositive: {
    color: "#10B981",
  },
  transactionAmountNegative: {
    color: "#EF4444",
  },
  transactionQuantity: {
    fontSize: 12,
    color: "#6B7280",
  },
  transactionQuantityDark: {
    color: "#9CA3AF",
  },
  noDataText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 20,
  },
  noDataTextDark: {
    color: "#6B7280",
  },
});
