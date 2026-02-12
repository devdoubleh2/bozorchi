import { useCallback, useMemo, useRef, useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  Package,
  Search,
  Tag,
  User,
  RotateCcw,
  Undo2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Repeat2,
  ArrowRightLeft,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type ReceiptData, type PaymentMethod } from "@/context/POSStore";
import { toast } from 'sonner'
import { api } from "@/lib/api";
import { parseApiError, cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { startOfDay, endOfDay, format } from "date-fns";
import { Label } from "@/components/ui/label";
import { useTransactionMutations } from "@/hooks/useTransactionMutations";


type TransactionType =
  | "import"
  | "export"
  | "return"
  | "debt"
  | "repayment"
  | "exchange"
  | "adjustment"
  | "transfer_in"
  | "transfer_out"
  | "internal_use"
  | "supplier_return";


const normalizeImageUrl = (url?: string | null) => {
  if (!url) return null;

  try {
    const parsed = new URL(
      url,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost"
    );

    if (parsed.hostname === "minio.bozorchi.store") {
      parsed.protocol = "https:";
      parsed.port = "";
    }

    if (
      parsed.protocol === "http:" &&
      typeof window !== "undefined" &&
      window.location.protocol === "https:"
    ) {
      parsed.protocol = "https:";
    }

    return parsed.toString();
  } catch {
    if (url.startsWith("/")) {
      const base =
        import.meta.env.VITE_STORAGE_URL ?? import.meta.env.VITE_API_URL ?? "";
      return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
    }

    return url;
  }
};

const isSaleTransaction = (type?: TransactionType | string | null) =>
  type === "export" || type === "debt";

interface TransactionWithDetails {
  id: string;
  group_id?: string | null;
  transaction_type: TransactionType;
  total_amount: number;
  quantity: number;
  delivery_cost: number;
  unit_price: number;
  selling_price: number;
  transaction_date: string;
  product_name: string;
  product_variation_id?: string;
  variation_name?: string;
  barcode?: string | null;
  sku?: string | null;
  product_image_url?: string | null;
  variation_image_url?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  remarks?: string | null;
  unit_name?: string | null;
  payments?: {
    id: string;
    amount: number;
    payment_method: PaymentMethod;
    received_at: string;
  }[];
  items?: TransactionWithDetails[]; // For grouped transactions
  returns?: TransactionWithDetails[]; // Linked repayments
  // FISCALIZATION DISABLED
  // fiscal_status?: string | null;
  // fiscal_receipt_id?: string | null;
  // fiscal_qr_url?: string | null;
  // fiscal_receipt_number?: string | null;
}

type TransactionsResponse = {
  transactions: TransactionWithDetails[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type TransactionSummary = {
  totalTransactions: number;
  totalRevenue: number;
  totalImportAmount: number;
  totalImportQuantity: number;
  totalExportAmount: number;
  totalExportQuantity: number;
  totalReturnAmount: number;
  totalReturnQuantity: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  profit_margin: number;
};

const TYPE_META: Record<
  TransactionType,
  {
    icon: React.ElementType;
    tone: string;
    labelKey: string;
    badgeClassName: string;
    defaultValue: string;
  }
> = {
  import: {
    icon: ArrowDownLeft,
    tone: "text-emerald-600",
    labelKey: "transactions.types.import",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20",
    defaultValue: "Import",
  },
  export: {
    icon: ArrowUpRight,
    tone: "text-rose-600",
    labelKey: "transactions.types.export",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/20",
    defaultValue: "Export",
  },
  return: {
    icon: Undo2,
    tone: "text-amber-600",
    labelKey: "transactions.types.return",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20",
    defaultValue: "Return",
  },
  debt: {
    icon: ArrowUpRight,
    tone: "text-violet-600",
    labelKey: "transactions.types.debt",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/20",
    defaultValue: "Debt",
  },
  repayment: {
    icon: RotateCcw,
    tone: "text-blue-600",
    labelKey: "transactions.types.repayment",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20",
    defaultValue: "Repayment",
  },
  exchange: {
    icon: Repeat2,
    tone: "text-cyan-600",
    labelKey: "transactions.types.exchange",
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/20",
    defaultValue: "Exchange",
  },
  adjustment: {
    icon: Zap,
    tone: "text-orange-600",
    labelKey: "transactions.types.adjustment",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/20",
    defaultValue: "Adjustment",
  },
  transfer_in: {
    icon: ArrowRightLeft,
    tone: "text-teal-600",
    labelKey: "transactions.types.transfer_in",
    badgeClassName: "border-teal-200 bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/20",
    defaultValue: "Transfer In",
  },
  transfer_out: {
    icon: ArrowRightLeft,
    tone: "text-indigo-600",
    labelKey: "transactions.types.transfer_out",
    badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/20",
    defaultValue: "Transfer Out",
  },
  internal_use: {
    icon: Zap,
    tone: "text-slate-600",
    labelKey: "transactions.types.internal_use",
    badgeClassName: "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/20",
    defaultValue: "Internal Use",
  },
  supplier_return: {
    icon: TrendingUp,
    tone: "text-green-600",
    labelKey: "transactions.types.supplier_return",
    badgeClassName: "border-green-200 bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/20",
    defaultValue: "Supplier Return",
  },
};

const formatDateTime = (isoDate: string, locale: string) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) => (
  <Card className="border shadow-none">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;







export default function TransactionsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || "ru-RU";
  const { user, userStore, getStore } = useAuth();

  const {
    createTransaction,
    deleteTransaction,
    returnTransaction: returnMutation,
    exchangeTransaction: exchangeMutation,
    repaymentTransaction: repaymentMutation
  } = useTransactionMutations();

  // FISCALIZATION DISABLED - Fiscal mutations commented out
  // const fiscalizeMutation = useMutation({
  //   mutationFn: async (data: { groupId: string, storeId: string }) => {
  //     return api.post("/api/fiscal/receipt/fiscalize", data);
  //   },
  //   onSuccess: () => {
  //     toast.success(t("transactions.fiscalizeSuccess", { defaultValue: "Sent to tax service" }));
  //     transactionsQuery.refetch();
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.message || "Fiscalization failed");
  //   }
  // });



  // Search and filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateTo, setDateTo] = useState<Date | undefined>(() => new Date());
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<{
    pageIndex: number;
    pageSize: number;
  }>({
    pageIndex: 0,
    pageSize: PAGE_SIZE_OPTIONS[0],
  });

  // Modal state
  const [detailTransaction, setDetailTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [returnTransaction, setReturnTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<string>("");
  const [isReturning, setIsReturning] = useState(false);
  const [returnReceiptOpen, setReturnReceiptOpen] = useState(false);
  const [lastReturnReceipt, setLastReturnReceipt] =
    useState<ReceiptData | null>(null);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  // Exchange dialog
  const [exchangeTransaction, setExchangeTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [exchangeNewProductId, setExchangeNewProductId] = useState<string>("");
  const [exchangeReturnQuantity, setExchangeReturnQuantity] =
    useState<string>("");
  const [exchangeNewQuantity, setExchangeNewQuantity] = useState<string>("");
  const [isExchanging, setIsExchanging] = useState(false);

  // Repayment dialog
  const [repaymentTransaction, setRepaymentTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState<string>("");
  const [isRepaying, setIsRepaying] = useState(false);

  // Adjustment dialog
  const [adjustmentTransaction, setAdjustmentTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>("");
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Transfer dialog
  const [transferTransaction, setTransferTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [transferType, setTransferType] = useState<
    "transfer_in" | "transfer_out"
  >("transfer_out");
  const [transferQuantity, setTransferQuantity] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Internal use dialog
  const [internalUseTransaction, setInternalUseTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [internalUseQuantity, setInternalUseQuantity] = useState<string>("");
  const [internalUseReason, setInternalUseReason] = useState<string>("");
  const [isProcessingInternalUse, setIsProcessingInternalUse] = useState(false);

  // Supplier return dialog
  const [supplierReturnTransaction, setSupplierReturnTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [supplierReturnQuantity, setSupplierReturnQuantity] =
    useState<string>("");
  const [isProcessingSupplierReturn, setIsProcessingSupplierReturn] =
    useState(false);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<string>();
      transactions.forEach((t) => {
        if (t.items && t.items.length > 0) {
          t.items.forEach((item) => allIds.add(item.id));
        } else {
          allIds.add(t.id);
        }
      });
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectRow = (
    transaction: TransactionWithDetails,
    checked: boolean
  ) => {
    const newSelected = new Set(selectedIds);
    const isGroup = transaction.items && transaction.items.length > 0;

    if (checked) {
      if (isGroup) {
        transaction.items?.forEach((item) => newSelected.add(item.id));
      } else {
        newSelected.add(transaction.id);
      }
    } else {
      if (isGroup) {
        transaction.items?.forEach((item) => newSelected.delete(item.id));
      } else {
        newSelected.delete(transaction.id);
      }
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => {
          // Safeguard: Only delete if ID is NOT numeric (Group IDs are numeric)
          // Transaction IDs are CUIDs (alphanumeric)
          if (!isNaN(Number(id))) return Promise.resolve();

          return deleteTransaction.mutateAsync(id);
        })
      );

      toast.success(
        t("transactions.bulkDeleteSuccess", {
          defaultValue: "Transactions deleted successfully",
        })
      );
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      // mutations handle invalidation automatically
    } catch (error) {
      console.error("Bulk delete failed", error);
      toast.error(
        t("transactions.bulkDeleteError", {
          defaultValue: "Failed to delete transactions",
        })
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const isSearching = searchQuery.trim().length > 0;
  const hasActiveFilters = Boolean(
    dateFrom ||
    dateTo ||
    selectedType !== "all" ||
    selectedCategory !== "all" ||
    selectedCustomer !== "all"
  );

  const storeQuery = useQuery({
    queryKey: ["store"],
    queryFn: async () => {
      const store = await getStore();
      return store;
    },
    initialData: userStore ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeQuery.data?.store?.id;

  // Categories query for filter dropdown
  const categoriesQuery = useQuery({
    queryKey: ["product-categories", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const response = await api.get<{
        productCategories: Array<{ id: string; name: string }>;
      }>("/api/product-categories");
      return response.productCategories ?? [];
    },
    enabled: Boolean(storeId),
    staleTime: 1000 * 60 * 60,
  });

  // Customers query for filter dropdown
  const customersQuery = useQuery({
    queryKey: ["customers", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const response = await api.get<{
        customers: Array<{ id: string; name: string }>;
      }>(`/api/customers?store_id=${encodeURIComponent(storeId)}`);
      return response.customers;
    },
    enabled: Boolean(storeId),
    staleTime: 1000 * 60 * 15,
  });

  // Transactions query with filters
  const transactionsQuery = useQuery({
    queryKey: [
      "transactions",
      storeId,
      isSearching ? "search" : "page",
      isSearching ? searchQuery.trim() : pagination.pageIndex + 1,
      pagination.pageSize,
      {
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        type: selectedType,
        category: selectedCategory,
        customer: selectedCustomer,
      },
    ],
    queryFn: async (): Promise<TransactionsResponse> => {
      if (!storeId) {
        return {
          transactions: [],
          pagination: {
            total: 0,
            limit: pagination.pageSize,
            offset: pagination.pageIndex * pagination.pageSize,
            hasMore: false,
          },
        };
      }

      const params = new URLSearchParams({
        store_id: storeId,
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize),
      });

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      if (dateFrom) {
        params.append("start_date", startOfDay(dateFrom).toISOString());
      }
      if (dateTo) {
        params.append("end_date", endOfDay(dateTo).toISOString());
      }
      if (selectedType !== "all") {
        params.append("transaction_type", selectedType);
      }
      if (selectedCategory !== "all") {
        params.append("category_id", selectedCategory);
      }
      if (selectedCustomer !== "all") {
        params.append("customer_id", selectedCustomer);
      }

      const response = await api.get<TransactionsResponse>(
        `/api/transactions?${params.toString()}`
      );
      return response;
    },
    // Always enable when storeId exists
    enabled: Boolean(storeId),
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    retry: 3,
  });


  const transactionsData = transactionsQuery.data;

  const transactions = useMemo(() => {
    return transactionsData?.transactions ?? [];
  }, [transactionsData]);
  const serverTotal =
    transactionsData?.pagination?.total ?? transactions.length;

  const summaryQuery = useQuery({
    queryKey: [
      "transactions-summary",
      storeId,
      {
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        type: selectedType,
        category: selectedCategory,
        customer: selectedCustomer,
      },
    ],
    queryFn: async () => {
      if (!storeId) {
        return null;
      }
      const params = new URLSearchParams({ store_id: storeId });
      if (dateFrom)
        params.append("start_date", startOfDay(dateFrom).toISOString());
      if (dateTo) params.append("end_date", endOfDay(dateTo).toISOString());
      if (selectedType !== "all")
        params.append("transaction_type", selectedType);
      if (selectedCategory !== "all")
        params.append("category_id", selectedCategory);
      if (selectedCustomer !== "all")
        params.append("customer_id", selectedCustomer);

      const response = await api.get<{ summary: TransactionSummary }>(
        `/api/transactions/stats?${params.toString()}`
      );
      return response.summary;
    },
    enabled: Boolean(storeId),
    staleTime: 1000 * 60,
  });

  const fallbackSummary = useMemo<TransactionSummary>(() => {
    const base: TransactionSummary = {
      totalTransactions: serverTotal,
      totalRevenue: 0,
      totalImportAmount: 0,
      totalImportQuantity: 0,
      totalExportAmount: 0,
      totalExportQuantity: 0,
      totalReturnAmount: 0,
      totalReturnQuantity: 0,
      cost_of_goods_sold: 0,
      gross_profit: 0,
      profit_margin: 0,
    };
    return base;
  }, [serverTotal]);

  const summary = summaryQuery.data ?? fallbackSummary;

  const handleReturnSubmit = useCallback(async () => {
    if (!returnTransaction) {
      return;
    }

    const originalQuantity = returnTransaction.quantity;
    const parsedQuantity = Number.parseFloat(returnQuantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.warning(t("transactions.invalidQuantity"));
      return;
    }

    if (parsedQuantity > originalQuantity) {
      toast.warning(t("transactions.quantityExceedsOriginal"));
      return;
    }

    setIsReturning(true);
    try {
      const body =
        parsedQuantity === originalQuantity
          ? undefined
          : { quantity: parsedQuantity };

      await returnMutation.mutateAsync({ id: returnTransaction.id, quantity: body?.quantity });
      toast.success(t("transactions.returnSuccess"));
      setReturnTransaction(null);
      // Automatic invalidation handled by hook

      // Generate return receipt
      const receipt: ReceiptData = {
        id: `RET-${Date.now()}`,
        createdAt: new Date().toISOString(),
        storeName: storeQuery.data?.store?.name ?? "",
        storeAddress: storeQuery.data?.store?.address ?? null,
        storePhone: storeQuery.data?.store?.phone ?? null,
        customerName: returnTransaction.customer_name ?? null,
        cashierName: user?.name ?? user?.email ?? undefined,
        isDebtSale: false,
        subtotal: -(returnTransaction.unit_price * parsedQuantity),
        discountAmount: 0,
        loyaltyDiscountAmount: 0,
        total: -(returnTransaction.unit_price * parsedQuantity),
        lines: [
          {
            id: returnTransaction.id,
            productName: returnTransaction.product_name,
            variationName: returnTransaction.variation_name ?? "",
            quantity: -parsedQuantity,
            unitName: returnTransaction.unit_name ?? null,
            unitPrice: returnTransaction.unit_price,
            lineTotal: -(returnTransaction.unit_price * parsedQuantity),
          },
        ],
      };
      setLastReturnReceipt(receipt);
      setReturnReceiptOpen(true);
    } catch (error) {
      console.error("Return transaction failed", error);
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("transactions.returnError"));
    } finally {
      setIsReturning(false);
    }
  }, [returnTransaction, returnQuantity, t, transactionsQuery]);

  const handleExchangeSubmit = useCallback(async () => {
    if (!exchangeTransaction) {
      return;
    }

    const parsedReturnQty = Number.parseFloat(exchangeReturnQuantity);
    const parsedNewQty = Number.parseFloat(exchangeNewQuantity);

    if (
      Number.isNaN(parsedReturnQty) ||
      parsedReturnQty <= 0 ||
      Number.isNaN(parsedNewQty) ||
      parsedNewQty <= 0
    ) {
      toast.warning(t("transactions.invalidQuantity"));
      return;
    }

    if (!exchangeNewProductId) {
      toast.warning(t("transactions.selectProduct"));
      return;
    }

    setIsExchanging(true);
    try {
      const body = {
        returnQuantity: parsedReturnQty,
        newProductVariationId: exchangeNewProductId,
        newQuantity: parsedNewQty,
      };

      await exchangeMutation.mutateAsync({ id: exchangeTransaction.id, ...body });
      toast.success(t("transactions.exchangeSuccess"));
      setExchangeTransaction(null);
      setExchangeNewProductId("");
      setExchangeReturnQuantity("");
      setExchangeNewQuantity("");
    } catch (error) {
      console.error("Exchange transaction failed", error);
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("transactions.exchangeError"));
    } finally {
      setIsExchanging(false);
    }
  }, [
    exchangeTransaction,
    exchangeNewProductId,
    exchangeReturnQuantity,
    exchangeNewQuantity,
    t,
    transactionsQuery,
  ]);

  const handleRepaymentSubmit = useCallback(async () => {
    if (!repaymentTransaction || !repaymentTransaction.customer_id) {
      return;
    }

    const parsedAmount = Number.parseFloat(repaymentAmount);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.warning(t("transactions.invalidAmount"));
      return;
    }

    setIsRepaying(true);
    try {
      if (!repaymentTransaction.customer_id) throw new Error("Customer ID required");

      await repaymentMutation.mutateAsync({
        customerId: repaymentTransaction.customer_id,
        amount: parsedAmount,
        storeId: userStore?.store?.id
      });
      toast.success(t("transactions.repaymentSuccess"));
      setRepaymentTransaction(null);
      setRepaymentAmount("");
    } catch (error) {
      console.error("Repayment failed", error);
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("transactions.repaymentError"));
    } finally {
      setIsRepaying(false);
    }
  }, [
    repaymentTransaction,
    repaymentAmount,
    t,
    userStore?.store?.id,
    transactionsQuery,
  ]);

  const handleAdjustmentSubmit = useCallback(async () => {
    if (!adjustmentTransaction) {
      return;
    }

    const parsedQuantity = Number.parseFloat(adjustmentQuantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity === 0) {
      toast.warning(t("transactions.invalidQuantity"));
      return;
    }

    setIsAdjusting(true);
    try {
      if (!adjustmentTransaction.product_variation_id) throw new Error("Variation ID required");

      await createTransaction.mutateAsync({
        product_variation_id: adjustmentTransaction.product_variation_id,
        quantity: Math.abs(parsedQuantity),
        unit_price: adjustmentTransaction.unit_price,
        total_amount:
          adjustmentTransaction.unit_price * Math.abs(parsedQuantity),
        transaction_type: "adjustment",
        store_id: userStore?.store?.id,
        remarks:
          adjustmentReason ||
          `Adjustment: ${Math.sign(parsedQuantity) > 0 ? "increase" : "decrease"
          }`,
      });
      toast.success(t("transactions.adjustmentSuccess"));
      setAdjustmentTransaction(null);
      setAdjustmentQuantity("");
      setAdjustmentReason("");
    } catch (error) {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("transactions.adjustmentError"));
    } finally {
      setIsAdjusting(false);
    }
  }, [
    adjustmentTransaction,
    adjustmentQuantity,
    adjustmentReason,
    userStore?.store?.id,
    t,
    transactionsQuery,
  ]);

  const handleTransferSubmit = useCallback(async () => {
    if (!transferTransaction) {
      return;
    }

    const parsedQuantity = Number.parseFloat(transferQuantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.warning(t("transactions.invalidQuantity"));
      return;
    }

    setIsTransferring(true);
    try {
      if (!transferTransaction.product_variation_id) throw new Error("Variation ID required");

      await createTransaction.mutateAsync({
        product_variation_id: transferTransaction.product_variation_id,
        quantity: parsedQuantity,
        unit_price: transferTransaction.unit_price,
        total_amount: transferTransaction.unit_price * parsedQuantity,
        transaction_type: transferType,
        store_id: userStore?.store?.id,
        remarks: `Transfer ${transferType === "transfer_out" ? "out" : "in"
          }: ${parsedQuantity} units`,
      });
      toast.success(t("transactions.transferSuccess"));
      setTransferTransaction(null);
      setTransferQuantity("");
    } catch (error) {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("transactions.transferError"));
    } finally {
      setIsTransferring(false);
    }
  }, [
    transferTransaction,
    transferQuantity,
    transferType,
    userStore?.store?.id,
    t,
    transactionsQuery,
  ]);

  const handleInternalUseSubmit = useCallback(async () => {
    if (!internalUseTransaction) {
      return;
    }

    const parsedQuantity = Number.parseFloat(internalUseQuantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.warning(t("transactions.invalidQuantity"));
      return;
    }

    setIsProcessingInternalUse(true);
    try {
      if (!internalUseTransaction.product_variation_id) throw new Error("Variation ID required");

      await createTransaction.mutateAsync({
        product_variation_id: internalUseTransaction.product_variation_id,
        quantity: parsedQuantity,
        unit_price: internalUseTransaction.unit_price,
        total_amount: internalUseTransaction.unit_price * parsedQuantity,
        transaction_type: "internal_use",
        store_id: userStore?.store?.id,
        remarks: internalUseReason || "Internal use",
      });
      toast.success(t("transactions.internalUseSuccess"));
      setInternalUseTransaction(null);
      setInternalUseQuantity("");
      setInternalUseReason("");
    } catch (error) {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("transactions.internalUseError"));
    } finally {
      setIsProcessingInternalUse(false);
    }
  }, [
    internalUseTransaction,
    internalUseQuantity,
    internalUseReason,
    userStore?.store?.id,
    t,
    transactionsQuery,
  ]);

  const handleSupplierReturnSubmit = useCallback(async () => {
    if (!supplierReturnTransaction) {
      return;
    }

    const parsedQuantity = Number.parseFloat(supplierReturnQuantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast.warning(t("transactions.invalidQuantity"));
      return;
    }

    setIsProcessingSupplierReturn(true);
    try {
      if (!supplierReturnTransaction.product_variation_id) throw new Error("Variation ID required");

      await createTransaction.mutateAsync({
        product_variation_id: supplierReturnTransaction.product_variation_id,
        quantity: parsedQuantity,
        unit_price: supplierReturnTransaction.unit_price,
        total_amount: supplierReturnTransaction.unit_price * parsedQuantity,
        transaction_type: "supplier_return",
        store_id: userStore?.store?.id,
        remarks: `Supplier return: ${parsedQuantity} units`,
      });
      toast.success(t("transactions.supplierReturnSuccess"));
      setSupplierReturnTransaction(null);
      setSupplierReturnQuantity("");
    } catch (error) {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("transactions.supplierReturnError"));
    } finally {
      setIsProcessingSupplierReturn(false);
    }
  }, [
    supplierReturnTransaction,
    supplierReturnQuantity,
    userStore?.store?.id,
    t,
    transactionsQuery,
  ]);

  // Handlers for Exchange and Repayment moved to dedicated pages

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (selectedType !== "all") count++;
    if (selectedCategory !== "all") count++;
    if (selectedCustomer !== "all") count++;
    return count;
  }, [dateFrom, dateTo, selectedType, selectedCategory, selectedCustomer]);

  const isAllSelected = useMemo(() => {
    if (transactions.length === 0) return false;
    let allSelectableIdsCount = 0;
    transactions.forEach((t) => {
      if (t.items && t.items.length > 0) {
        allSelectableIdsCount += t.items.length;
      } else {
        allSelectableIdsCount += 1;
      }
    });
    return (
      selectedIds.size === allSelectableIdsCount && allSelectableIdsCount > 0
    );
  }, [transactions, selectedIds]);

  const isIndeterminate = useMemo(() => {
    if (transactions.length === 0) return false;
    return selectedIds.size > 0 && !isAllSelected;
  }, [selectedIds, isAllSelected, transactions]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const pageCount = Math.ceil(serverTotal / pagination.pageSize);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="border-b px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight md:text-xl">
              {t("transactions.title", { defaultValue: "Transactions" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("transactions.subtitle", {
                defaultValue: "Track every product movement across your store.",
              })}
            </p>
          </div>

        </div>
      </header>

      <main className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
        {/* Error Message */}
        {transactionsQuery.error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t("transactions.returnError", {
              defaultValue: "Failed to load transactions",
            })}
          </div>
        ) : null}



        {/* Summary Cards */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title={t("transactions.total", { defaultValue: "Total" })}
            value={formatNumber(
              summary.totalTransactions ?? serverTotal,
              locale
            )}
            description={t("transactions.transactions", {
              defaultValue: "Transactions",
            })}
            icon={Package}
          />
          <SummaryCard
            title={t("transactions.revenue", { defaultValue: "Revenue" })}
            value={formatCurrency(
              summary.totalExportAmount ?? summary.totalRevenue,
              "UZS",
              locale
            )}
            description={t("transactions.types.export", {
              defaultValue: "Export",
            })}
            icon={ArrowUpRight}
          />
          <SummaryCard
            title={t("transactions.imports", { defaultValue: "Imports" })}
            value={formatCurrency(summary.totalImportAmount, "UZS", locale)}
            description={t("transactions.types.import", {
              defaultValue: "Import",
            })}
            icon={ArrowDownLeft}
          />
          <SummaryCard
            title={t("transactions.return", { defaultValue: "Returns" })}
            value={formatCurrency(summary.totalReturnAmount, "UZS", locale)}
            description={t("transactions.types.return", {
              defaultValue: "Return",
            })}
            icon={Undo2}
          />
        </section>

        {/* Transactions Table with integrated filters */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-card shadow-none">
          {/* Sticky Filter Bar - always visible on top of table */}
          <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
            <div className="flex flex-col gap-4 p-4">
              {/* Filter Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="px-2 py-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setDateFrom(undefined);
                      setDateTo(undefined);
                      setSelectedType("all");
                      setSelectedCategory("all");
                      setSelectedCustomer("all");
                    }}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("common.reset", { defaultValue: "Reset" })}
                  </Button>
                )}
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={isBulkDeleting}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", { defaultValue: "Delete" })} (
                    {selectedIds.size})
                  </Button>
                )}
              </div>


              {/* Filter Controls */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                {/* Search */}
                <div className="space-y-2 md:col-span-2 xl:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("transactions.search", {
                      defaultValue: "Search",
                    })}
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={t("transactions.search", {
                        defaultValue: "Search by product, customer, or code...",
                      })}
                      className="h-10 pl-10 pr-3"
                    />
                  </div>
                </div>

                {/* Date Range Filters */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("transactions.filters.dateFrom", {
                      defaultValue: "From Date",
                    })}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full justify-start text-left font-normal hover:bg-accent"
                      >
                        <Calendar className="mr-2 size-4" />
                        {dateFrom ? (
                          format(dateFrom, "PPP")
                        ) : (
                          <span className="text-muted-foreground">
                            {t("transactions.filters.selectDate", {
                              defaultValue: "Select date",
                            })}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("transactions.filters.dateTo", {
                      defaultValue: "To Date",
                    })}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full justify-start text-left font-normal hover:bg-accent"
                      >
                        <Calendar className="mr-2 size-4" />
                        {dateTo ? (
                          format(dateTo, "PPP")
                        ) : (
                          <span className="text-muted-foreground">
                            {t("transactions.filters.selectDate", {
                              defaultValue: "Select date",
                            })}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("transactions.filters.type", { defaultValue: "Type" })}
                  </label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue
                        placeholder={t("transactions.filters.allTypes", {
                          defaultValue: "All Types",
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("transactions.filters.allTypes", {
                          defaultValue: "All Types",
                        })}
                      </SelectItem>
                      <SelectItem value="import">
                        <div className="flex items-center gap-2">
                          <ArrowDownLeft className="size-4 text-emerald-500" />
                          {t("transactions.types.import", {
                            defaultValue: "Import",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="export">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="size-4 text-rose-500" />
                          {t("transactions.types.export", {
                            defaultValue: "Export",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="return">
                        <div className="flex items-center gap-2">
                          <Undo2 className="size-4 text-amber-500" />
                          {t("transactions.types.return", {
                            defaultValue: "Return",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="debt">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="size-4 text-violet-500" />
                          {t("transactions.types.debt", {
                            defaultValue: "Debt",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="repayment">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="size-4 text-blue-500" />
                          {t("transactions.types.repayment", {
                            defaultValue: "Repayment",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="exchange">
                        <div className="flex items-center gap-2">
                          <Repeat2 className="size-4 text-cyan-500" />
                          {t("transactions.types.exchange", {
                            defaultValue: "Exchange",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="adjustment">
                        <div className="flex items-center gap-2">
                          <Zap className="size-4 text-orange-500" />
                          {t("transactions.types.adjustment", {
                            defaultValue: "Adjustment",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="transfer_in">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="size-4 text-teal-500" />
                          {t("transactions.types.transfer_in", {
                            defaultValue: "Transfer In",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="transfer_out">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="size-4 text-indigo-500" />
                          {t("transactions.types.transfer_out", {
                            defaultValue: "Transfer Out",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="internal_use">
                        <div className="flex items-center gap-2">
                          <Zap className="size-4 text-gray-500" />
                          {t("transactions.types.internal_use", {
                            defaultValue: "Internal Use",
                          })}
                        </div>
                      </SelectItem>
                      <SelectItem value="supplier_return">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="size-4 text-green-500" />
                          {t("transactions.types.supplier_return", {
                            defaultValue: "Supplier Return",
                          })}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("transactions.filters.category", {
                      defaultValue: "Category",
                    })}
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue
                        placeholder={t("transactions.filters.allCategories", {
                          defaultValue: "All Categories",
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("transactions.filters.allCategories", {
                          defaultValue: "All Categories",
                        })}
                      </SelectItem>
                      {categoriesQuery.data?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <Tag className="size-4 text-muted-foreground" />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("transactions.filters.customer", {
                      defaultValue: "Customer",
                    })}
                  </label>
                  <Popover
                    open={isCustomerPopoverOpen}
                    onOpenChange={setIsCustomerPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCustomerPopoverOpen}
                        className="h-10 w-full justify-between hover:bg-accent"
                      >
                        <span className="truncate">
                          {selectedCustomer === "all"
                            ? t("transactions.filters.allCustomers", {
                              defaultValue: "All Customers",
                            })
                            : customersQuery.data?.find(
                              (c) => c.id === selectedCustomer
                            )?.name}
                        </span>
                        <User className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput
                          placeholder={t(
                            "transactions.filters.searchCustomer",
                            {
                              defaultValue: "Search customer...",
                            }
                          )}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t("transactions.filters.noCustomerFound", {
                              defaultValue: "No customer found.",
                            })}
                          </CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setSelectedCustomer("all");
                                setIsCustomerPopoverOpen(false);
                              }}
                            >
                              {t("transactions.filters.allCustomers", {
                                defaultValue: "All Customers",
                              })}
                            </CommandItem>
                            {customersQuery.data && customersQuery.data.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={() => {
                                  setSelectedCustomer(customer.id);
                                  setIsCustomerPopoverOpen(false);
                                }}
                              >
                                {customer.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <ScrollArea className="h-full">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] px-1">
                      <Checkbox
                        checked={
                          isAllSelected || (isIndeterminate && "indeterminate")
                        }
                        onCheckedChange={(value) => toggleSelectAll(!!value)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>
                      {t("transactions.product", { defaultValue: "Product" })}
                    </TableHead>
                    <TableHead>
                      {t("transactions.type", { defaultValue: "Type" })}
                    </TableHead>
                    <TableHead>
                      {t("transactions.quantity", { defaultValue: "Qty" })}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("transactions.amount", { defaultValue: "Amount" })}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("transactions.date", { defaultValue: "Date" })}
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => {
                      const isGroup =
                        transaction.items && transaction.items.length > 0;
                      const isExpanded = expanded[transaction.id];

                      // Check selection status
                      let isSelected = selectedIds.has(transaction.id);
                      let isGroupIndeterminate = false;

                      if (isGroup && transaction.items) {
                        const childrenIds = transaction.items.map((i) => i.id);
                        const selectedChildrenCount = childrenIds.filter((id) =>
                          selectedIds.has(id)
                        ).length;
                        if (
                          selectedChildrenCount === childrenIds.length &&
                          childrenIds.length > 0
                        ) {
                          isSelected = true;
                        } else if (selectedChildrenCount > 0) {
                          isGroupIndeterminate = true;
                        }
                      }

                      const renderRow = (
                        item: TransactionWithDetails,
                        depth: number = 0
                      ) => {
                        const isItemGroup = item.items && item.items.length > 0;
                        const itemSelected = selectedIds.has(item.id);
                        const meta = TYPE_META[item.transaction_type];
                        const Icon = meta.icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;

                        return (
                          <TableRow
                            key={item.id}
                            data-state={itemSelected && "selected"}
                            className={depth > 0 ? "bg-muted/50" : undefined}
                          >
                            <TableCell className="px-1">
                              <Checkbox
                                checked={
                                  isItemGroup
                                    ? isSelected
                                      ? true
                                      : isGroupIndeterminate
                                        ? "indeterminate"
                                        : false
                                    : itemSelected
                                }
                                onCheckedChange={(value) =>
                                  toggleSelectRow(item, !!value)
                                }
                                aria-label="Select row"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="p-1">
                              {isItemGroup && (
                                <button
                                  onClick={() => toggleExpand(item.id)}
                                  className="flex items-center justify-center p-1 hover:bg-muted rounded-full transition-colors"
                                >
                                  {expanded[item.id] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </TableCell>
                            <TableCell>
                              <div
                                className="flex items-center gap-3"
                                style={{ paddingLeft: `${depth * 2}rem` }}
                              >
                                <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted/60 flex items-center justify-center shrink-0 relative z-10">
                                  {normalizeImageUrl(
                                    item.variation_image_url ??
                                    item.product_image_url
                                  ) ? (
                                    <img
                                      src={
                                        normalizeImageUrl(
                                          item.variation_image_url ??
                                          item.product_image_url
                                        ) ?? undefined
                                      }
                                      alt={item.product_name}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-foreground">
                                    {item.product_name}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {isItemGroup ? (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {item.id.replace("group_", "")}
                                      </Badge>
                                    ) : (
                                      <>
                                        {item.variation_name && (
                                          <Badge variant="outline">
                                            {item.variation_name}
                                          </Badge>
                                        )}
                                        {item.barcode && (
                                          <span className="font-mono text-[10px]">
                                            {item.barcode}
                                          </span>
                                        )}
                                      </>
                                    )}
                                    {isItemGroup && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {item.items?.length}{" "}
                                        {t("common.items", {
                                          defaultValue: "items",
                                        })}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "flex items-center gap-1.5 w-fit px-2 py-0.5 text-[11px] font-medium transition-colors",
                                    meta.badgeClassName
                                  )}
                                >
                                  <Icon className="size-3.5" />
                                  {t(meta.labelKey, {
                                    defaultValue: meta.defaultValue,
                                  })}
                                </Badge>
                                {item.transaction_type === "debt" &&
                                  (() => {
                                    const paidAmount =
                                      item.returns?.reduce(
                                        (sum, r) => sum + r.total_amount,
                                        0
                                      ) || 0;
                                    const isPaid =
                                      paidAmount >= item.total_amount;
                                    const isPartial =
                                      paidAmount > 0 &&
                                      paidAmount < item.total_amount;

                                    if (isPaid) {
                                      return (
                                        <Badge
                                          variant="outline"
                                          className="w-fit text-green-600 border-green-200 bg-green-50 px-1 py-0 h-4 text-[10px]"
                                        >
                                          {t("common.paid", {
                                            defaultValue: "Paid",
                                          })}
                                        </Badge>
                                      );
                                    }
                                    if (isPartial) {
                                      return (
                                        <Badge
                                          variant="outline"
                                          className="w-fit text-orange-600 border-orange-200 bg-orange-50 px-1 py-0 h-4 text-[10px]"
                                        >
                                          {t("common.partial", {
                                            defaultValue: "Partial",
                                          })}
                                        </Badge>
                                      );
                                    }
                                    return (
                                      <Badge
                                        variant="outline"
                                        className="w-fit text-red-400 border-red-200 bg-red-50 px-1 py-0 h-4 text-[10px]"
                                      >
                                        {t("common.unpaid", {
                                          defaultValue: "Unpaid",
                                        })}
                                      </Badge>
                                    );
                                  })()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {formatNumber(item.quantity, locale)}{" "}
                                {!isItemGroup && (
                                  <span className="text-xs text-muted-foreground">
                                    {item.unit_name}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.total_amount, "UZS", locale)}
                              {/* FISCALIZATION DISABLED - fiscal status badge
                              {item.fiscal_status && (
                                <div className="mt-1 flex justify-end">
                                  <Badge
                                    variant={item.fiscal_status === 'confirmed' ? 'outline' : 'secondary'}
                                    className={cn(
                                      "text-[10px] px-1 py-0 h-5",
                                      item.fiscal_status === 'failed' && "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
                                      item.fiscal_status === 'confirmed' && "text-green-600 border-green-600/20 bg-green-50"
                                    )}
                                  >
                                    {item.fiscal_status === 'confirmed' ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
                                    {item.fiscal_status}
                                  </Badge>
                                </div>
                              )}
                              */}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {formatDateTime(item.transaction_date, locale)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    aria-label={t(
                                      "transactions.table.openMenu"
                                    )}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>
                                    {t("transactions.table.actions")}
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onSelect={() => setDetailTransaction(item)}
                                  >
                                    {t("transactions.table.viewDetails")}
                                  </DropdownMenuItem>

                                  {/* FISCALIZATION DISABLED - Fiscal Actions
                                  {transaction.group_id && storeQuery.data?.store?.fiscal_enabled && (
                                    <>
                                      {!transaction.fiscal_status && (
                                        <DropdownMenuItem
                                          onClick={() => fiscalizeMutation.mutate({ groupId: transaction.group_id!, storeId: storeId! })}
                                        >
                                          <Printer className="mr-2 h-4 w-4" />
                                          {t("transactions.fiscalize", { defaultValue: "Fiscalize Receipt" })}
                                        </DropdownMenuItem>
                                      )}
                                      {transaction.fiscal_status === 'failed' && (
                                        <DropdownMenuItem
                                          onClick={() => fiscalizeMutation.mutate({ groupId: transaction.group_id!, storeId: storeId! })}
                                        >
                                          <RefreshCw className="mr-2 h-4 w-4" />
                                          {t("transactions.retryFiscal", { defaultValue: "Retry Fiscal" })}
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}
                                  */}
                                  {isSaleTransaction(item.transaction_type) && (
                                    <>
                                      <DropdownMenuItem

                                        onSelect={() =>
                                          setReturnTransaction(item)
                                        }
                                      >
                                        {t("transactions.table.return")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem

                                        onSelect={() => {
                                          setExchangeTransaction(item);
                                          setExchangeReturnQuantity(
                                            item.quantity.toString()
                                          );
                                        }}
                                      >
                                        {t("transactions.table.exchange", {
                                          defaultValue: "Exchange",
                                        })}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem

                                        onSelect={() => {
                                          setAdjustmentTransaction(item);
                                          setAdjustmentQuantity("");
                                          setAdjustmentReason("");
                                        }}
                                      >
                                        {t("transactions.table.adjustment", {
                                          defaultValue: "Adjustment",
                                        })}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem

                                        onSelect={() => {
                                          setTransferTransaction(item);
                                          setTransferQuantity("");
                                          setTransferType("transfer_out");
                                        }}
                                      >
                                        {t("transactions.table.transfer", {
                                          defaultValue: "Transfer",
                                        })}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem

                                        onSelect={() => {
                                          setInternalUseTransaction(item);
                                          setInternalUseQuantity("");
                                          setInternalUseReason("");
                                        }}
                                      >
                                        {t("transactions.table.internalUse", {
                                          defaultValue: "Internal Use",
                                        })}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem

                                        onSelect={() => {
                                          setSupplierReturnTransaction(item);
                                          setSupplierReturnQuantity("");
                                        }}
                                      >
                                        {t(
                                          "transactions.table.supplierReturn",
                                          {
                                            defaultValue: "Supplier Return",
                                          }
                                        )}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      };

                      return (
                        <Fragment key={transaction.id}>
                          {renderRow(transaction, 0)}
                          {isExpanded &&
                            transaction.items?.map((child) =>
                              renderRow(child, 1)
                            )}
                        </Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                          <span>
                            {t("transactions.noTransactions", {
                              defaultValue: "No transactions found.",
                            })}
                          </span>
                          <span>
                            {t("transactions.noResults", {
                              defaultValue: "Try adjusting your filters.",
                            })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {t("transactions.pagination.rowsPerPage", {
                defaultValue: "Rows per page",
              })}
            </p>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) => {
                setPagination((prev) => ({
                  ...prev,
                  pageSize: Number(value),
                  pageIndex: 0,
                }));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {pagination.pageIndex + 1} of {pageCount}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                }
                disabled={pagination.pageIndex === 0}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: prev.pageIndex - 1,
                  }))
                }
                disabled={pagination.pageIndex === 0}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: prev.pageIndex + 1,
                  }))
                }
                disabled={pagination.pageIndex >= pageCount - 1}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: pageCount - 1,
                  }))
                }
                disabled={pagination.pageIndex >= pageCount - 1}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Transaction Details Dialog */}
      <Dialog
        open={!!detailTransaction}
        onOpenChange={(open) => !open && setDetailTransaction(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("transactions.details.title", {
                defaultValue: "Transaction Details",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.details.description", {
                defaultValue: "Complete information about this transaction.",
              })}
            </DialogDescription>
          </DialogHeader>
          {detailTransaction && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted overflow-hidden">
                    {normalizeImageUrl(
                      detailTransaction.variation_image_url ??
                      detailTransaction.product_image_url
                    ) ? (
                      <img
                        src={
                          normalizeImageUrl(
                            detailTransaction.variation_image_url ??
                            detailTransaction.product_image_url
                          ) ?? undefined
                        }
                        alt={detailTransaction.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (() => {
                        const Icon =
                          TYPE_META[detailTransaction.transaction_type].icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
                        return (
                          <Icon className="size-6 text-muted-foreground" />
                        );
                      })()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {detailTransaction.product_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {detailTransaction.variation_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {formatCurrency(
                      detailTransaction.total_amount,
                      "UZS",
                      locale
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={
                        TYPE_META[detailTransaction.transaction_type]
                          .badgeClassName
                      }
                    >
                      {t(
                        TYPE_META[detailTransaction.transaction_type].labelKey,
                        {
                          defaultValue:
                            TYPE_META[detailTransaction.transaction_type]
                              .defaultValue,
                        }
                      )}
                    </Badge>
                    {detailTransaction.transaction_type === "debt" &&
                      (() => {
                        const paidAmount =
                          detailTransaction.returns?.reduce(
                            (sum, r) => sum + r.total_amount,
                            0
                          ) || 0;
                        const isPaid =
                          paidAmount >= detailTransaction.total_amount;
                        const isPartial =
                          paidAmount > 0 &&
                          paidAmount < detailTransaction.total_amount;

                        if (isPaid) {
                          return (
                            <Badge
                              variant="outline"
                              className="w-fit text-green-600 border-green-200 bg-green-50 px-1 py-0 h-4 text-[10px]"
                            >
                              {t("common.paid", {
                                defaultValue: "Paid",
                              })}
                            </Badge>
                          );
                        }
                        if (isPartial) {
                          return (
                            <Badge
                              variant="outline"
                              className="w-fit text-orange-600 border-orange-200 bg-orange-50 px-1 py-0 h-4 text-[10px]"
                            >
                              {t("common.partial", {
                                defaultValue: "Partial",
                              })}
                            </Badge>
                          );
                        }
                        return (
                          <Badge
                            variant="outline"
                            className="w-fit text-red-400 border-red-200 bg-red-50 px-1 py-0 h-4 text-[10px]"
                          >
                            {t("common.unpaid", {
                              defaultValue: "Unpaid",
                            })}
                          </Badge>
                        );
                      })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    {t("transactions.date")}
                  </span>
                  <div className="font-medium">
                    {formatDateTime(detailTransaction.transaction_date, locale)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    {t("transactions.quantity")}
                  </span>
                  <div className="font-medium">
                    {formatNumber(detailTransaction.quantity, locale)}{" "}
                    {detailTransaction.unit_name}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    {t("transactions.unitPrice")}
                  </span>
                  <div className="font-medium">
                    {formatCurrency(
                      detailTransaction.unit_price,
                      "UZS",
                      locale
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    {t("transactions.category")}
                  </span>
                  <div className="font-medium">
                    {detailTransaction.category_name ||
                      t("common.notSpecified")}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    {t("transactions.customer")}
                  </span>
                  <div className="font-medium">
                    {detailTransaction.customer_name ||
                      t("common.notSpecified")}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    {t("transactions.deliveryCost")}
                  </span>
                  <div className="font-medium">
                    {formatCurrency(
                      detailTransaction.delivery_cost,
                      "UZS",
                      locale
                    )}
                  </div>
                </div>
              </div>

              {detailTransaction.remarks && (
                <div className="space-y-2">
                  <Label>{t("transactions.remarks")}</Label>
                  <div className="rounded-md border bg-muted/50 p-3 text-sm">
                    {detailTransaction.remarks}
                  </div>
                </div>
              )}

              {detailTransaction.transaction_type === "debt" &&
                detailTransaction.customer_id && (
                  <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-orange-900">
                        {t("transactions.debtBalance", {
                          defaultValue: "Customer Debt Balance",
                        })}
                      </Label>
                      <Badge variant="outline" className="border-orange-300">
                        {t("transactions.pending", { defaultValue: "Pending" })}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(
                        detailTransaction.total_amount,
                        "UZS",
                        locale
                      )}
                    </p>
                    <p className="text-xs text-orange-700">
                      {t("transactions.debtBalanceHint", {
                        defaultValue:
                          "This customer has an outstanding debt. Process a repayment to reduce the balance.",
                      })}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setRepaymentTransaction(detailTransaction);
                        setRepaymentAmount("");
                      }}
                    >
                      {t("transactions.processRepayment", {
                        defaultValue: "Process Repayment",
                      })}
                    </Button>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Transaction Dialog */}
      <Dialog
        open={!!returnTransaction}
        onOpenChange={(open) => !open && setReturnTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("transactions.returnTitle", {
                defaultValue: "Process Return",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.returnDescription", {
                defaultValue:
                  "Enter the quantity to return. This will update your inventory.",
              })}
            </DialogDescription>
          </DialogHeader>
          {returnTransaction && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("transactions.product")}</Label>
                <div className="rounded-md border bg-muted p-2 text-sm font-medium">
                  {returnTransaction.product_name} -{" "}
                  {returnTransaction.variation_name}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("transactions.originalQuantity")}</Label>
                  <div className="rounded-md border p-2 text-sm">
                    {returnTransaction.quantity} {returnTransaction.unit_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return-qty">
                    {t("transactions.returnQuantity")}
                  </Label>
                  <Input
                    id="return-qty"
                    type="number"
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(e.target.value)}
                    min="0"
                    max={returnTransaction.quantity}
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnTransaction(null)}
              disabled={isReturning}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleReturnSubmit} disabled={isReturning}>
              {isReturning ? t("common.processing") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Receipt Dialog */}
      <Dialog open={returnReceiptOpen} onOpenChange={setReturnReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t("transactions.returnReceipt", {
                defaultValue: "Return Receipt",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {lastReturnReceipt && (
              <div
                id="return-receipt-content"
                ref={receiptRef}
                className="mx-auto w-full rounded-lg border border-dashed border-border/60 bg-background p-4 text-xs"
              >
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-bold uppercase">
                    {lastReturnReceipt.storeName}
                  </h3>
                  {lastReturnReceipt.storeAddress && (
                    <p className="text-muted-foreground">
                      {lastReturnReceipt.storeAddress}
                    </p>
                  )}
                  {lastReturnReceipt.storePhone && (
                    <p className="text-muted-foreground">
                      {lastReturnReceipt.storePhone}
                    </p>
                  )}
                  <p className="mt-2 text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(lastReturnReceipt.createdAt))}
                  </p>
                </div>

                <div className="mb-4 space-y-2 border-b border-dashed border-border/60 pb-4">
                  {lastReturnReceipt.lines.map((line) => (
                    <div key={line.id} className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {line.productName}
                          {line.variationName && ` (${line.variationName})`}
                        </p>
                        <p className="text-muted-foreground">
                          {formatNumber(line.quantity, locale)} x{" "}
                          {formatCurrency(line.unitPrice, "UZS", locale)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(line.lineTotal, "UZS", locale)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-right">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t("pos.total", { defaultValue: "Total" })}</span>
                    <span>
                      {formatCurrency(lastReturnReceipt.total, "UZS", locale)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 border-t border-dashed border-border/60 pt-4 text-center">
                  <p className="font-medium">
                    {t("pos.thankYou", {
                      defaultValue: "Thank you for shopping!",
                    })}
                  </p>
                  {lastReturnReceipt.id && (
                    <p className="text-[10px] text-muted-foreground">
                      ID: {lastReturnReceipt.id}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (receiptRef.current) {
                    const content = receiptRef.current.innerHTML;
                    const printWindow = window.open(
                      "",
                      "",
                      "height=600,width=800"
                    );
                    if (printWindow) {
                      printWindow.document.write(
                        "<html><head><title>Print Receipt</title>"
                      );
                      printWindow.document.write(
                        '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">'
                      );
                      printWindow.document.write("</head><body class='p-4'>");
                      printWindow.document.write(content);
                      printWindow.document.write("</body></html>");
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }
                }}
              >
                {t("common.print", { defaultValue: "Print" })}
              </Button>
              <Button
                className="w-full"
                onClick={() => setReturnReceiptOpen(false)}
              >
                {t("common.close", { defaultValue: "Close" })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repayment Transaction Dialog */}
      <Dialog
        open={!!repaymentTransaction}
        onOpenChange={(open) => !open && setRepaymentTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("transactions.repaymentTitle", {
                defaultValue: "Process Debt Repayment",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.repaymentDescription", {
                defaultValue:
                  "Enter the repayment amount to reduce the debt balance.",
              })}
            </DialogDescription>
          </DialogHeader>
          {repaymentTransaction && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("transactions.customer")}</Label>
                <div className="rounded-md border bg-muted p-2 text-sm font-medium">
                  {repaymentTransaction.customer_name ||
                    t("common.notSpecified")}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("transactions.outstandingDebt")}</Label>
                <div className="rounded-md border bg-orange-50 p-2 text-sm font-bold text-orange-600">
                  {formatCurrency(
                    repaymentTransaction.total_amount,
                    "UZS",
                    locale
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="repayment-amount">
                  {t("transactions.repaymentAmount")}
                </Label>
                <Input
                  id="repayment-amount"
                  type="number"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  min="0"
                  max={repaymentTransaction.total_amount}
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRepaymentTransaction(null)}
              disabled={isRepaying}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRepaymentSubmit} disabled={isRepaying}>
              {isRepaying ? t("common.processing") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exchange Transaction Dialog */}
      <Dialog
        open={!!exchangeTransaction}
        onOpenChange={(open) => !open && setExchangeTransaction(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("transactions.exchangeTitle", {
                defaultValue: "Process Exchange",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.exchangeDescription", {
                defaultValue:
                  "Return the original item and select a new product to exchange it with.",
              })}
            </DialogDescription>
          </DialogHeader>
          {exchangeTransaction && (
            <div className="grid gap-4 py-4">
              {/* Original Item Section */}
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-semibold">
                  {t("transactions.originalItem", {
                    defaultValue: "Original Item",
                  })}
                </h4>
                <div className="space-y-2">
                  <Label>{t("transactions.product")}</Label>
                  <div className="rounded-md border bg-muted p-2 text-sm font-medium">
                    {exchangeTransaction.product_name} -{" "}
                    {exchangeTransaction.variation_name}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("transactions.originalQuantity")}</Label>
                    <div className="rounded-md border p-2 text-sm">
                      {exchangeTransaction.quantity}{" "}
                      {exchangeTransaction.unit_name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exchange-return-qty">
                      {t("transactions.returnQuantity")}
                    </Label>
                    <Input
                      id="exchange-return-qty"
                      type="number"
                      value={exchangeReturnQuantity}
                      onChange={(e) =>
                        setExchangeReturnQuantity(e.target.value)
                      }
                      min="0"
                      max={exchangeTransaction.quantity}
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* New Item Section */}
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-semibold">
                  {t("transactions.newItem", { defaultValue: "New Item" })}
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="exchange-product">
                    {t("transactions.selectProduct", {
                      defaultValue: "Select Product",
                    })}
                  </Label>
                  <Input
                    id="exchange-product"
                    placeholder="Search products..."
                    value={exchangeNewProductId}
                    onChange={(e) => setExchangeNewProductId(e.target.value)}
                    type="text"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("transactions.enterProductId", {
                      defaultValue: "Enter product variation ID",
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange-qty">
                    {t("transactions.quantity")}
                  </Label>
                  <Input
                    id="exchange-qty"
                    type="number"
                    value={exchangeNewQuantity}
                    onChange={(e) => setExchangeNewQuantity(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExchangeTransaction(null)}
              disabled={isExchanging}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleExchangeSubmit} disabled={isExchanging}>
              {isExchanging ? t("common.processing") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Transaction Dialog */}
      <Dialog
        open={!!adjustmentTransaction}
        onOpenChange={(open) => !open && setAdjustmentTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("transactions.adjustmentTitle", {
                defaultValue: "Stock Adjustment",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.adjustmentDescription", {
                defaultValue:
                  "Enter the quantity to adjust. Use positive for increase, negative for decrease.",
              })}
            </DialogDescription>
          </DialogHeader>
          {adjustmentTransaction && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("transactions.product")}</Label>
                <div className="rounded-md border bg-muted p-2 text-sm font-medium">
                  {adjustmentTransaction.product_name} -{" "}
                  {adjustmentTransaction.variation_name}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment-qty">
                  {t("transactions.adjustmentQuantity", {
                    defaultValue: "Adjustment Quantity",
                  })}
                </Label>
                <Input
                  id="adjustment-qty"
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  step="0.01"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  {t("transactions.adjustmentHint", {
                    defaultValue:
                      "Positive number to increase, negative to decrease",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment-reason">
                  {t("transactions.reason", { defaultValue: "Reason" })}
                </Label>
                <Input
                  id="adjustment-reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder={t("transactions.reasonPlaceholder", {
                    defaultValue: "e.g., Damaged, Missing, Inventory Count",
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustmentTransaction(null)}
              disabled={isAdjusting}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAdjustmentSubmit} disabled={isAdjusting}>
              {isAdjusting ? t("common.processing") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Transaction Dialog */}
      <Dialog
        open={!!transferTransaction}
        onOpenChange={(open) => !open && setTransferTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("transactions.transferTitle", {
                defaultValue: "Transfer Stock",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.transferDescription", {
                defaultValue: "Record a stock transfer in or out of inventory.",
              })}
            </DialogDescription>
          </DialogHeader>
          {transferTransaction && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("transactions.product")}</Label>
                <div className="rounded-md border bg-muted p-2 text-sm font-medium">
                  {transferTransaction.product_name} -{" "}
                  {transferTransaction.variation_name}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-type">
                  {t("transactions.transferType", {
                    defaultValue: "Transfer Type",
                  })}
                </Label>
                <Select
                  value={transferType}
                  onValueChange={(value) => {
                    setTransferType(value as "transfer_in" | "transfer_out");
                  }}
                >
                  <SelectTrigger id="transfer-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer_out">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="size-4 text-indigo-500" />
                        {t("transactions.types.transfer_out", {
                          defaultValue: "Transfer Out",
                        })}
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer_in">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="size-4 text-teal-500" />
                        {t("transactions.types.transfer_in", {
                          defaultValue: "Transfer In",
                        })}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-qty">
                  {t("transactions.quantity")}
                </Label>
                <Input
                  id="transfer-qty"
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferTransaction(null)}
              disabled={isTransferring}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleTransferSubmit} disabled={isTransferring}>
              {isTransferring ? t("common.processing") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal Use Transaction Dialog */}
      <Dialog
        open={!!internalUseTransaction}
        onOpenChange={(open) => !open && setInternalUseTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("transactions.internalUseTitle", {
                defaultValue: "Record Internal Use",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.internalUseDescription", {
                defaultValue:
                  "Record products used internally by the business.",
              })}
            </DialogDescription>
          </DialogHeader>
          {internalUseTransaction && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("transactions.product")}</Label>
                <div className="rounded-md border bg-muted p-2 text-sm font-medium">
                  {internalUseTransaction.product_name} -{" "}
                  {internalUseTransaction.variation_name}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="internal-use-qty">
                  {t("transactions.quantity")}
                </Label>
                <Input
                  id="internal-use-qty"
                  type="number"
                  value={internalUseQuantity}
                  onChange={(e) => setInternalUseQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internal-use-reason">
                  {t("transactions.purpose", {
                    defaultValue: "Purpose",
                  })}
                </Label>
                <Input
                  id="internal-use-reason"
                  value={internalUseReason}
                  onChange={(e) => setInternalUseReason(e.target.value)}
                  placeholder={t("transactions.purposePlaceholder", {
                    defaultValue:
                      "e.g., Employee consumption, Demonstration, Testing",
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInternalUseTransaction(null)}
              disabled={isProcessingInternalUse}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleInternalUseSubmit}
              disabled={isProcessingInternalUse}
            >
              {isProcessingInternalUse
                ? t("common.processing")
                : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Return Transaction Dialog */}
      <Dialog
        open={!!supplierReturnTransaction}
        onOpenChange={(open) => !open && setSupplierReturnTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("transactions.supplierReturnTitle", {
                defaultValue: "Return to Supplier",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.supplierReturnDescription", {
                defaultValue:
                  "Record items returned to the supplier for refund or credit.",
              })}
            </DialogDescription>
          </DialogHeader>
          {supplierReturnTransaction && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("transactions.product")}</Label>
                <div className="rounded-md border bg-muted p-2 text-sm font-medium">
                  {supplierReturnTransaction.product_name} -{" "}
                  {supplierReturnTransaction.variation_name}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-return-qty">
                  {t("transactions.returnQuantity")}
                </Label>
                <Input
                  id="supplier-return-qty"
                  type="number"
                  value={supplierReturnQuantity}
                  onChange={(e) => setSupplierReturnQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSupplierReturnTransaction(null)}
              disabled={isProcessingSupplierReturn}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSupplierReturnSubmit}
              disabled={isProcessingSupplierReturn}
            >
              {isProcessingSupplierReturn
                ? t("common.processing")
                : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exchange and Debt Repayment Modals removed - now using dedicated pages */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #return-receipt-content, #return-receipt-content * {
              visibility: visible;
            }
            #return-receipt-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            @page {
              margin: 0;
              size: auto;
            }
          }
        `}
      </style>
      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("transactions.bulkDeleteConfirmTitle", {
                defaultValue: "Delete Transactions",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("transactions.bulkDeleteConfirmDescription", {
                defaultValue:
                  "Are you sure you want to delete these transactions? This action cannot be undone.",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              disabled={isBulkDeleting}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("common.deleting", { defaultValue: "Deleting..." })}
                </>
              ) : (
                t("common.delete", { defaultValue: "Delete" })
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
