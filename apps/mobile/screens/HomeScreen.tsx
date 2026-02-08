import { Store, DashboardStats } from "@/types";
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "../context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  PackageSearch,
  ArrowLeftRight,
} from "lucide-react-native";
import { useAuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import { log } from "@/debugging/log";
import LowStockBanner from "@/src/components/LowStockBanner";
import { SkeletonStatCard } from "@/src/components/SkeletonLoader";

const PERIODS = ["1Д", "1Н", "1М", "3М", "6М", "1Г"] as const;
type Period = (typeof PERIODS)[number];
const MAX_REVENUE_POINTS = 7;
const MAX_PRODUCTS = 5;
const MAX_TRANSACTIONS = 5;
const CHART_HORIZONTAL_PADDING = 16;
const CHART_HEIGHT = 280;
const CHART_META_HEIGHT = 72;

const TX_TYPE_COLORS: Record<string, string> = {
  // Inflows
  import: "#10b981",
  return: "#10b981",
  repayment: "#10b981",
  transfer_in: "#10b981",
  // Outflows
  export: "#f59e0b",
  debt: "#f59e0b",
  transfer_out: "#f59e0b",
  supplier_return: "#f59e0b",
  // Internal
  adjustment: "#6366f1",
  exchange: "#6366f1",
  internal_use: "#6366f1",
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: { fontSize: 16, textAlign: "center" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 92,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statTitle: { fontSize: 14, fontWeight: "500", flex: 1, marginRight: 8 },
  iconContainer: { padding: 8, borderRadius: 8 },
  statValue: { fontSize: 20, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  chartSection: { marginBottom: 32 },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  periodSelector: { flexDirection: "row", marginLeft: 16 },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  periodText: { fontSize: 12, fontWeight: "600" },
  chartTabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  chartTab: { paddingBottom: 8, marginRight: 24 },
  chartTabText: { fontSize: 14, fontWeight: "600" },
  chartContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    borderRadius: 16,
    alignItems: "center",
    height: CHART_HEIGHT + 44 + CHART_META_HEIGHT,
    marginBottom: 16,
    overflow: "hidden",
  },
  noDataContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: { fontSize: 14 },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 16,
    width: "100%",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: "500" },
  chartToggle: {
    marginTop: 12,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chartToggleText: { fontSize: 12, fontWeight: "600" },
  detailedStats: { marginBottom: 24 },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailStatContainer: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailStatLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailStatValue: { fontSize: 18, fontWeight: "700" },
  topProductsSection: { marginBottom: 24 },
  topProductsCard: { borderRadius: 12, overflow: "hidden" },
  topProductItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  topProductName: { fontWeight: "500", fontSize: 14 },
  topProductQty: { fontSize: 14 },
});

const truncateLabel = (label: string, max = 10) => {
  if (label.length <= max) return label;
  return label.slice(0, max).trimEnd() + "...";
};

interface StatCardProps {
  title: string;
  value: string;
  trend: "up" | "down";
  icon?: "profit" | "supplier";
  isDark?: boolean;
  loading?: boolean;
}

const ChartLegend = ({
  items,
  isDark,
}: {
  items: { label: string; color: string }[];
  isDark: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.legendContainer}>
      {items.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const StatCard = React.memo(
  ({ title, value, trend, icon, isDark, loading }: StatCardProps) => {
    const { colors } = useTheme();

    if (loading) {
      return <SkeletonStatCard />;
    }

    let iconComponent = null;

    if (trend === "up") {
      iconComponent = <ArrowUpFromLine size={24} color="#10b981" />;
    } else if (trend === "down") {
      iconComponent = <ArrowDownToLine size={24} color="#f43f5e" />;
    } else if (icon === "profit") {
      iconComponent = <TrendingUp size={24} color="#6366f1" />;
    } else if (icon === "supplier") {
      iconComponent = <PackageSearch size={24} color="#f59e0b" />;
    }

    return (
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: isDark
              ? colors.surfaceSecondary
              : colors.background,
            borderColor: colors.border,
            shadowColor: isDark ? "#000" : "#ccc",
          },
        ]}
      >
        <View style={styles.statHeader}>
          <Text
            style={[styles.statTitle, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark
                  ? colors.backgroundSecondary
                  : "#f3f4f6",
              },
            ]}
          >
            {iconComponent}
          </View>
        </View>
          <Text
            style={[styles.statValue, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {value}
          </Text>
      </View>
    );
  }
);

StatCard.displayName = "StatCard";

const DetailStat = ({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string | number;
  isDark: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.detailStatContainer,
        {
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.detailStatValue, { color: colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1Н");
  const { isDark, colors } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [activeChart, setActiveChart] = useState<
    "revenue" | "products" | "transactions"
  >("revenue");
  const [showAllRevenue, setShowAllRevenue] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthContext((state) => state.user);

  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
    refetch: refetchStoreInfo,
  } = useQuery<Store | null>({
    queryKey: ["store", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await api.get<{ data: Store }>("/api/stores/my-store");
        return res.data;
      } catch (error) {
        log.error("HomeScreen", "Error fetching user store info", { error });
        return null;
      }
    },
    enabled: !!user?.id,
  });
  const storeCurrency = store?.currency ?? "UZS";

  // Calculate start/end dates based on selected period
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    switch (selectedPeriod) {
      case "1Д":
        start.setDate(end.getDate() - 1);
        break;
      case "1Н":
        start.setDate(end.getDate() - 7);
        break;
      case "1М":
        start.setMonth(end.getMonth() - 1);
        break;
      case "3М":
        start.setMonth(end.getMonth() - 3);
        break;
      case "6М":
        start.setMonth(end.getMonth() - 6);
        break;
      case "1Г":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [selectedPeriod]);

  // Fetch stats from backend using the same API as Web Dashboard
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<DashboardStats | null>({
    queryKey: [
      "dashboard-stats",
      store?.id,
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: async () => {
      if (!store?.id) return null;
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await api.get<DashboardStats>(
        `/api/transactions/stats?${params.toString()}`
      );
      return res; // api.get already returns the data (DashboardStats)
    },
    enabled: !!store?.id,
    refetchInterval: 30000,
  });

  const { data: lowStockResponse, refetch: refetchLowStock } = useQuery<{ lowStockItems: unknown[] } | null>({
    queryKey: ["lowStock", store?.id],
    queryFn: async () => {
      if (!store?.id) return { lowStockItems: [] };
      try {
        const res = await api.get<{ lowStockItems: unknown[] }>(
          `/api/inventory/low-stock?storeId=${encodeURIComponent(store.id)}`
        );
        return res; // api.get already returns the data
      } catch (error) {
        log.error("HomeScreen", "Error fetching low stock items", { error });
        return { lowStockItems: [] };
      }
    },
    enabled: !!store?.id,
  });

  const lowStockCount = lowStockResponse?.lowStockItems?.length || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStoreInfo(),
        refetchStats(),
        refetchLowStock(),
      ]);
    } catch (error) {
      log.error("HomeScreen", "Error refreshing data", { error });
    } finally {
      setRefreshing(false);
    }
  }, [refetchStoreInfo, refetchStats, refetchLowStock]);

  const handlePeriodSelect = useCallback((period: Period) => {
    setSelectedPeriod(period);
  }, []);

  const formatNumber = useCallback((amount: number) => {
    if (amount === 0) return "0";
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (absAmount >= 1_000_000_000)
      return (
        sign + (absAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B"
      );
    if (absAmount >= 1_000_000)
      return (
        sign + (absAmount / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
      );
    if (absAmount >= 1_000)
      return sign + (absAmount / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return sign + absAmount.toLocaleString();
  }, []);
  const formatNumberFull = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount)) return "0";
      return new Intl.NumberFormat(i18n.language || "ru-RU", {
        maximumFractionDigits: 0,
      }).format(amount);
    },
    [i18n.language]
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount)) return "0";
      return new Intl.NumberFormat(i18n.language || "ru-RU", {
        style: "currency",
        currency: storeCurrency || "UZS",
        maximumFractionDigits: 0,
      }).format(amount);
    },
    [i18n.language, storeCurrency]
  );

  const [chartParentWidth, setChartParentWidth] = useState(0);
  const onChartContainerLayout = useCallback(
    (e: any) => {
      const w = Math.floor(e?.nativeEvent?.layout?.width ?? 0);
      if (w > 0 && w !== chartParentWidth) setChartParentWidth(w);
    },
    [chartParentWidth]
  );

  if (storeLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("common.loading")}
          </Text>
        </View>
      </View>
    );
  }

  if (!store) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t("home.storeNotFound")}
            {storeError ? `\n${(storeError as Error).message}` : ""}
          </Text>
        </View>
      </View>
    );
  }

  const renderChart = () => {
    if (!stats) return null;
    // Gifted Charts defaults `parentWidth` to full screen, which causes overflow inside cards.
    // Wait for layout measurement so we can pass the real container width.
    if (!chartParentWidth) return null;
    const chartInnerWidth = Math.max(
      0,
      chartParentWidth - CHART_HORIZONTAL_PADDING * 2
    );
    if (!chartInnerWidth) return null;

    let data: any[] = [];
    let rawData: any[] = [];
    let noDataText = "";
    let isStacked = false;
    let showToggle = false;
    let toggleLabel = "";
    let onToggle: (() => void) | null = null;

    // Simplified chart logic to prevent TS recursion
    const commonProps: any = {
      isAnimated: true,
      barWidth: 16,
      spacing: 32,
      barBorderRadius: 4,
      height: CHART_HEIGHT,
      yAxisTextStyle: { color: isDark ? "#A9A9A9" : "#666" },
      yAxisLabelWidth: 50,
      parentWidth: chartInnerWidth,
      width: chartInnerWidth,
      xAxisLabelTextStyle: { color: isDark ? "#A9A9A9" : "#666", fontSize: 10 },
      xAxisTextNumberOfLines: 1,
    };

    if (activeChart === "revenue") {
      rawData = (stats.dailyBreakdown || []).map((d: any) => ({
        label: new Date(d.date).toLocaleDateString("default", {
          day: "numeric",
          month: "short",
        }),
        stacks: [
          { value: d.purchases, color: colors.chartTertiary },
          { value: d.revenue, color: colors.chartPrimary },
          { value: d.cogs, color: colors.error },
        ],
      }));
      data = showAllRevenue
        ? rawData
        : rawData.slice(Math.max(0, rawData.length - MAX_REVENUE_POINTS));
      showToggle = rawData.length > MAX_REVENUE_POINTS;
      toggleLabel = showAllRevenue
        ? t("common.showLess", { defaultValue: "Show less" })
        : t("common.showMore", { defaultValue: "Show more" });
      onToggle = () => setShowAllRevenue((prev) => !prev);
      noDataText = t("home.noData");
      isStacked = true;
    } else if (activeChart === "products") {
      rawData = (stats.topProductsByRevenue || [])
        .slice()
        .sort((a: any, b: any) => (b?.revenue ?? 0) - (a?.revenue ?? 0))
        .map((p: any) => ({
        value: p.revenue,
        label: truncateLabel(String(p.name ?? ""), 10),
        frontColor: "#30D158",
        gradientColor: "#7EF49D",
      }));
      data = showAllProducts ? rawData : rawData.slice(0, MAX_PRODUCTS);
      showToggle = rawData.length > MAX_PRODUCTS;
      toggleLabel = showAllProducts
        ? t("common.showLess", { defaultValue: "Show less" })
        : t("common.showMore", { defaultValue: "Show more" });
      onToggle = () => setShowAllProducts((prev) => !prev);
      noDataText = t("home.noProductData");
    } else {
      rawData = Object.entries(stats.byType || {})
        .map(([type, d]: [string, any]) => {
          const legendLabel = t(`transactions.types.${type}`, {
            defaultValue: type,
          });
          return {
            value: d.amount,
            label: truncateLabel(legendLabel, 12),
            legendLabel,
            frontColor: TX_TYPE_COLORS[type] || "#888888",
          };
        })
        .sort((a: any, b: any) => b.value - a.value);
      data = showAllTransactions ? rawData : rawData.slice(0, MAX_TRANSACTIONS);
      showToggle = rawData.length > MAX_TRANSACTIONS;
      toggleLabel = showAllTransactions
        ? t("common.showLess", { defaultValue: "Show less" })
        : t("common.showMore", { defaultValue: "Show more" });
      onToggle = () => setShowAllTransactions((prev) => !prev);
      noDataText = t("home.noTransactionData", {
        defaultValue: "No transaction data",
      });
    }

    if (data.length > 6) {
      commonProps.barWidth = 12;
      commonProps.spacing = 24;
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.textTertiary }]}>
            {noDataText}
          </Text>
        </View>
      );
    }

    return (
      <View style={{ width: "100%" }}>
        <BarChart
          {...commonProps}
          stackData={isStacked ? data : undefined}
          data={!isStacked ? data : undefined}
          formatYLabel={(label: string) => formatNumber(Number(label))}
        />
        {activeChart === "revenue" && (
          <ChartLegend
            isDark={isDark}
            items={[
              { label: t("home.in"), color: colors.chartTertiary },
              { label: t("home.out"), color: colors.chartPrimary },
            ]}
          />
        )}
        {activeChart === "transactions" && (
          <ChartLegend
            isDark={isDark}
            items={(showAllTransactions ? rawData : data).map((item: any) => ({
              label: item.legendLabel ?? item.label,
              color: item.frontColor,
            }))}
          />
        )}
        {showToggle && onToggle ? (
          <TouchableOpacity
            style={styles.chartToggle}
            onPress={onToggle}
            activeOpacity={0.8}
          >
            <Text style={[styles.chartToggleText, { color: colors.primary }]}>
              {toggleLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="home-screen"
    >
      <StatusBar
        backgroundColor={
          Platform.OS === "android" ? "transparent" : colors.background
        }
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent={Platform.OS === "android"}
      />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <LowStockBanner count={lowStockCount} />

        <View style={styles.statsGrid}>
          <StatCard
            title={t("home.in")}
            value={formatCurrency(stats?.totalIn || 0)}
            trend="up"
            isDark={isDark}
            loading={statsLoading}
          />
          <StatCard
            title={t("home.out")}
            value={formatCurrency(stats?.totalOut || 0)}
            trend="down"
            isDark={isDark}
            loading={statsLoading}
          />
          <StatCard
            title={t("home.profit")}
            value={formatCurrency(stats?.profit || 0)}
            trend="up"
            icon="profit"
            isDark={isDark}
            loading={statsLoading}
          />
          <StatCard
            title={t("home.deliveryCost")}
            value={formatCurrency(stats?.supplierCost || 0)}
            trend="down"
            icon="supplier"
            isDark={isDark}
            loading={statsLoading}
          />
        </View>

        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t("home.overview")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.periodSelector}
            >
              {PERIODS.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && {
                      backgroundColor: colors.primary,
                    },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => handlePeriodSelect(period)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      selectedPeriod === period
                        ? { color: "#fff" }
                        : { color: colors.textSecondary },
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.chartTabs}>
            {(["revenue", "products", "transactions"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chartTab,
                  activeChart === type && {
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => setActiveChart(type)}
              >
                <Text
                  style={[
                    styles.chartTabText,
                    {
                      color:
                        activeChart === type
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {t(`home.${type}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={[
              styles.chartContainer,
              { backgroundColor: isDark ? colors.surfaceSecondary : "#fff" },
            ]}
            onLayout={onChartContainerLayout}
          >
            {renderChart()}
          </View>
        </View>

        <View style={styles.detailedStats}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textPrimary, marginBottom: 12 },
            ]}
          >
            {t("home.detailedAnalytics")}
          </Text>
          <View style={styles.detailsGrid}>
            <DetailStat
              label={t("home.revenue")}
              value={formatCurrency(stats?.totalOut || 0)}
              isDark={isDark}
            />
            <DetailStat
              label={t("home.avgOrderValue")}
              value={formatCurrency(stats?.avgOrderValue || 0)}
              isDark={isDark}
            />
            <DetailStat
              label={t("home.totalTransactions")}
              value={formatNumberFull(stats?.transactionCount || 0)}
              isDark={isDark}
            />
            <DetailStat
              label={t("home.totalItemsSold")}
              value={formatNumberFull(stats?.totalItemsSold || 0)}
              isDark={isDark}
            />
            <DetailStat
              label={t("home.profitMargin")}
              value={(stats?.profitMargin || 0).toFixed(1) + "%"}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Top Selling Products List */}
        <View style={styles.topProductsSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textPrimary, marginBottom: 12 },
            ]}
          >
            {t("home.topSellingByQuantity")}
          </Text>
          <View
            style={[
              styles.topProductsCard,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : "#fff",
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            {!stats?.topProductsByQuantity ||
              stats.topProductsByQuantity.length === 0 ? (
              <Text
                style={{
                  padding: 16,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                {t("home.noData")}
              </Text>
            ) : (
              stats.topProductsByQuantity.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.topProductItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.topProductName,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.topProductQty,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatNumber(item.quantity)} {t("common.units")}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
