import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
// Local copies of shared report types (mirroring backend @sp/types)

interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface SalesReportParams extends DateRangeFilter {
  storeId: string;
  groupBy?: "day" | "week" | "month" | "hour";
  staffId?: string;
  paymentMethod?: string;
}

export interface SalesReportData {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalItemsSold: number;
  salesByPeriod: {
    period: string;
    revenue: number;
    cost: number;
    profit: number;
    transactions: number;
  }[];
  salesByPaymentMethod?: {
    method: string;
    amount: number;
    count: number;
  }[];
  salesByStaff?: {
    staffId: string;
    staffName: string;
    revenue: number;
    transactions: number;
  }[];
}

export interface InventoryReportParams {
  storeId: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  deadStockOnly?: boolean;
}

export interface InventoryReportData {
  totalProducts: number;
  totalVariations: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  deadStockItems: number;
  inventoryTurnoverRate: number;
  items: {
    productId: string;
    productName: string;
    variationName: string;
    barcode: string;
    currentStock: number;
    stockValue: number;
    category: string;
    lastRestocked: string | null;
    daysInStock: number;
    turnoverRate: number;
  }[];
}

export interface CustomerReportParams extends DateRangeFilter {
  storeId: string;
  topN?: number;
}

export interface CustomerReportData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  totalRevenue: number;
  averageLifetimeValue: number;
  topCustomers: {
    customerId: string;
    customerName: string;
    totalSpent: number;
    totalTransactions: number;
    averageOrderValue: number;
    lastPurchaseDate: string;
    rfmScore?: {
      recency: number;
      frequency: number;
      monetary: number;
      segment: string;
    };
  }[];
}

export interface FinancialReportParams extends DateRangeFilter {
  storeId: string;
}

export interface FinancialReportData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashFlow: {
    date: string;
    revenue: number;
    expenses: number;
    net: number;
  }[];
}

export interface ProductPerformanceParams extends DateRangeFilter {
  storeId: string;
  categoryId?: string;
}

export interface ProductPerformanceData {
  topProducts: {
    productId: string;
    productName: string;
    variationName: string;
    totalSold: number;
    totalRevenue: number;
    averageSellingPrice: number;
  }[];
}

export const useSalesReport = (params: SalesReportParams) => {
  return useQuery({
    queryKey: ["reports", "sales", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams(
        params as unknown as Record<string, string>
      ).toString();
      const response = await api.get<{ data: SalesReportData }>(
        `/api/reports/sales?${queryParams}`
      );
      return response.data;
    },
    enabled: !!(params.storeId && params.startDate && params.endDate),
  });
};

export const useInventoryReport = (params: InventoryReportParams) => {
  return useQuery({
    queryKey: ["reports", "inventory", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams(
        params as unknown as Record<string, string>
      ).toString();
      const response = await api.get<{ data: InventoryReportData }>(
        `/api/reports/inventory?${queryParams}`
      );
      return response.data;
    },
    enabled: !!params.storeId,
  });
};

export const useCustomerReport = (params: CustomerReportParams) => {
  return useQuery({
    queryKey: ["reports", "customers", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams(
        params as unknown as Record<string, string>
      ).toString();
      const response = await api.get<{ data: CustomerReportData }>(
        `/api/reports/customers?${queryParams}`
      );
      return response.data;
    },
    enabled: !!(params.storeId && params.startDate && params.endDate),
  });
};

export const useFinancialReport = (params: FinancialReportParams) => {
  return useQuery({
    queryKey: ["reports", "financial", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams(
        params as unknown as Record<string, string>
      ).toString();
      const response = await api.get<{ data: FinancialReportData }>(
        `/api/reports/financial?${queryParams}`
      );
      return response.data;
    },
    enabled: !!(params.storeId && params.startDate && params.endDate),
  });
};

export const useProductPerformance = (params: ProductPerformanceParams) => {
  return useQuery({
    queryKey: ["reports", "products", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams(
        params as unknown as Record<string, string>
      ).toString();
      const response = await api.get<{ data: ProductPerformanceData }>(
        `/api/reports/products?${queryParams}`
      );
      return response.data;
    },
    enabled: !!(params.storeId && params.startDate && params.endDate),
  });
};

export type ReportType =
  | "sales"
  | "inventory"
  | "customers"
  | "financial"
  | "products";
export type ExportFormat = "excel" | "csv";

interface ExportReportParams {
  reportType: ReportType;
  format: ExportFormat;
  queryParams: Record<string, string>;
}

export const useExportReport = () => {
  return useMutation({
    mutationFn: async ({
      reportType,
      format,
      queryParams,
    }: ExportReportParams) => {
      const queryString = new URLSearchParams(queryParams).toString();
      const baseUrl = api.getBaseUrl();
      const token = await api.getAuthToken();

      const url = `${baseUrl}/api/reports/export/${reportType}/${format}?${queryString}`;

      const fileUri = `${
        (FileSystem as unknown as { cacheDirectory: string }).cacheDirectory
      }${reportType}-report-${Date.now()}.${
        format === "excel" ? "xlsx" : "csv"
      }`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadResult.status !== 200) {
        throw new Error("Failed to download report");
      }

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType:
            format === "excel"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "text/csv",
          dialogTitle: `Export ${reportType} report`,
        });
      }

      return downloadResult.uri;
    },
  });
};

// Helper function to get date range for common periods
export const getDateRangeForPeriod = (
  period: "today" | "1day" | "1week" | "1month" | "3month" | "1year"
) => {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "1day":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "1week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "1month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3month":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "1year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};
