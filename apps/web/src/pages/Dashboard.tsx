import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  PackageSearch,
  RotateCcw,
  CreditCard,
  Wallet,
  Settings2,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Undo2,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { LowStockBanner } from "@/components/LowStockBanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { formatCurrency, formatNumber } from "@/lib/format";
import { api } from "@/lib/api";

// AG Charts components
import { RevenueChart, ProductsChart, TransactionTypesChart } from "@/components/charts";

// Default to last 30 days
const getDefaultDateRange = (): DateRange => ({
  from: subDays(new Date(), 29),
  to: new Date(),
});

// Transaction type configuration with colors and icons
// Using hex colors directly to avoid Tailwind class purging issues
const TRANSACTION_TYPE_CONFIG: Record<string, {
  iconColor: string;
  bgColor: string;
  icon: React.ElementType;
  labelKey: string;
}> = {
  import: {
    iconColor: "#10b981", // emerald-500
    bgColor: "rgba(16, 185, 129, 0.15)",
    icon: ArrowDownToLine,
    labelKey: "txType.import",
  },
  export: {
    iconColor: "#3b82f6", // blue-500
    bgColor: "rgba(59, 130, 246, 0.15)",
    icon: ArrowUpFromLine,
    labelKey: "txType.export",
  },
  return: {
    iconColor: "#f43f5e", // rose-500
    bgColor: "rgba(244, 63, 94, 0.15)",
    icon: RotateCcw,
    labelKey: "txType.return",
  },
  debt: {
    iconColor: "#f59e0b", // amber-500
    bgColor: "rgba(245, 158, 11, 0.15)",
    icon: CreditCard,
    labelKey: "txType.debt",
  },
  repayment: {
    iconColor: "#22c55e", // green-500
    bgColor: "rgba(34, 197, 94, 0.15)",
    icon: Wallet,
    labelKey: "txType.repayment",
  },
  adjustment: {
    iconColor: "#a855f7", // purple-500
    bgColor: "rgba(168, 85, 247, 0.15)",
    icon: Settings2,
    labelKey: "txType.adjustment",
  },
  transfer_in: {
    iconColor: "#06b6d4", // cyan-500
    bgColor: "rgba(6, 182, 212, 0.15)",
    icon: ArrowDownLeft,
    labelKey: "txType.transfer_in",
  },
  transfer_out: {
    iconColor: "#14b8a6", // teal-500
    bgColor: "rgba(20, 184, 166, 0.15)",
    icon: ArrowUpRight,
    labelKey: "txType.transfer_out",
  },
  internal_use: {
    iconColor: "#f97316", // orange-500
    bgColor: "rgba(249, 115, 22, 0.15)",
    icon: Package,
    labelKey: "txType.internal_use",
  },
  supplier_return: {
    iconColor: "#ef4444", // red-500
    bgColor: "rgba(239, 68, 68, 0.15)",
    icon: Undo2,
    labelKey: "txType.supplier_return",
  },
  exchange: {
    iconColor: "#8b5cf6", // violet-500
    bgColor: "rgba(139, 92, 246, 0.15)",
    icon: RefreshCw,
    labelKey: "txType.exchange",
  },
};

// All data comes from backend - no frontend calculations
interface DashboardStats {
  // Main stat cards
  totalIn: number;
  totalOut: number;
  profit: number;
  supplierCost: number;
  totalReturn: number;

  // Detailed stats
  transactionCount: number;
  totalItemsSold: number;
  avgOrderValue: number;
  profitMargin: number;

  // Breakdown by transaction type
  byType: Record<string, { amount: number; count: number; quantity: number }>;

  // Transfer store information for legends
  transferStores: Record<string, { sourceStore?: string; targetStore?: string }>;

  // Chart data
  dailyBreakdown: { date: string; revenue: number; purchases: number; cogs: number }[];
  dailyByType: { date: string;[key: string]: string | number }[];
  topProductsByRevenue: { name: string; revenue: number }[];
  topProductsByQuantity: { name: string; quantity: number }[];
}

const emptyStats: DashboardStats = {
  totalIn: 0,
  totalOut: 0,
  profit: 0,
  supplierCost: 0,
  totalReturn: 0,
  transactionCount: 0,
  totalItemsSold: 0,
  avgOrderValue: 0,
  profitMargin: 0,
  byType: {},
  transferStores: {},
  dailyBreakdown: [], // Type is inferred as { date: string; revenue: number; purchases: number; cogs: number }[]
  dailyByType: [],
  topProductsByRevenue: [],
  topProductsByQuantity: [],
};



export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user, userStore, getStore } = useAuth();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultDateRange());

  const storeQuery = useQuery({
    queryKey: ["store"],
    queryFn: async () => {
      const store = await getStore();
      return store;
    },
    initialData: userStore ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  // Keep react-query cache in sync when AuthStore updates userStore.
  useEffect(() => {
    queryClient.setQueryData(["store"], userStore ?? null);
  }, [queryClient, userStore]);

  const storeId = storeQuery.data?.store?.id;

  // Compute ISO date strings from the selected date range
  const queryDateRange = useMemo(() => {
    const defaultRange = getDefaultDateRange();
    const from = dateRange?.from ?? defaultRange.from;
    const to = dateRange?.to ?? defaultRange.to;
    return {
      startDate: from!.toISOString(),
      endDate: to!.toISOString(),
    };
  }, [dateRange]);

  // Single query for ALL dashboard data - no frontend calculations
  const dashboardStatsQuery = useQuery({
    queryKey: ["dashboard-stats", storeId, queryDateRange.startDate, queryDateRange.endDate],
    queryFn: async (): Promise<DashboardStats> => {
      if (!storeId) return emptyStats;
      const params = new URLSearchParams({
        startDate: queryDateRange.startDate,
        endDate: queryDateRange.endDate,
      });
      return await api.get<DashboardStats>(
        `/api/transactions/stats?${params.toString()}`
      );
    },
    enabled: Boolean(storeId),
    refetchInterval: 1000 * 30,
  });

  const lowStockQuery = useQuery({
    queryKey: ["low-stock", storeId],
    queryFn: async (): Promise<unknown[]> => {
      if (!storeId) return [];
      try {
        const response = await api.get<{ lowStockItems: unknown[] }>(
          `/api/inventory/low-stock?storeId=${encodeURIComponent(storeId)}`
        );
        return response.lowStockItems ?? [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(storeId),
    staleTime: 1000 * 60,
  });

  // All stats come directly from backend
  const stats = dashboardStatsQuery.data ?? emptyStats;

  // Chart data comes directly from backend
  const revenueSeries = useMemo(() => {
    return (stats.dailyBreakdown || []).map((d) => ({
      date: new Date(d.date).toLocaleDateString(i18n.language, {
        day: "numeric",
        month: "short",
      }),
      revenue: d.revenue,
      purchases: d.purchases,
      cogs: d.cogs,
    }));
  }, [stats.dailyBreakdown, i18n.language]);

  // Transaction types chart data (colorful bars for each type)
  const transactionTypeSeries = useMemo(() => {
    return (stats.dailyByType || []).map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString(i18n.language, {
        day: "numeric",
        month: "short",
      }),
    }));
  }, [stats.dailyByType, i18n.language]);

  // All transaction types from the enum - always show all in the chart
  const ALL_TRANSACTION_TYPES = [
    "import",
    "export",
    "return",
    "adjustment",
    "debt",
    "repayment",
    "exchange",
    "internal_use",
    "transfer_in",
    "transfer_out",
    "supplier_return",
  ];

  // Use all transaction types for the chart (not just ones with data)
  const activeTransactionTypes = ALL_TRANSACTION_TYPES;

  // Product chart data from backend
  const productSeries = stats.topProductsByRevenue || [];

  // Detailed stats come directly from backend
  const detailedStats = {
    totalSales: stats.totalOut,
    grossProfit: stats.profit,
    profitMargin: stats.profitMargin,
    totalTransactions: stats.transactionCount,
    avgOrderValue: stats.avgOrderValue,
    totalItemsSold: stats.totalItemsSold,
    topProductsByQuantity: stats.topProductsByQuantity || [],
  };

  const profitMarginDisplay = formatNumber(detailedStats.profitMargin);

  const lowStockCount = lowStockQuery.data?.length ?? 0;
  const loadingState =
    storeQuery.isLoading ||
    dashboardStatsQuery.isLoading ||
    storeQuery.isFetching;
  const storeCurrency = storeQuery.data?.store?.currency ?? undefined;

  if (!loadingState && storeQuery.data === null) {
    return (
      <div className="mx-auto flex min-h-screen max-w-screen-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("dashboard.noStoreLinked")}
        </h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        <Button onClick={() => void storeQuery.refetch()} className="mt-2">
          {t("dashboard.refreshStore")}
        </Button>
      </div>
    );
  }

  const displayName =
    user?.name ?? t("dashboard.headlineFallback", { defaultValue: "merchant" });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-screen-xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">
          {t("dashboard.headline", { name: displayName })}
        </h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </header>

      <LowStockBanner count={lowStockCount} />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={t("home.in")}
          value={stats.totalIn}
          currency={storeCurrency}
          trend="up"
          loading={loadingState}
        />
        <StatCard
          title={t("home.out")}
          value={stats.totalOut}
          currency={storeCurrency}
          trend="down"
          loading={loadingState}
        />
        <StatCard
          title={t("home.profit")}
          value={stats.profit}
          currency={storeCurrency}
          icon="profit"
          loading={loadingState}
        />
        <StatCard
          title={t("home.supplierCost")}
          value={stats.supplierCost}
          currency={storeCurrency}
          icon="supplier"
          loading={loadingState}
        />
      </section>

      {/* Transaction Types Breakdown */}
      {Object.keys(stats.byType).length > 0 && (
        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>{t("home.transactionBreakdown", { defaultValue: "Transaction Breakdown" })}</CardTitle>
            <CardDescription>{t("home.allTransactionTypes", { defaultValue: "Overview of all transaction types in the selected period" })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Object.entries(stats.byType).map(([type, data]) => {
                const config = TRANSACTION_TYPE_CONFIG[type];
                if (!config) return null;
                const Icon = config.icon;

                // Get display name for transaction type with transfer legends
                const getDisplayName = () => {
                  if (type === "transfer_out" && stats.transferStores.transfer_out?.targetStore) {
                    return t("home.transferOut", {
                      store: stats.transferStores.transfer_out.targetStore,
                      defaultValue: `Transfer Out → ${stats.transferStores.transfer_out.targetStore}`
                    });
                  } else if (type === "transfer_in" && stats.transferStores.transfer_in?.sourceStore) {
                    return t("home.transferIn", {
                      store: stats.transferStores.transfer_in.sourceStore,
                      defaultValue: `Transfer In ← ${stats.transferStores.transfer_in.sourceStore}`
                    });
                  } else {
                    return t(config.labelKey, { defaultValue: type.replace("_", " ") });
                  }
                };

                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span
                      className="flex size-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: config.bgColor, color: config.iconColor }}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {getDisplayName()}
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(data.amount, storeCurrency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.count} {t("home.transactions", { defaultValue: "txn" })} · {data.quantity} {t("home.items", { defaultValue: "items" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart - Full Width */}
      <Card className="border shadow-none">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t("home.revenueChart", { defaultValue: "Revenue Overview" })}</CardTitle>
            <CardDescription>{t("home.dailyBreakdown", { defaultValue: "Daily incoming, outgoing and delivery costs" })}</CardDescription>
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            align="end"
          />
        </CardHeader>
        <CardContent>


          {loadingState ? (
            <Skeleton className="h-[320px] w-full rounded-lg" />
          ) : revenueSeries.length === 0 ? (
            <EmptyState
              title={t("home.noSalesInPeriod", { defaultValue: "No sales in this period" })}
              description={t("home.noRevenueData", { defaultValue: "Try adjusting the period to see more activity." })}
            />
          ) : (
            <RevenueChart
              data={revenueSeries}
              title=""
              subtitle=""
              currency={storeCurrency ?? "UZS"}
            />
          )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none text-foreground">
            {t("home.profitMargin", { defaultValue: "Profit margin" })}:{" "}
            {profitMarginDisplay}%
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            {t("home.revenueSummaryHint", { defaultValue: "Based on transactions in the selected period." })}
          </div>
        </CardFooter>
      </Card>

      {/* Transaction Types & Top Products - Side by Side */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Transaction Types Chart */}
        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>{t("home.transactionTypes", { defaultValue: "Transaction Types" })}</CardTitle>
            <CardDescription>{t("home.allTransactionTypes", { defaultValue: "Daily amounts by transaction type" })}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingState ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : transactionTypeSeries.length === 0 ? (
              <EmptyState
                title={t("home.noTransactionsInPeriod", { defaultValue: "No transactions in this period" })}
                description={t("home.noTransactionData", { defaultValue: "Try adjusting the period to see more activity." })}
              />
            ) : (
              <TransactionTypesChart
                data={transactionTypeSeries}
                activeTypes={activeTransactionTypes}
                title=""
                subtitle=""
                currency={storeCurrency ?? "UZS"}
              />
            )}
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>{t("home.topProductsChart", { defaultValue: "Top Products" })}</CardTitle>
            <CardDescription>{t("home.byRevenue", { defaultValue: "Sorted by revenue" })}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingState ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : productSeries.length === 0 ? (
              <EmptyState
                title={t("home.noSalesInPeriod", { defaultValue: "No sales in this period" })}
                description={t("home.noProductData", { defaultValue: "We will display product performance here." })}
              />
            ) : (
              <ProductsChart
                data={productSeries}
                title=""
                subtitle=""
                currency={storeCurrency ?? "UZS"}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>{t("home.profitAnalysis")}</CardTitle>
            <CardDescription>{t("home.detailedAnalytics")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailStat
                label={t("home.revenue", { defaultValue: "Revenue" })}
                value={formatCurrency(stats.totalOut, storeCurrency)}
              />
              <DetailStat
                label={t("home.avgOrderValue", {
                  defaultValue: "Average order value",
                })}
                value={formatCurrency(
                  detailedStats.avgOrderValue,
                  storeCurrency
                )}
              />
              <DetailStat
                label={t("home.totalTransactions", {
                  defaultValue: "Total transactions",
                })}
                value={formatNumber(detailedStats.totalTransactions)}
              />
              <DetailStat
                label={t("home.totalItemsSold", {
                  defaultValue: "Total items sold",
                })}
                value={formatNumber(detailedStats.totalItemsSold)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader>
            <CardTitle>{t("home.topSellingByQuantity")}</CardTitle>
            <CardDescription>{t("home.top5Products")}</CardDescription>
          </CardHeader>
          <CardContent>
            {detailedStats.topProductsByQuantity.length === 0 ? (
              <EmptyState
                title={t("home.noSalesInPeriod")}
                description={t("home.noProductData")}
              />
            ) : (
              <ul className="space-y-3">
                {detailedStats.topProductsByQuantity.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNumber(item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const StatCard = ({
  title,
  value,
  currency,
  loading,
  trend,
  icon,
}: {
  title: string;
  value: number;
  currency?: string | null;
  loading: boolean;
  trend?: "up" | "down";
  icon?: "profit" | "supplier";
}) => {
  if (loading) {
    return <Skeleton className="h-[140px] w-full rounded-xl" />;
  }

  let indicator: React.ReactNode = null;

  if (trend === "up") {
    indicator = (
      <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
        <ArrowUpFromLine className="size-4" />
      </span>
    );
  } else if (trend === "down") {
    indicator = (
      <span className="flex size-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
        <ArrowDownToLine className="size-4" />
      </span>
    );
  } else if (icon === "profit") {
    indicator = (
      <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
        <TrendingUp className="size-4" />
      </span>
    );
  } else if (icon === "supplier") {
    indicator = (
      <span className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200">
        <PackageSearch className="size-4" />
      </span>
    );
  }

  return (
    <Card className="border shadow-none">
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {indicator}
        </div>
        <p className="text-2xl font-semibold text-foreground">
          {formatCurrency(value, currency ?? "UZS")}
        </p>
      </CardContent>
    </Card>
  );
};

const DetailStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-card px-4 py-3">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
  </div>
);

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
    <span className="text-base font-semibold text-foreground">{title}</span>
    {description ? <p>{description}</p> : null}
  </div>
);
