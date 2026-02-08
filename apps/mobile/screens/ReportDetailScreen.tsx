import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useRoute } from "@react-navigation/native";
import { useAuthContext } from "../context/AuthContext";
import {
  useSalesReport,
  useInventoryReport,
  useCustomerReport,
  useFinancialReport,
  useProductPerformance,
  useExportReport,
  getDateRangeForPeriod,
  ReportType,
  ExportFormat,
} from "../src/hooks/useReports";
import { Download } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LineChart, BarChart, PieChart } from "react-native-gifted-charts";

type Period = "today" | "1day" | "1week" | "1month" | "3month" | "1year";

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");

export default function ReportDetailScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const user = useAuthContext((state) => state.user);
  const { reportType } = route.params as { reportType: ReportType };

  const [customDateRange, setCustomDateRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  const exportMutation = useExportReport();

  const handleExport = async (
    format: ExportFormat,
    period: Period = "today"
  ) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const dateRange = customDateRange || getDateRangeForPeriod(period as any);
      const queryParams: Record<string, string> = {
        storeId: user?.id || "",
      };

      if (reportType !== "inventory") {
        queryParams.startDate = dateRange.startDate;
        queryParams.endDate = dateRange.endDate;
      }

      await exportMutation.mutateAsync({
        reportType,
        format,
        queryParams,
      });

      Alert.alert(
        t("reports.export.success.title"),
        t("reports.export.success.message")
      );
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("reports.export.error.title"),
        t("reports.export.error.message")
      );
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrency = (value: number) => {
    return `${formatNumber(value)} ${t("common.currency")}`;
  };

  // Time Duration Tab Component
  const TimeDurationTab = ({ period }: { period: Period }) => {
    const currentDateRange = useMemo(
      () => customDateRange || getDateRangeForPeriod(period as any),
      [period, customDateRange]
    );

    // Fetch the appropriate report based on type and period
    const salesReport = useSalesReport(
      reportType === "sales"
        ? { storeId: user?.id || "", ...currentDateRange }
        : { storeId: "", startDate: "", endDate: "" }
    );

    const inventoryReport = useInventoryReport(
      reportType === "inventory" ? { storeId: user?.id || "" } : { storeId: "" }
    );

    const customerReport = useCustomerReport(
      reportType === "customers"
        ? { storeId: user?.id || "", ...currentDateRange }
        : { storeId: "", startDate: "", endDate: "" }
    );

    const financialReport = useFinancialReport(
      reportType === "financial"
        ? { storeId: user?.id || "", ...currentDateRange }
        : { storeId: "", startDate: "", endDate: "" }
    );

    const productPerformance = useProductPerformance(
      reportType === "products"
        ? { storeId: user?.id || "", ...currentDateRange }
        : { storeId: "", startDate: "", endDate: "" }
    );

    const currentReport = {
      sales: salesReport,
      inventory: inventoryReport,
      customers: customerReport,
      financial: financialReport,
      products: productPerformance,
    }[reportType];

    const { data, isLoading, error, refetch } = currentReport;

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            {t("reports.loading")}
          </Text>
        </View>
      );
    }

    if (error) {
      console.log("Report error:", error);
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
            {t("reports.error")}
          </Text>
          <Text
            style={[
              styles.errorText,
              isDark && styles.errorTextDark,
              { fontSize: 12, marginTop: 8 },
            ]}
          >
            {error?.message || "Unknown error"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, isDark && styles.retryButtonDark]}
            onPress={() => refetch()}
          >
            <Text
              style={[
                styles.retryButtonText,
                isDark && styles.retryButtonTextDark,
              ]}
            >
              {t("common.retry")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!data) {
      console.log("No data received for report type:", reportType);
      return null;
    }

    console.log("Report data received:", { reportType, data });

    // Render the appropriate content based on report type
    switch (reportType) {
      case "sales":
        return renderSalesContent(data as any);
      case "inventory":
        return renderInventoryContent(data as any);
      case "customers":
        return renderCustomerContent(data as any);
      case "financial":
        return renderFinancialContent(data as any);
      case "products":
        return renderProductContent(data as any);
      default:
        return null;
    }
  };

  const renderExportButtons = () => (
    <View style={styles.exportButtons}>
      <TouchableOpacity
        style={[styles.exportButton, isDark && styles.exportButtonDark]}
        onPress={() => handleExport("excel")}
        disabled={exportMutation.isPending}
      >
        <Download size={18} color={isDark ? "#fff" : "#000"} />
        <Text
          style={[
            styles.exportButtonText,
            isDark && styles.exportButtonTextDark,
          ]}
        >
          {t("reports.export.excel")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.exportButton, isDark && styles.exportButtonDark]}
        onPress={() => handleExport("csv")}
        disabled={exportMutation.isPending}
      >
        <Download size={18} color={isDark ? "#fff" : "#000"} />
        <Text
          style={[
            styles.exportButtonText,
            isDark && styles.exportButtonTextDark,
          ]}
        >
          {t("reports.export.csv")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Consolidated content render functions
  const renderSalesContent = (salesData: any) => (
    <View
      style={[
        styles.tabContentWrapper,
        { backgroundColor: isDark ? "#000000" : "#F9F9F9" },
      ]}
    >
      <ScrollView style={styles.tabContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.sales.totalRevenue")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(salesData.totalRevenue)}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.sales.grossProfit")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(salesData.grossProfit)}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.sales.profitMargin")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {salesData.profitMargin.toFixed(2)}%
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.sales.avgOrderValue")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(salesData.averageOrderValue)}
            </Text>
          </View>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text
            style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
          >
            {t("reports.sales.transactions")}
          </Text>
          <Text
            style={[styles.sectionValue, isDark && styles.sectionValueDark]}
          >
            {salesData.totalTransactions}
          </Text>
        </View>

        {/* Charts Section */}
        <View style={[styles.chartCard, isDark && styles.chartCardDark]}>
          <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
            {t("reports.sales.revenueOverTime")}
          </Text>
          <LineChart
            data={[
              { value: salesData.totalRevenue * 0.6, label: "W1" },
              { value: salesData.totalRevenue * 0.7, label: "W2" },
              { value: salesData.totalRevenue * 0.8, label: "W3" },
              { value: salesData.totalRevenue * 1.0, label: "W4" },
            ]}
            width={width - 64}
            height={220}
            color="#34C759"
            thickness={3}
            curved
            areaChart
            startFillColor="#34C759"
            startOpacity={0.8}
            endFillColor="#34C759"
            endOpacity={0.3}
            spacing={60}
            initialSpacing={10}
            noOfSections={4}
            yAxisColor={isDark ? "#2C2C2E" : "#E5E7EB"}
            xAxisColor={isDark ? "#2C2C2E" : "#E5E7EB"}
            yAxisTextStyle={{ color: isDark ? "#A9A9A9" : "#6B7280" }}
            xAxisLabelTextStyle={{ color: isDark ? "#A9A9A9" : "#6B7280" }}
          />
        </View>

        <View style={[styles.chartCard, isDark && styles.chartCardDark]}>
          <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
            {t("reports.sales.profitOverTime")}
          </Text>
          <BarChart
            data={[
              {
                value: salesData.grossProfit * 0.25,
                label: "W1",
                frontColor: "#34C759",
              },
              {
                value: salesData.grossProfit * 0.35,
                label: "W2",
                frontColor: "#34C759",
              },
              {
                value: salesData.grossProfit * 0.2,
                label: "W3",
                frontColor: "#34C759",
              },
              {
                value: salesData.grossProfit * 0.2,
                label: "W4",
                frontColor: "#34C759",
              },
            ]}
            width={width - 96}
            height={220}
            barWidth={40}
            spacing={30}
            roundedTop
            roundedBottom
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={{ color: isDark ? "#A9A9A9" : "#6B7280" }}
            xAxisLabelTextStyle={{ color: isDark ? "#A9A9A9" : "#6B7280" }}
          />
        </View>
      </ScrollView>
    </View>
  );

  const renderInventoryContent = (inventoryData: any) => (
    <View
      style={[
        styles.tabContentWrapper,
        { backgroundColor: isDark ? "#000000" : "#F9F9F9" },
      ]}
    >
      <ScrollView style={styles.tabContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.inventory.totalProducts")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {inventoryData.totalProducts}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.inventory.stockValue")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(inventoryData.totalStockValue)}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.inventory.lowStock")}
            </Text>
            <Text
              style={[
                styles.summaryValue,
                isDark && styles.summaryValueDark,
                styles.alertValue,
              ]}
            >
              {inventoryData.lowStockItems}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.inventory.turnoverRate")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {inventoryData.inventoryTurnoverRate.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Charts Section */}
        <View style={[styles.chartCard, isDark && styles.chartCardDark]}>
          <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
            {t("reports.inventory.stockDistribution")}
          </Text>
          <View style={styles.chartCenter}>
            <PieChart
              data={[
                {
                  value:
                    inventoryData.totalProducts - inventoryData.lowStockItems,
                  color: "#10B981",
                  text: `${
                    inventoryData.totalProducts - inventoryData.lowStockItems
                  }`,
                },
                {
                  value: inventoryData.lowStockItems,
                  color: "#EF4444",
                  text: `${inventoryData.lowStockItems}`,
                },
              ]}
              donut
              radius={90}
              innerRadius={60}
              centerLabelComponent={() => (
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: isDark ? "#fff" : "#000",
                  }}
                >
                  {inventoryData.totalProducts}
                </Text>
              )}
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#10B981" }]}
              />
              <Text
                style={[styles.legendText, isDark && styles.legendTextDark]}
              >
                In Stock (
                {inventoryData.totalProducts - inventoryData.lowStockItems})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#EF4444" }]}
              />
              <Text
                style={[styles.legendText, isDark && styles.legendTextDark]}
              >
                Low Stock ({inventoryData.lowStockItems})
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderCustomerContent = (customerData: any) => (
    <View
      style={[
        styles.tabContentWrapper,
        { backgroundColor: isDark ? "#000000" : "#F9F9F9" },
      ]}
    >
      <ScrollView style={styles.tabContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.customers.total")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {customerData.totalCustomers}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.customers.new")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {customerData.newCustomers}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.customers.avgLifetimeValue")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(customerData.averageLifetimeValue)}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.customers.totalRevenue")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(customerData.totalRevenue)}
            </Text>
          </View>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text
            style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
          >
            {t("reports.customers.topCustomers")}
          </Text>
          {customerData.topCustomers
            .slice(0, 5)
            .map((customer: any, index: number) => (
              <View key={customer.customerId} style={styles.listItem}>
                <View style={styles.rank}>
                  <Text
                    style={[styles.rankText, isDark && styles.rankTextDark]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text
                    style={[
                      styles.listItemTitle,
                      isDark && styles.listItemTitleDark,
                    ]}
                  >
                    {customer.customerName}
                  </Text>
                  <Text
                    style={[
                      styles.listItemSubtitle,
                      isDark && styles.listItemSubtitleDark,
                    ]}
                  >
                    {formatCurrency(customer.totalSpent)} •{" "}
                    {customer.totalTransactions} {t("common.transactions")}
                  </Text>
                </View>
              </View>
            ))}
        </View>

        {/* Charts Section */}
        <View style={[styles.chartCard, isDark && styles.chartCardDark]}>
          <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
            {t("reports.customers.customerGrowth")}
          </Text>
          <LineChart
            data={[
              { value: customerData.totalCustomers * 0.6, label: "W1" },
              { value: customerData.totalCustomers * 0.75, label: "W2" },
              { value: customerData.totalCustomers * 0.9, label: "W3" },
              { value: customerData.totalCustomers, label: "W4" },
            ]}
            width={width - 64}
            height={220}
            color="#10B981"
            thickness={3}
            curved
            areaChart
            startFillColor="#10B981"
            startOpacity={0.8}
            endFillColor="#10B981"
            endOpacity={0.3}
            spacing={60}
            initialSpacing={10}
            noOfSections={4}
            yAxisColor={isDark ? "#2C2C2E" : "#E5E7EB"}
            xAxisColor={isDark ? "#2C2C2E" : "#E5E7EB"}
            yAxisTextStyle={{ color: isDark ? "#A9A9A9" : "#6B7280" }}
            xAxisLabelTextStyle={{ color: isDark ? "#A9A9A9" : "#6B7280" }}
          />
        </View>
      </ScrollView>
    </View>
  );

  const renderFinancialContent = (financialData: any) => (
    <View
      style={[
        styles.tabContentWrapper,
        { backgroundColor: isDark ? "#000000" : "#F9F9F9" },
      ]}
    >
      <ScrollView style={styles.tabContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.financial.revenue")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(financialData.revenue)}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.financial.grossProfit")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(financialData.grossProfit)}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.financial.netProfit")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(financialData.netProfit)}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.financial.profitMargin")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {financialData.netProfitMargin.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Charts Section */}
        <View style={[styles.chartCard, isDark && styles.chartCardDark]}>
          <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
            {t("reports.financial.revenueBreakdown")}
          </Text>
          <View style={styles.chartCenter}>
            <PieChart
              data={[
                {
                  value: financialData.revenue,
                  color: "#0A84FF",
                  text: "Revenue",
                },
                {
                  value: financialData.grossProfit,
                  color: "#10B981",
                  text: "Profit",
                },
              ]}
              donut
              radius={90}
              innerRadius={60}
              centerLabelComponent={() => (
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: isDark ? "#fff" : "#000",
                  }}
                >
                  Total
                </Text>
              )}
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#0A84FF" }]}
              />
              <Text
                style={[styles.legendText, isDark && styles.legendTextDark]}
              >
                Revenue
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#10B981" }]}
              />
              <Text
                style={[styles.legendText, isDark && styles.legendTextDark]}
              >
                Profit
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderProductContent = (productData: any) => (
    <View
      style={[
        styles.tabContentWrapper,
        { backgroundColor: isDark ? "#000000" : "#F9F9F9" },
      ]}
    >
      <ScrollView style={styles.tabContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.products.totalProducts")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {productData.totalProducts}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.products.totalRevenue")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(productData.totalRevenue)}
            </Text>
          </View>

          <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
            <Text
              style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}
            >
              {t("reports.products.totalProfit")}
            </Text>
            <Text
              style={[styles.summaryValue, isDark && styles.summaryValueDark]}
            >
              {formatCurrency(productData.totalProfit)}
            </Text>
          </View>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text
            style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
          >
            {t("reports.products.bestSellers")}
          </Text>
          {productData.bestSellers
            .slice(0, 5)
            .map((product: any, index: number) => (
              <View key={product.productId} style={styles.listItem}>
                <View style={styles.rank}>
                  <Text
                    style={[styles.rankText, isDark && styles.rankTextDark]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text
                    style={[
                      styles.listItemTitle,
                      isDark && styles.listItemTitleDark,
                    ]}
                  >
                    {product.productName}
                  </Text>
                  <Text
                    style={[
                      styles.listItemSubtitle,
                      isDark && styles.listItemSubtitleDark,
                    ]}
                  >
                    {formatCurrency(product.revenue)} • {product.unitsSold}{" "}
                    {t("common.units")}
                  </Text>
                </View>
              </View>
            ))}
        </View>

        {/* Charts Section */}
        <View style={[styles.chartCard, isDark && styles.chartCardDark]}>
          <Text style={[styles.chartTitle, isDark && styles.chartTitleDark]}>
            {t("reports.products.topProducts")}
          </Text>
          <BarChart
            data={productData.bestSellers.slice(0, 5).map((product: any) => ({
              value: product.revenue,
              label: product.productName.substring(0, 8),
              frontColor: "#34C759",
            }))}
            width={width - 96}
            height={220}
            barWidth={40}
            spacing={20}
            roundedTop
            roundedBottom
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={{ color: isDark ? "#A9A9A9" : "#6B7280" }}
            xAxisLabelTextStyle={{
              color: isDark ? "#A9A9A9" : "#6B7280",
              fontSize: 10,
            }}
          />
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View
      style={[styles.container, isDark && styles.containerDark]}
      testID="report-detail-screen"
    >
      <StatusBar
        backgroundColor={isDark ? "#1C1C1E" : "#ffffff"}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <View
        style={[
          styles.tabContainer,
          { backgroundColor: isDark ? "#000000" : "#F9F9F9" },
        ]}
      >
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
              marginBottom: 0,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
              textTransform: "none",
            },
            tabBarActiveTintColor: "#34C759",
            tabBarInactiveTintColor: isDark ? "#8E8E93" : "#8E8E93",
            tabBarIndicatorStyle: {
              backgroundColor: "#34C759",
              height: 2,
            },
            tabBarPressColor: isDark ? "#2C2C2E" : "#F3F4F6",
            tabBarPressOpacity: 0.7,
            tabBarScrollEnabled: true,
            tabBarItemStyle: {
              width: "auto",
              minWidth: 80,
            },
          }}
        >
          <Tab.Screen
            name="Today"
            options={{ tabBarLabel: t("reports.periods.today") }}
          >
            {() => <TimeDurationTab period="today" />}
          </Tab.Screen>
          <Tab.Screen
            name="1Day"
            options={{ tabBarLabel: t("reports.periods.1day") }}
          >
            {() => <TimeDurationTab period="1day" />}
          </Tab.Screen>
          <Tab.Screen
            name="1Week"
            options={{ tabBarLabel: t("reports.periods.1week") }}
          >
            {() => <TimeDurationTab period="1week" />}
          </Tab.Screen>
          <Tab.Screen
            name="1Month"
            options={{ tabBarLabel: t("reports.periods.1month") }}
          >
            {() => <TimeDurationTab period="1month" />}
          </Tab.Screen>
          <Tab.Screen
            name="3Month"
            options={{ tabBarLabel: t("reports.periods.3month") }}
          >
            {() => <TimeDurationTab period="3month" />}
          </Tab.Screen>
          <Tab.Screen
            name="1Year"
            options={{ tabBarLabel: t("reports.periods.1year") }}
          >
            {() => <TimeDurationTab period="1year" />}
          </Tab.Screen>
        </Tab.Navigator>

        <View
          style={[
            styles.exportContainer,
            { backgroundColor: isDark ? "#000000" : "#F9F9F9" },
          ]}
        >
          {renderExportButtons()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  tabContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  loadingTextDark: {
    color: "#A9A9A9",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  errorTextDark: {
    color: "#F87171",
  },
  retryButton: {
    backgroundColor: "#0A84FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonDark: {
    backgroundColor: "#0066CC",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButtonTextDark: {
    color: "#fff",
  },
  periodSelector: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  periodScrollContent: {
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButtonDark: {
    backgroundColor: "#1C1C1E",
    shadowOpacity: 0.2,
  },
  periodButtonActive: {
    backgroundColor: "#34C759",
    shadowOpacity: 0.2,
  },
  periodButtonActiveDark: {
    backgroundColor: "#30A46C",
    shadowOpacity: 0.3,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  periodButtonTextDark: {
    color: "#A9A9A9",
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
  },
  tabContentWrapper: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
    backgroundColor: "transparent",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCardDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  summaryLabelDark: {
    color: "#A9A9A9",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  summaryValueDark: {
    color: "#FFFFFF",
  },
  alertValue: {
    color: "#EF4444",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionDark: {
    backgroundColor: "#1C1C1E",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: "#FFFFFF",
  },
  sectionValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0A84FF",
  },
  sectionValueDark: {
    color: "#0A84FF",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0A84FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  rankTextDark: {
    color: "#fff",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  listItemTitleDark: {
    color: "#FFFFFF",
  },
  listItemSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  listItemSubtitleDark: {
    color: "#A9A9A9",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartCardDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
    shadowColor: "#000",
    shadowOpacity: 0.2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    marginTop: 4,
  },
  chartTitleDark: {
    color: "#FFFFFF",
  },
  chartCenter: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    paddingVertical: 8,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  legendTextDark: {
    color: "#A9A9A9",
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailCardDark: {
    backgroundColor: "#1C1C1E",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailLabelDark: {
    color: "#A9A9A9",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  detailValueDark: {
    color: "#FFFFFF",
  },
  exportContainer: {
    padding: 16,
    backgroundColor: "transparent",
  },
  exportButtons: {
    flexDirection: "row",
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#34C759",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exportButtonDark: {
    backgroundColor: "#30A46C",
    shadowOpacity: 0.3,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  exportButtonTextDark: {
    color: "#fff",
  },
});
