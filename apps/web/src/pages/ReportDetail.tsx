import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  BarChart3,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Types matching backend response
interface SellerPerformance {
  sellerId: string;
  sellerName: string;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  totalItemsSold: number;
  transactionCount: number;
}

interface SellerReportResponse {
  sellers: SellerPerformance[];
  summary: {
    totalSellers: number;
    totalRevenue: number;
    totalProfit: number;
    totalTransactions: number;
    avgRevenuePerSeller: number;
  };
}

interface ProductPerformance {
  productVariationId: string;
  productName: string;
  variationName: string;
  barcode: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  avgSellingPrice: number;
  transactionCount: number;
}

interface ProductReportResponse {
  products: ProductPerformance[];
  summary: {
    totalProducts: number;
    totalRevenue: number;
    totalProfit: number;
    totalItemsSold: number;
    avgProfitMargin: number;
  };
}

const PERIODS = ["1M", "3M", "6M", "1Y"] as const;
type Period = (typeof PERIODS)[number];

const PAGE_SIZES = [10, 20, 50, 100] as const;

type SortDirection = "asc" | "desc" | null;

interface SortConfig<T extends string> {
  key: T | null;
  direction: SortDirection;
}

// Chart colors matching the design system's chart palette
// These correspond to --chart-1 and --chart-2 in index.css
const CHART_COLORS = {
  revenue: "#4ade80", // oklch(0.871 0.15 154.449) - bright green
  profit: "#22c55e",  // oklch(0.723 0.219 149.579) - mid green
} as const;

const getPeriodDates = (
  period: Period
): { startDate: string; endDate: string } => {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "1M":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3M":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "6M":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1Y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

// Sortable Table Header Component
function SortableHeader<T extends string>({
  label,
  sortKey,
  sortConfig,
  onSort,
  className,
}: {
  label: string;
  sortKey: T;
  sortConfig: SortConfig<T>;
  onSort: (key: T) => void;
  className?: string;
}) {
  const isActive = sortConfig.key === sortKey;

  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-muted/50", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive ? (
          sortConfig.direction === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  t,
  locale,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  t: TFunction;
  locale: string;
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 mt-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {t("common.showing", "Showing")} {startItem}-{endItem}{" "}
          {t("common.of", "of")} {formatNumber(totalItems, locale)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("common.rowsPerPage", "Rows per page")}:
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-sm">
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || "ru-RU";
  const { userStore } = useAuth();
  const [period, setPeriod] = useState<Period>("1M");

  // Search state with debouncing
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input for performance
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Pagination state
  const [sellerPage, setSellerPage] = useState(1);
  const [sellerPageSize, setSellerPageSize] = useState(20);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(20);

  // Sort state for sellers
  type SellerSortKey =
    | "sellerName"
    | "transactionCount"
    | "totalRevenue"
    | "totalProfit"
    | "totalItemsSold"
    | "avgOrderValue";
  const [sellerSort, setSellerSort] = useState<SortConfig<SellerSortKey>>({
    key: "totalRevenue",
    direction: "desc",
  });

  // Sort state for products
  type ProductSortKey =
    | "productName"
    | "totalQuantitySold"
    | "totalRevenue"
    | "totalProfit"
    | "profitMargin";
  const [productSort, setProductSort] = useState<SortConfig<ProductSortKey>>({
    key: "totalRevenue",
    direction: "desc",
  });

  // Sort handlers
  const handleSellerSort = useCallback((key: SellerSortKey) => {
    setSellerSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
    setSellerPage(1);
  }, []);

  const handleProductSort = useCallback((key: ProductSortKey) => {
    setProductSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
    setProductPage(1);
  }, []);

  const storeId = userStore?.store?.id;
  const storeCurrency = userStore?.store?.currency ?? "UZS";

  const isSellersReport = reportId === "sellers";
  const isProductsReport = reportId === "products";

  const { startDate, endDate } = useMemo(
    () => getPeriodDates(period),
    [period]
  );

  // Fetch sellers report
  const sellersQuery = useQuery({
    queryKey: ["report", "sellers", storeId, startDate, endDate],
    queryFn: async (): Promise<SellerReportResponse> => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      return api.get<SellerReportResponse>(
        `/api/reports/sellers?${params.toString()}`
      );
    },
    enabled: Boolean(storeId) && isSellersReport,
  });

  // Fetch products report
  const productsQuery = useQuery({
    queryKey: ["report", "products", storeId, startDate, endDate],
    queryFn: async (): Promise<ProductReportResponse> => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("sortBy", "revenue");
      return api.get<ProductReportResponse>(
        `/api/reports/products?${params.toString()}`
      );
    },
    enabled: Boolean(storeId) && isProductsReport,
  });

  const isLoading = isSellersReport
    ? sellersQuery.isLoading
    : productsQuery.isLoading;
  const isError = isSellersReport
    ? sellersQuery.isError
    : productsQuery.isError;

  // Get report title and description
  const reportConfig = useMemo(() => {
    if (isSellersReport) {
      return {
        title: t("reports.sellers.title", "Sellers Performance"),
        description: t(
          "reports.sellers.description",
          "Sales performance by staff members"
        ),
        icon: Users,
      };
    }
    if (isProductsReport) {
      return {
        title: t("reports.products.title", "Product Performance"),
        description: t(
          "reports.products.description",
          "Best and slow selling products"
        ),
        icon: Package,
      };
    }
    return {
      title: t("reports.title", "Report"),
      description: "",
      icon: BarChart3,
    };
  }, [isSellersReport, isProductsReport, t]);

  // Process sellers data with search, sort, pagination
  const processedSellers = useMemo(() => {
    if (!sellersQuery.data?.sellers)
      return { items: [], total: 0, totalPages: 0 };

    let filtered = [...sellersQuery.data.sellers];

    // Apply search filter (using debounced value)
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((s) =>
        s.sellerName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sellerSort.key) {
      filtered.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sellerSort.key) {
          case "sellerName":
            aVal = a.sellerName.toLowerCase();
            bVal = b.sellerName.toLowerCase();
            break;
          case "transactionCount":
            aVal = Number(a.transactionCount) || 0;
            bVal = Number(b.transactionCount) || 0;
            break;
          case "totalRevenue":
            aVal = Number(a.totalRevenue) || 0;
            bVal = Number(b.totalRevenue) || 0;
            break;
          case "totalProfit":
            aVal = Number(a.totalProfit) || 0;
            bVal = Number(b.totalProfit) || 0;
            break;
          case "totalItemsSold":
            aVal = Number(a.totalItemsSold) || 0;
            bVal = Number(b.totalItemsSold) || 0;
            break;
          case "avgOrderValue":
            aVal = Number(a.avgOrderValue) || 0;
            bVal = Number(b.avgOrderValue) || 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sellerSort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sellerSort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / sellerPageSize);
    const startIdx = (sellerPage - 1) * sellerPageSize;
    const items = filtered.slice(startIdx, startIdx + sellerPageSize);

    return { items, total, totalPages, startIdx };
  }, [sellersQuery.data, debouncedSearch, sellerSort, sellerPage, sellerPageSize]);

  // Process products data with search, sort, pagination
  const processedProducts = useMemo(() => {
    if (!productsQuery.data?.products)
      return { items: [], total: 0, totalPages: 0 };

    let filtered = [...productsQuery.data.products];

    // Apply search filter (using debounced value)
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(query) ||
          p.variationName?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (productSort.key) {
      filtered.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (productSort.key) {
          case "productName":
            aVal = a.productName.toLowerCase();
            bVal = b.productName.toLowerCase();
            break;
          case "totalQuantitySold":
            aVal = Number(a.totalQuantitySold) || 0;
            bVal = Number(b.totalQuantitySold) || 0;
            break;
          case "totalRevenue":
            aVal = Number(a.totalRevenue) || 0;
            bVal = Number(b.totalRevenue) || 0;
            break;
          case "totalProfit":
            aVal = Number(a.totalProfit) || 0;
            bVal = Number(b.totalProfit) || 0;
            break;
          case "profitMargin":
            aVal = Number(a.profitMargin) || 0;
            bVal = Number(b.profitMargin) || 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return productSort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return productSort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / productPageSize);
    const startIdx = (productPage - 1) * productPageSize;
    const items = filtered.slice(startIdx, startIdx + productPageSize);

    return { items, total, totalPages, startIdx };
  }, [
    productsQuery.data,
    debouncedSearch,
    productSort,
    productPage,
    productPageSize,
  ]);

  // Chart data for sellers (top 10 by revenue)
  const sellerChartData = useMemo(() => {
    if (!sellersQuery.data?.sellers) return [];
    return [...sellersQuery.data.sellers]
      .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
      .slice(0, 10)
      .map((s) => ({
        name:
          s.sellerName.length > 12
            ? s.sellerName.slice(0, 12) + "…"
            : s.sellerName,
        revenue: Number(s.totalRevenue) || 0,
        profit: Number(s.totalProfit) || 0,
      }));
  }, [sellersQuery.data]);

  // Chart data for products (top 10 by revenue)
  const productChartData = useMemo(() => {
    if (!productsQuery.data?.products) return [];
    return [...productsQuery.data.products]
      .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
      .slice(0, 10)
      .map((p) => ({
        name:
          p.productName.length > 12
            ? p.productName.slice(0, 12) + "…"
            : p.productName,
        revenue: Number(p.totalRevenue) || 0,
        profit: Number(p.totalProfit) || 0,
        quantity: Number(p.totalQuantitySold) || 0,
      }));
  }, [productsQuery.data]);

  // Export to CSV
  const handleExport = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM for proper encoding
    let filename = "";

    if (isSellersReport && sellersQuery.data) {
      filename = `sellers-report-${period}.csv`;
      const headers = [
        t("common.name", "Seller"),
        t("reports.sales.transactions", "Transactions"),
        t("home.revenue", "Revenue"),
        t("home.profit", "Profit"),
        t("reports.products.itemsSold", "Items Sold"),
        t("reports.sales.avgOrderValue", "Avg Order"),
      ].join(",");
      csvContent += headers + "\n";
      sellersQuery.data.sellers.forEach((s) => {
        csvContent += `"${s.sellerName}",${s.transactionCount},${s.totalRevenue},${s.totalProfit},${s.totalItemsSold},${s.avgOrderValue}\n`;
      });
    } else if (isProductsReport && productsQuery.data) {
      filename = `products-report-${period}.csv`;
      const headers = [
        t("common.product", "Product"),
        t("inventory.variation.name", "Variation"),
        t("inventory.table.barcode", "Barcode"),
        t("common.quantity", "Quantity"),
        t("home.revenue", "Revenue"),
        t("home.profit", "Profit"),
        t("reports.sales.profitMargin", "Margin %"),
      ].join(",");
      csvContent += headers + "\n";
      productsQuery.data.products.forEach((p) => {
        csvContent += `"${p.productName}","${p.variationName}","${p.barcode}",${p.totalQuantitySold
          },${p.totalRevenue},${p.totalProfit},${p.profitMargin.toFixed(1)}\n`;
      });
    }

    if (csvContent.length > 1) {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
  };

  if (!storeId) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-screen-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">
          {t("reports.noStoreTitle", "No store available")}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.subtitle", "Please set up your store first.")}
        </p>
      </div>
    );
  }

  if (!isSellersReport && !isProductsReport) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-screen-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">
          {t("common.notFound", "Report not found")}
        </h1>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back", "Go back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-screen-xl flex-col gap-6 px-6 py-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <reportConfig.icon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold">{reportConfig.title}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {reportConfig.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(val) => val && setPeriod(val as Period)}
            className="hidden sm:flex"
          >
            {PERIODS.map((p) => (
              <ToggleGroupItem
                key={p}
                value={p}
                className="px-3 text-xs font-medium"
              >
                {t(`reports.periods.${p.toLowerCase()}`, p)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            {t("reports.actions.export", "Export")}
          </Button>
        </div>
      </header>

      {/* Mobile Period Selector */}
      <div className="sm:hidden">
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(val) => val && setPeriod(val as Period)}
          className="flex w-full"
        >
          {PERIODS.map((p) => (
            <ToggleGroupItem
              key={p}
              value={p}
              className="flex-1 px-2 text-xs font-medium"
            >
              {t(`reports.periods.${p.toLowerCase()}`, p)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
          <Skeleton className="col-span-full h-80 rounded-xl" />
          <Skeleton className="col-span-full h-96 rounded-xl" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">
              {t("reports.error", "Failed to load report")}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                isSellersReport
                  ? sellersQuery.refetch()
                  : productsQuery.refetch()
              }
            >
              {t("common.tryAgain", "Try again")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sellers Report Content */}
      {isSellersReport && sellersQuery.data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title={t("reports.sellers.totalSellers", "Total Sellers")}
              value={formatNumber(sellersQuery.data.summary.totalSellers)}
              icon={Users}
            />
            <SummaryCard
              title={t("reports.sales.totalRevenue", "Total Revenue")}
              value={formatCurrency(
                sellersQuery.data.summary.totalRevenue,
                storeCurrency
              )}
              icon={DollarSign}
            />
            <SummaryCard
              title={t("reports.sales.grossProfit", "Total Profit")}
              value={formatCurrency(
                sellersQuery.data.summary.totalProfit,
                storeCurrency
              )}
              icon={TrendingUp}
            />
            <SummaryCard
              title={t("reports.sales.transactions", "Transactions")}
              value={formatNumber(sellersQuery.data.summary.totalTransactions)}
              icon={ShoppingCart}
            />
          </div>

          {/* Chart */}
          {sellerChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("reports.sellers.revenueByStaff", "Revenue by Staff")}
                </CardTitle>
                <CardDescription>
                  {t("reports.sellers.top10", "Top 10 sellers by revenue")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] min-h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sellerChartData}
                      layout="vertical"
                      margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        className="stroke-muted"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v) =>
                          formatCurrency(v, storeCurrency, locale)
                        }
                        className="text-xs"
                        tick={{ fill: "currentColor" }}
                        axisLine={{ stroke: "currentColor", opacity: 0.3 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        className="text-xs"
                        tick={{ fill: "currentColor" }}
                        axisLine={{ stroke: "currentColor", opacity: 0.3 }}
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          formatCurrency(value, storeCurrency, locale)
                        }
                        labelFormatter={(label) => label}
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: "var(--popover-foreground)",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "16px" }}
                        iconType="circle"
                        iconSize={10}
                      />
                      <Bar
                        dataKey="revenue"
                        name={t("home.revenue", "Revenue")}
                        radius={[0, 4, 4, 0]}
                        fill={CHART_COLORS.revenue}
                      />
                      <Bar
                        dataKey="profit"
                        name={t("home.profit", "Profit")}
                        radius={[0, 4, 4, 0]}
                        fill={CHART_COLORS.profit}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>{t("reports.tabs.details", "Details")}</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("common.search", "Search...")}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSellerPage(1);
                    }}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {processedSellers.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    {searchQuery
                      ? t("common.noSearchResults", "No results found")
                      : t("common.noData", "No data available")}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHeader
                            label={t("common.name", "Name")}
                            sortKey="sellerName"
                            sortConfig={sellerSort}
                            onSort={handleSellerSort}
                          />
                          <SortableHeader
                            label={t(
                              "reports.sales.transactions",
                              "Transactions"
                            )}
                            sortKey="transactionCount"
                            sortConfig={sellerSort}
                            onSort={handleSellerSort}
                            className="text-right"
                          />
                          <SortableHeader
                            label={t("home.revenue", "Revenue")}
                            sortKey="totalRevenue"
                            sortConfig={sellerSort}
                            onSort={handleSellerSort}
                            className="text-right"
                          />
                          <SortableHeader
                            label={t("home.profit", "Profit")}
                            sortKey="totalProfit"
                            sortConfig={sellerSort}
                            onSort={handleSellerSort}
                            className="text-right"
                          />
                          <SortableHeader
                            label={t(
                              "reports.products.itemsSold",
                              "Items Sold"
                            )}
                            sortKey="totalItemsSold"
                            sortConfig={sellerSort}
                            onSort={handleSellerSort}
                            className="text-right"
                          />
                          <SortableHeader
                            label={t(
                              "reports.sales.avgOrderValue",
                              "Avg Order"
                            )}
                            sortKey="avgOrderValue"
                            sortConfig={sellerSort}
                            onSort={handleSellerSort}
                            className="text-right"
                          />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedSellers.items.map((seller, idx) => (
                          <TableRow key={seller.sellerId}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="h-6 w-6 justify-center p-0 text-xs"
                                >
                                  {(processedSellers.startIdx ?? 0) + idx + 1}
                                </Badge>
                                {seller.sellerName}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(seller.transactionCount, locale)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                seller.totalRevenue,
                                storeCurrency,
                                locale
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                seller.totalProfit,
                                storeCurrency,
                                locale
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(seller.totalItemsSold, locale)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                seller.avgOrderValue,
                                storeCurrency,
                                locale
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination
                    currentPage={sellerPage}
                    totalPages={processedSellers.totalPages}
                    totalItems={processedSellers.total}
                    pageSize={sellerPageSize}
                    onPageChange={setSellerPage}
                    onPageSizeChange={(size) => {
                      setSellerPageSize(size);
                      setSellerPage(1);
                    }}
                    t={t}
                    locale={locale}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Products Report Content */}
      {isProductsReport && productsQuery.data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title={t("reports.products.totalProducts", "Total Products")}
              value={formatNumber(productsQuery.data.summary.totalProducts)}
              icon={Package}
            />
            <SummaryCard
              title={t("reports.products.totalRevenue", "Total Revenue")}
              value={formatCurrency(
                productsQuery.data.summary.totalRevenue,
                storeCurrency
              )}
              icon={DollarSign}
            />
            <SummaryCard
              title={t("reports.products.totalProfit", "Total Profit")}
              value={formatCurrency(
                productsQuery.data.summary.totalProfit,
                storeCurrency
              )}
              icon={TrendingUp}
            />
            <SummaryCard
              title={t("reports.sales.profitMargin", "Avg Margin")}
              value={`${productsQuery.data.summary.avgProfitMargin.toFixed(
                1
              )}%`}
              icon={Percent}
            />
          </div>

          {/* Chart */}
          {productChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("reports.products.topProducts", "Top Products")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "reports.products.top10ByRevenue",
                    "Top 10 products by revenue"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] min-h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productChartData}
                      layout="vertical"
                      margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        className="stroke-muted"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v) =>
                          formatCurrency(v, storeCurrency, locale)
                        }
                        className="text-xs"
                        tick={{ fill: "currentColor" }}
                        axisLine={{ stroke: "currentColor", opacity: 0.3 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        className="text-xs"
                        tick={{ fill: "currentColor" }}
                        axisLine={{ stroke: "currentColor", opacity: 0.3 }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === "quantity") {
                            return formatNumber(value, locale);
                          }
                          return formatCurrency(value, storeCurrency, locale);
                        }}
                        labelFormatter={(label) => label}
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: "var(--popover-foreground)",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "16px" }}
                        iconType="circle"
                        iconSize={10}
                      />
                      <Bar
                        dataKey="revenue"
                        name={t("home.revenue", "Revenue")}
                        radius={[0, 4, 4, 0]}
                        fill={CHART_COLORS.revenue}
                      />
                      <Bar
                        dataKey="profit"
                        name={t("home.profit", "Profit")}
                        radius={[0, 4, 4, 0]}
                        fill={CHART_COLORS.profit}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>{t("reports.tabs.details", "Details")}</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("common.search", "Search...")}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setProductPage(1);
                    }}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {processedProducts.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    {searchQuery
                      ? t("common.noSearchResults", "No results found")
                      : t("common.noData", "No data available")}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHeader
                            label={t("common.product", "Product")}
                            sortKey="productName"
                            sortConfig={productSort}
                            onSort={handleProductSort}
                          />
                          <TableHead>
                            {t("inventory.variation.name", "Variation")}
                          </TableHead>
                          <SortableHeader
                            label={t("common.quantity", "Qty Sold")}
                            sortKey="totalQuantitySold"
                            sortConfig={productSort}
                            onSort={handleProductSort}
                            className="text-right"
                          />
                          <SortableHeader
                            label={t("home.revenue", "Revenue")}
                            sortKey="totalRevenue"
                            sortConfig={productSort}
                            onSort={handleProductSort}
                            className="text-right"
                          />
                          <SortableHeader
                            label={t("home.profit", "Profit")}
                            sortKey="totalProfit"
                            sortConfig={productSort}
                            onSort={handleProductSort}
                            className="text-right"
                          />
                          <SortableHeader
                            label={t("reports.sales.profitMargin", "Margin")}
                            sortKey="profitMargin"
                            sortConfig={productSort}
                            onSort={handleProductSort}
                            className="text-right"
                          />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedProducts.items.map((product, idx) => (
                          <TableRow key={product.productVariationId}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="h-6 w-6 justify-center p-0 text-xs"
                                >
                                  {(processedProducts.startIdx ?? 0) + idx + 1}
                                </Badge>
                                {product.productName}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {product.variationName}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(product.totalQuantitySold, locale)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                product.totalRevenue,
                                storeCurrency,
                                locale
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                product.totalProfit,
                                storeCurrency,
                                locale
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-medium",
                                  product.profitMargin >= 30 && "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
                                  product.profitMargin >= 15 && product.profitMargin < 30 && "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                                  product.profitMargin < 15 && "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
                                )}
                              >
                                {product.profitMargin.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination
                    currentPage={productPage}
                    totalPages={processedProducts.totalPages}
                    totalItems={processedProducts.total}
                    pageSize={productPageSize}
                    onPageChange={setProductPage}
                    onPageSizeChange={(size) => {
                      setProductPageSize(size);
                      setProductPage(1);
                    }}
                    t={t}
                    locale={locale}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
