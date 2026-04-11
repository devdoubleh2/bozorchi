import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Minus,
  Package2,
  Plus,
  ShoppingCart,
  Grid3X3,
  List,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTransactionMutations } from "@/hooks/useTransactionMutations";
import { toast } from "sonner";
import {
  usePOSStore,
  type InventoryItem,
  type ReceiptData,
  type PaymentMethod,
} from "@/context/POSStore";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { printReceipt, renderReceiptMarkdown, markdownToHtml } from "@/lib/receipt-renderer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { cn } from "@/lib/utils";
import { POSSidebar } from "@/components/pos/POSSidebar";
import { useDebounce } from "@/hooks/use-debounce";

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

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  loyalty_card: {
    id: string;
    points: number;
  } | null;
}

// Local types removed in favor of POSStore types
interface PaymentLine {
  id: string;
  method: PaymentMethod;
  amount: string;
}

// Virtualized Inventory List Component for performance with large datasets
interface VirtualizedInventoryListProps {
  items: InventoryItem[];
  layoutMode: "grid" | "list";
  renderGridItem: (item: InventoryItem) => React.ReactNode;
  renderListItem: (item: InventoryItem) => React.ReactNode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

function VirtualizedInventoryList({
  items,
  layoutMode,
  renderGridItem,
  renderListItem,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  scrollContainerRef,
}: VirtualizedInventoryListProps) {
  // Use external scroll container if provided, otherwise use local ref
  const localRef = useRef<HTMLDivElement>(null);
  const parentRef = scrollContainerRef ?? localRef;

  // Calculate columns based on screen width for grid mode
  const getColumnCount = useCallback(() => {
    if (layoutMode === "list") return 1;
    if (typeof window === "undefined") return 4;
    const width = window.innerWidth;
    if (width < 640) return 1; // sm
    if (width < 1280) return 2; // xl
    if (width < 1536) return 3; // 2xl
    return 4;
  }, [layoutMode]);

  const [columnCount, setColumnCount] = useState(getColumnCount);

  useEffect(() => {
    const handleResize = () => setColumnCount(getColumnCount());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getColumnCount]);

  // Group items into rows for grid mode
  const rows = useMemo(() => {
    if (layoutMode === "list") {
      return items.map((item) => [item]);
    }
    const result: InventoryItem[][] = [];
    for (let i = 0; i < items.length; i += columnCount) {
      result.push(items.slice(i, i + columnCount));
    }
    return result;
  }, [items, columnCount, layoutMode]);

  // Gap between rows (in pixels)
  const rowGap = layoutMode === "grid" ? 24 : 16; // gap-6 = 24px, gap-4 = 16px

  // Add +1 to count if there's a next page to render a loader row
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (layoutMode === "grid" ? 520 : 120),
    overscan: 5,
    gap: rowGap,
    // Dynamic measurement for accurate row heights
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  // Infinite scroll trigger - fetch next page when near end
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    // When we're within 5 rows of the end, fetch more
    if (
      lastItem.index >= rows.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage &&
      fetchNextPage
    ) {
      fetchNextPage();
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // When using external scroll container, we don't render our own scroll wrapper
  const useExternalScroll = !!scrollContainerRef;

  const content = (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        // Check if this is the loader row (beyond actual data)
        const isLoaderRow = virtualRow.index >= rows.length;
        const rowItems = rows[virtualRow.index];

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {isLoaderRow ? (
              <div className="flex h-full items-center justify-center">
                {hasNextPage ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No more items
                  </span>
                )}
              </div>
            ) : layoutMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {rowItems.map((item) => renderGridItem(item))}
              </div>
            ) : (
              <div>{rowItems.map((item) => renderListItem(item))}</div>
            )}
          </div>
        );
      })}
    </div>
  );

  // If using external scroll container, just return content without wrapper
  if (useExternalScroll) {
    return content;
  }

  // Otherwise, render with internal scroll container
  return (
    <div
      ref={localRef}
      className="h-[calc(100vh-4rem)] overflow-auto"
      style={{ contain: "strict" }}
    >
      {content}
    </div>
  );
}

export default function POSPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || "ru-RU";
  const queryClient = useQueryClient();
  const { user, userStore, getStore } = useAuth();
  const { createTransaction } = useTransactionMutations();



  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [orderOpen, setOrderOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false); // New state for history modal

  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [paymentLines, setPaymentLines] = useState<
    { id: string; method: PaymentMethod; amount: string }[]
  >([{ id: "1", method: "cash", amount: "" }]);
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const storeQuery = useQuery({
    queryKey: ["pos-store"],
    queryFn: async () => getStore(),
    initialData: userStore ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeQuery.data?.store?.id;
  const organizationId = storeQuery.data?.store?.organization_id;
  const storeCurrency = storeQuery.data?.store?.currency ?? "UZS";

  // Pagination response type
  interface InventoryResponse {
    inventory: InventoryItem[];
    pagination: {
      total: number;
      limit: number;
      hasNextPage: boolean;
      nextCursor: string | null;
    };
  }

  // Use infinite query for paginated inventory loading
  const inventoryQuery = useInfiniteQuery({
    queryKey: ["pos-inventory", storeId, debouncedSearchQuery, activeCategory],
    queryFn: async ({ pageParam }): Promise<InventoryResponse> => {
      const emptyResponse: InventoryResponse = {
        inventory: [],
        pagination: {
          total: 0,
          limit: 50,
          hasNextPage: false,
          nextCursor: null,
        },
      };

      if (!organizationId) return emptyResponse;

      const params = new URLSearchParams({
        limit: "50",
      });

      if (pageParam) {
        params.set("cursor", pageParam);
      }

      if (debouncedSearchQuery.trim()) {
        params.set("search", debouncedSearchQuery.trim());
      }

      const response = await api.get<InventoryResponse>(
        `/api/organizations/${organizationId}/products?${params.toString()}`
      );

      // Ensure we always return a properly structured response
      return {
        inventory: response?.inventory ?? [],
        pagination: response?.pagination ?? emptyResponse.pagination,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextCursor ?? null,
    enabled: Boolean(organizationId),
    refetchInterval: 1000 * 60 * 2,
    staleTime: 1000 * 30,
    retry: 3,
  });

  const categoriesQuery = useQuery({
    queryKey: ["pos-categories", storeId],
    queryFn: async (): Promise<{
      categories: Array<{ id: string; name: string }>;
    }> => {
      if (!storeId) return { categories: [] };
      return await api.get<{ categories: Array<{ id: string; name: string }> }>(
        `/api/product-categories/names`
      );
    },
    enabled: Boolean(storeId),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes (was 30 min, caused stale categories)
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  const customersQuery = useQuery({
    queryKey: ["pos-customers", storeId],
    queryFn: async (): Promise<{ customers: Customer[] }> => {
      if (!storeId) return { customers: [] };
      return await api.get<{ customers: Customer[] }>(
        `/api/customers?storeId=${encodeURIComponent(storeId)}`
      );
    },
    enabled: Boolean(storeId),
    refetchInterval: 1000 * 60 * 5,
  });

  const {
    cart,
    addToCart,
    decrementQuantity,

    clearCart,
    getCartItem,
    getCartItemCount,
    getCartTotal,
    clearDiscount,
    getDiscountAmount,
    getFinalTotal,
    loyaltyRedemption,
    clearLoyaltyRedemption,
    setCurrency,
    setIsProcessingTransaction,
    is_processing_transaction: isProcessing,
    isDebtSale,
    setIsDebtSale,

    addReceipt,
    lastReceipts,
    paymentMethods,
  } = usePOSStore();

  useEffect(() => {
    if (storeCurrency) {
      setCurrency(storeCurrency);
    }
  }, [storeCurrency, setCurrency]);

  // Safety: Always reset processing state on mount (prevents stuck button from previous session)
  useEffect(() => {
    if (isProcessing) {
      console.warn("[POS] Resetting stuck processing state on mount");
      setIsProcessingTransaction(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    if (!selectedCustomer && isDebtSale) {
      setIsDebtSale(false);
    }
  }, [selectedCustomer, isDebtSale, setIsDebtSale]);

  // Flatten paginated inventory data from infinite query
  const inventory = useMemo(
    () => inventoryQuery.data?.pages.flatMap((page) => page.inventory) ?? [],
    [inventoryQuery.data]
  );

  const customers = useMemo(
    () => customersQuery.data?.customers ?? [],
    [customersQuery.data]
  );

  // Categories are now fetched from dedicated endpoint (static, not derived from inventory)
  const categories = useMemo(() => {
    const categoryNames =
      categoriesQuery.data?.categories.map((c) => c.name) ?? [];
    return ["all", ...categoryNames.sort((a, b) => a.localeCompare(b))];
  }, [categoriesQuery.data]);

  // Apply category filtering
  const filteredInventory = useMemo(() => {
    if (activeCategory === "all") {
      return inventory;
    }
    return inventory.filter(item =>
      item.product_variation?.product?.product_category?.name === activeCategory
    );
  }, [inventory, activeCategory]);

  const cartItemCount = getCartItemCount();
  const subtotal = getCartTotal();
  const discountAmount = getDiscountAmount();
  const loyaltyDiscountAmount = loyaltyRedemption?.amount ?? 0;
  const total = getFinalTotal();

  const handleAddToCart = (item: InventoryItem) => {
    const inCart = getCartItem(item.id);
    const isService = item.is_service || item.product_variation?.product?.type === "service";
    // Services have unlimited stock, no validation needed
    if (!isService && inCart && inCart.cart_quantity >= item.quantity_in_stock) {
      toast.error(t("pos.insufficientStock"));
      return;
    }
    addToCart(item);
  };

  useEffect(() => {
    if (
      loyaltyRedemption &&
      (!selectedCustomer ||
        loyaltyRedemption.customerId !== selectedCustomer.id)
    ) {
      clearLoyaltyRedemption();
    }
  }, [selectedCustomer, loyaltyRedemption, clearLoyaltyRedemption]);

  const handleCheckout = async (
    paymentsOverride?: {
      amount: number;
      payment_method: string;
      currency: string;
      received_at: string;
    }[]
  ) => {
    if (cart.length === 0) {
      toast.error(t("pos.emptyCart"));
      return;
    }
    if (!storeId) {
      toast.error(t("pos.noStoreSelected"));
      return;
    }

    if (isDebtSale && !selectedCustomer) {
      toast.error(t("pos.debtCustomerRequired"));
      return;
    }

    const normalizedPayment = isDebtSale
      ? null
      : paymentsOverride && paymentsOverride.length > 0
        ? null
        : {
          amount: total,
          payment_method: "cash",
          currency: storeCurrency,
          received_at: new Date().toISOString(),
        };

    const effectivePayments =
      !isDebtSale && paymentsOverride && paymentsOverride.length > 0
        ? paymentsOverride
        : normalizedPayment
          ? [normalizedPayment]
          : null;

    const getPaymentMethodLabel = (method: string) => {
      switch (method) {
        case "cash":
          return t("pos.cash");
        case "card":
          return t("pos.card");
        case "dynamic_qr":
          return t("payment.dynamic_qr", { defaultValue: "Dynamic QR" });
        default:
          return method;
      }
    };

    const paymentRemarkLabel = isDebtSale
      ? t("pos.debtSaleLabel")
      : effectivePayments && effectivePayments.length > 0
        ? t("pos.paymentMethodRemark", {
          method: effectivePayments
            .map((p) => getPaymentMethodLabel(p.payment_method))
            .join(" + "),
        })
        : t("pos.paymentMethodRemark", { method: t("pos.cash") });

    // Snapshot current cart & context for receipt before any mutations
    const cartSnapshot = [...cart];
    // we can group them under one "Receipt" ID.
    // Use a numeric ID: Timestamp (13 digits) + Random (3 digits) = 16 digits
    const receiptId = `${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;
    const groupId = receiptId; // Use receipt ID as group ID

    const receiptSnapshot: ReceiptData | null =
      cartSnapshot.length === 0
        ? null
        : {
          id: receiptId,
          cashierName: user?.name ?? user?.email ?? undefined,
          createdAt: new Date().toISOString(),
          storeName: storeQuery.data?.store?.name ?? "",
          storeAddress: storeQuery.data?.store?.address ?? null,
          storePhone: storeQuery.data?.store?.phone ?? null,
          customerName: selectedCustomer?.name ?? null,
          isDebtSale,
          subtotal,
          discountAmount,
          loyaltyDiscountAmount,
          total,
          lines: cartSnapshot.map((item) => ({
            id: item.id,
            productName: item.product_variation.product.name,
            variationName: item.product_variation.name,
            quantity: item.cart_quantity,
            unitName: item.product_variation.unit?.name ?? null,
            unitPrice: item.product_variation.selling_price,
            lineTotal:
              item.product_variation.selling_price * item.cart_quantity,
          })),
        };

    setIsProcessingTransaction(true);
    try {
      // Process each cart item sequentially to avoid request bursts.
      const processCartItem = async (item: typeof cart[0], index: number) => {
        const transactionData = {
          product_variation_id: item.product_variation.id,
          quantity: item.cart_quantity,
          unit_price: item.product_variation.selling_price,
          total_amount:
            item.product_variation.selling_price * item.cart_quantity,
          transaction_type: isDebtSale ? "debt" : "export",
          store_id: storeId!,
          customer_id: selectedCustomer?.id,
          payments:
            index === 0 && !isDebtSale
              ? effectivePayments ?? undefined
              : undefined,
          ...(index === 0 &&
            !isDebtSale &&
            loyaltyRedemption &&
            selectedCustomer &&
            loyaltyRedemption.customerId === selectedCustomer.id
            ? {
              redeem_points: loyaltyRedemption.points,
              loyalty_discount_amount: loyaltyRedemption.amount,
            }
            : {}),
          remarks: `POS Sale - ${item.product_variation.name}${selectedCustomer ? ` - ${selectedCustomer.name}` : ""
            } - ${paymentRemarkLabel}`,
          group_id: groupId,
          __skipInvalidation: true,
        };

        await createTransaction.mutateAsync(transactionData);
      };

      for (const [index, item] of cart.entries()) {
        await processCartItem(item, index);
      }

      if (receiptSnapshot) {
        setLastReceipt(receiptSnapshot);
        addReceipt(receiptSnapshot);
        setReceiptOpen(true);
      }

      clearCart();
      clearDiscount();
      clearLoyaltyRedemption();
      setSelectedCustomer(null);
      setOrderOpen(false);
      setIsDebtSale(false);

      toast.success(t("pos.transactionCompleted", {
        total: formatCurrency(total, storeCurrency, locale),
      }));

      // Only invalidate queries if online (otherwise they'll refresh on reconnect)
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ["pos-inventory", storeId] });
        queryClient.invalidateQueries({ queryKey: ["pos-categories", storeId] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["pos-customers", storeId] });
      }
    } catch (error) {
      console.error("POS checkout failed", error);
      toast.error(t("pos.transactionFailed"));
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastReceipt) return;
    printReceipt(lastReceipt, {
      formatCurrency: (amount) => formatCurrency(amount, storeCurrency, locale),
      locale,
      currency: storeCurrency,
    });
  };

  const renderGridItem = (item: InventoryItem) => {
    const variation = item.product_variation;
    const inCart = getCartItem(item.id);
    const remaining = item.quantity_in_stock;
    const imageUrl = normalizeImageUrl(
      variation.image_url ?? variation.product.image_url ?? null
    );

    const isService = item.is_service || item.product_variation?.product?.type === "service";

    const stockLabel = isService
      ? t("inventory.service") || t("inventory.inStock")
      : item.quantity_in_stock === 0
        ? t("inventory.outOfStock")
        : item.quantity_in_stock <= 5
          ? t("inventory.lowStock")
          : t("inventory.inStock");
    const stockTone = isService
      ? "border-emerald-400/50 bg-emerald-400/5 text-emerald-600"
      : item.quantity_in_stock === 0
        ? "border-destructive/50 bg-destructive/5 text-destructive"
        : item.quantity_in_stock <= 5
          ? "border-amber-400/50 bg-amber-400/5 text-amber-600"
          : "border-emerald-400/50 bg-emerald-400/5 text-emerald-600";

    return (
      <div
        key={item.id}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md"
      >
        {/* Image Section with Stock Badge Overlay */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={variation.product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                <Package2 className="size-12" />
                <span className="text-xs font-medium">
                  {t("common.noImage")}
                </span>
              </div>
            </div>
          )}

          {/* Stock Badge Overlay - Top Right */}
          <div className="absolute top-3 right-3">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-semibold shadow-sm backdrop-blur-sm",
                stockTone
              )}
            >
              {stockLabel}
            </Badge>
          </div>

          {/* In Cart Indicator - Top Left */}
          {inCart && inCart.cart_quantity > 0 && (
            <div className="absolute top-3 left-3">
              <Badge
                variant="default"
                className="bg-primary/90 text-primary-foreground shadow-sm backdrop-blur-sm"
              >
                {t("pos.inCart")}: {formatNumber(inCart.cart_quantity, locale)}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          {/* Header with Category */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1">
                {variation.product.name}
              </h3>
              {variation.name && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {variation.name}
                </p>
              )}
            </div>
          </div>

          {/* Price Section - Prominent */}
          <div className="flex items-end justify-between border-t border-b border-border/30 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("products.sellingPrice")}
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(variation.selling_price, storeCurrency, locale)}
              </span>
            </div>

            {/* Category Badge */}
            <Badge variant="outline" className="text-xs shrink-0">
              {variation.product.product_category?.name ??
                t("common.notSpecified")}
            </Badge>
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">
                {t("inventory.inStock")}:
              </span>
              <span className="font-semibold text-foreground">
                {formatNumber(remaining, locale)}
                {variation.unit?.name && ` ${variation.unit.name}`}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs font-mono">
                {variation.barcode}
              </Badge>
              {variation.sku && (
                <Badge variant="secondary" className="text-xs font-mono">
                  SKU: {variation.sku}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-2">
            {inCart ? (
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-10 rounded-xl border-2 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-colors"
                  onClick={() => decrementQuantity(item.id)}
                  disabled={inCart.cart_quantity === 0}
                >
                  <Minus className="size-5" />
                </Button>
                <div className="flex items-center justify-center min-w-[3ch] px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-lg font-bold tabular-nums">
                    {formatNumber(inCart.cart_quantity, locale)}
                  </span>
                </div>
                <Button
                  size="icon"
                  className="size-10 rounded-xl border-2 border-primary shadow-sm transition-all hover:shadow-md active:scale-95"
                  onClick={() => handleAddToCart(item)}
                  disabled={!isService && inCart.cart_quantity >= item.quantity_in_stock}
                >
                  <Plus className="size-5" />
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full rounded-xl font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                onClick={() => handleAddToCart(item)}
                disabled={!isService && item.quantity_in_stock === 0}
              >
                <Plus className="size-5 mr-2" />
                {t("common.add")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderListItem = (item: InventoryItem) => {
    const variation = item.product_variation;
    const inCart = getCartItem(item.id);
    const remaining = item.quantity_in_stock;
    const imageUrl = normalizeImageUrl(
      variation.image_url ?? variation.product.image_url ?? null
    );

    const stockLabel =
      item.quantity_in_stock === 0
        ? t("inventory.outOfStock")
        : item.quantity_in_stock <= 5
          ? t("inventory.lowStock")
          : t("inventory.inStock");
    const stockTone =
      item.quantity_in_stock === 0
        ? "border-destructive/50 bg-destructive/10 text-destructive"
        : item.quantity_in_stock <= 5
          ? "border-amber-400/50 bg-amber-400/10 text-amber-600"
          : "border-emerald-400/50 bg-emerald-400/10 text-emerald-600";

    return (
      <div
        key={item.id}
        className="group flex items-center gap-4 rounded-xl border border-border/40 bg-card/60 p-4 transition hover:border-primary/40 hover:bg-card/80"
      >
        <div className="flex-shrink-0">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted/60">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={variation.product.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/80">
                <Package2 className="size-6" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-semibold text-foreground truncate">
                    {variation.product.name}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs uppercase flex-shrink-0"
                  >
                    {variation.product.product_category?.name ??
                      t("common.notSpecified")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {variation.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="outline" className={stockTone}>
                    {stockLabel}
                  </Badge>
                  <span>
                    {t("inventory.inStock")}: {formatNumber(remaining, locale)}
                  </span>
                  <span>
                    {t("products.barcode")}: {variation.barcode}
                  </span>
                  {variation.sku && <span>SKU: {variation.sku}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(variation.selling_price, storeCurrency, locale)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("pos.inCart")}:{" "}
                {inCart ? formatNumber(inCart.cart_quantity, locale) : "0"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {inCart ? (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => decrementQuantity(item.id)}
                    disabled={inCart.cart_quantity === 0}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="min-w-[2ch] text-center text-sm font-semibold">
                    {formatNumber(inCart.cart_quantity, locale)}
                  </span>
                  <Button
                    size="icon"
                    className="size-8"
                    onClick={() => handleAddToCart(item)}
                    disabled={inCart.cart_quantity >= item.quantity_in_stock}
                  >
                    <Plus className="size-4" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => handleAddToCart(item)}
                  disabled={item.quantity_in_stock === 0}
                >
                  <Plus className="size-4" />
                  {t("common.add")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    if (inventoryQuery.isLoading) {
      return (
        <div
          className={cn(
            "gap-4",
            layoutMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              : "space-y-3"
          )}
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                layoutMode === "grid"
                  ? "h-60 w-full rounded-xl"
                  : "h-24 w-full rounded-xl"
              )}
            />
          ))}
        </div>
      );
    }

    if (filteredInventory.length === 0 && !inventoryQuery.isFetching) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
          <Package2 className="size-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            {t("pos.noInventory")}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("pos.tryDifferentSearch")}
          </p>
        </div>
      );
    }

    return (
      <VirtualizedInventoryList
        items={filteredInventory}
        layoutMode={layoutMode}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        hasNextPage={inventoryQuery.hasNextPage}
        isFetchingNextPage={inventoryQuery.isFetchingNextPage}
        fetchNextPage={inventoryQuery.fetchNextPage}
        scrollContainerRef={scrollContainerRef}
      />
    );
  };

  // Header Content with CSS sticky positioning (GPU-accelerated, no lag)
  const HeaderContent = (
    <div className="sticky top-0 z-40 bg-background border-b border-border/60 shadow-sm">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-col gap-1 min-w-0 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground whitespace-nowrap">
                {t("pos.title")}
              </h2>
            </div>
            <div className="flex gap-3 items-center w-full flex-1">
              <div className="relative flex-1">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("pos.searchProducts", {
                    defaultValue: "Search products, SKU or barcode...",
                  })}
                  className="w-full pl-10 pr-10 h-10"
                />
                <Package2 className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 size-4" />
                {searchQuery ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setSearchQuery("")}
                    aria-label={t("common.clear", { defaultValue: "Clear" })}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>

              {/* Layout Toggle */}
              <ToggleGroup
                type="single"
                value={layoutMode}
                onValueChange={(value) => {
                  if (value) setLayoutMode(value as "grid" | "list");
                }}
                className="flex-shrink-0"
              >
                <ToggleGroupItem
                  value="grid"
                  aria-label="Grid view"
                  className="h-10 w-10"
                >
                  <Grid3X3 className="size-5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  aria-label="List view"
                  className="h-10 w-10"
                >
                  <List className="size-5" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Button
                className="justify-center gap-2 flex-shrink-0 whitespace-nowrap h-10 px-4 lg:hidden"
                onClick={() => setOrderOpen(true)}
              >
                <ShoppingCart className="size-4 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {t("pos.viewOrder", { defaultValue: "View order" })}
                </span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium flex-shrink-0">
                  {formatNumber(cartItemCount, locale)}
                </span>
              </Button>

              <Button
                variant="outline"
                className="justify-center gap-2 flex-shrink-0 whitespace-nowrap h-10 px-4"
                onClick={() => setHistoryOpen(true)}
              >
                <List className="size-4 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {t("pos.history", { defaultValue: "History" })}
                </span>
              </Button>
            </div>
          </div>
          <div>
            <ToggleGroup
              type="single"
              value={activeCategory}
              onValueChange={(value) => {
                if (value) setActiveCategory(value);
              }}
              className="flex flex-wrap gap-2"
            >
              {categories.map((category) => (
                <ToggleGroupItem
                  key={category}
                  value={category}
                  className="capitalize h-8 text-sm px-3"
                >
                  {category === "all" ? t("common.all") : category}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </div>
    </div>
  );

  const handleSidebarCheckout = () => {
    if (isDebtSale) {
      handleCheckout();
    } else {
      setPaymentOpen(true);
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] bg-background relative">
        <div
          ref={scrollContainerRef}
          className="flex-1 flex flex-col pb-12 lg:mr-[400px] overflow-y-auto"
        >
          {/* Sticky Header */}
          {HeaderContent}

          {/* Main Content */}
          <section className="mx-auto w-full max-w-[1600px] px-6 pt-6">
            <div className="pb-10">{renderInventory()}</div>
          </section>
        </div>

        {/* Sticky Sidebar for Desktop */}
        <aside className="hidden lg:block fixed top-16 right-0 h-[calc(100vh-4rem)] w-[400px] border-l border-border/60 bg-background z-20">
          <POSSidebar
            storeCurrency={storeCurrency}
            customers={customers}
            onCheckout={handleSidebarCheckout}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isDebtSale={isDebtSale}
            setIsDebtSale={setIsDebtSale}
          />
        </aside>
      </div>

      <Sheet open={orderOpen} onOpenChange={setOrderOpen}>
        <SheetContent
          side="right"
          className="flex w-full max-w-xl flex-col overflow-hidden border-l border-border/60 p-0"
        >
          <POSSidebar
            storeCurrency={storeCurrency}
            customers={customers}
            onCheckout={() => {
              setOrderOpen(false);
              handleSidebarCheckout();
            }}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isDebtSale={isDebtSale}
            setIsDebtSale={setIsDebtSale}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
        <SheetContent
          side="right"
          className="flex w-full max-w-md flex-col overflow-hidden border-l border-border/60 p-0"
        >
          <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
            <SheetTitle>
              {t("pos.paymentSplitTitle", {
                defaultValue: "Split payment",
              })}
            </SheetTitle>
            <SheetDescription>
              {t("pos.paymentSplitDescription", {
                defaultValue:
                  "Use multiple payment methods to cover the total.",
              })}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("pos.total", { defaultValue: "Total" })}
                </span>
                <span className="font-semibold">
                  {formatCurrency(total, storeCurrency, locale)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {t("pos.paymentSplitHint", {
                  defaultValue:
                    "Add payments (cash, card, etc.) so their total equals the amount due.",
                })}
              </p>

              <div className="space-y-3 text-sm">
                {paymentLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-2"
                  >
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      value={line.method}
                      onChange={(e) =>
                        setPaymentLines((prev) =>
                          prev.map((p) =>
                            p.id === line.id
                              ? {
                                ...p,
                                method: e.target.value as PaymentMethod,
                              }
                              : p
                          )
                        )
                      }
                    >
                      <option value="cash" disabled={!paymentMethods.cash}>
                        {t("pos.cash")}
                      </option>
                      <option value="card" disabled={!paymentMethods.card}>
                        {t("pos.card")}
                      </option>
                      <option
                        value="transfer"
                        disabled={!paymentMethods.transfer}
                      >
                        {t("pos.transfer", { defaultValue: "Bank transfer" })}
                      </option>
                      <option
                        value="dynamic_qr"
                        disabled={!paymentMethods.dynamic_qr}
                      >
                        {t("payment.dynamic_qr", { defaultValue: "Dynamic QR" })}
                      </option>
                      <option value="other" disabled={!paymentMethods.other}>
                        {t("pos.otherPayment", {
                          defaultValue: "Other",
                        })}
                      </option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.amount}
                      onChange={(e) =>
                        setPaymentLines((prev) =>
                          prev.map((p) =>
                            p.id === line.id
                              ? { ...p, amount: e.target.value }
                              : p
                          )
                        )
                      }
                      placeholder="0"
                      className="h-8 flex-1"
                    />
                    {paymentLines.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() =>
                          setPaymentLines((prev) =>
                            prev.filter((p) => p.id !== line.id)
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-2"
                  onClick={() =>
                    setPaymentLines((prev) => [
                      ...prev,
                      {
                        id: String(prev.length + 1),
                        method: "cash",
                        amount: "",
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t("pos.addPayment", { defaultValue: "Add payment" })}
                </Button>

                {(() => {
                  const totalEntered = paymentLines.reduce((sum, line) => {
                    const val = Number.parseFloat(line.amount || "0");
                    return Number.isFinite(val) ? sum + val : sum;
                  }, 0);
                  const remaining = total - totalEntered;
                  return (
                    <div className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("pos.remainingToAllocate", {
                            defaultValue: "Remaining to allocate",
                          })}
                        </span>
                        <span
                          className={
                            remaining === 0
                              ? "font-semibold text-emerald-600"
                              : remaining > 0
                                ? "font-semibold text-amber-600"
                                : "font-semibold text-destructive"
                          }
                        >
                          {formatCurrency(
                            Math.abs(remaining),
                            storeCurrency,
                            locale
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const remaining = Math.max(
                        0,
                        total -
                        paymentLines.reduce(
                          (sum, line) =>
                            sum + (Number.parseFloat(line.amount) || 0),
                          0
                        )
                      );
                      if (remaining > 0) {
                        // Find the first empty line or add a new one
                        const emptyLineIndex = paymentLines.findIndex(
                          (l) => !l.amount
                        );
                        if (emptyLineIndex >= 0) {
                          setPaymentLines((prev) =>
                            prev.map((p, i) =>
                              i === emptyLineIndex
                                ? { ...p, amount: remaining.toString() }
                                : p
                            )
                          );
                        } else {
                          setPaymentLines((prev) => [
                            ...prev,
                            {
                              id: String(prev.length + 1),
                              method: "cash",
                              amount: remaining.toString(),
                            },
                          ]);
                        }
                      }
                    }}
                  >
                    {t("pos.fillRemaining", { defaultValue: "Fill remaining" })}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setPaymentLines([
                        { id: "1", method: "cash", amount: total.toString() },
                      ]);
                    }}
                  >
                    {t("pos.exactCash", { defaultValue: "Exact Cash" })}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setPaymentOpen(false)}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                const parsed = paymentLines
                  .map((line) => ({
                    ...line,
                    value: Number.parseFloat(line.amount || "0"),
                  }))
                  .filter(
                    (l) => Number.isFinite(l.value) && l.value > 0
                  ) as (PaymentLine & { value: number })[];
                const totalEntered = parsed.reduce(
                  (sum, line) => sum + line.value,
                  0
                );
                if (
                  parsed.length === 0 ||
                  Math.abs(totalEntered - total) > 0.01
                ) {
                  toast.error(t("pos.paymentSplitInvalid"));
                  return;
                }
                handleCheckout(
                  parsed.map((line) => ({
                    amount: line.value,
                    payment_method: line.method,
                    currency: storeCurrency,
                    received_at: new Date().toISOString(),
                  }))
                );
                setPaymentOpen(false);
              }}
              disabled={cart.length === 0 || isProcessing}
            >
              {t("pos.confirmPayment", { defaultValue: "Confirm payment" })}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-md border-l border-border/60 p-0"
        >
          <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
            <SheetTitle>
              {t("pos.history", { defaultValue: "History" })}
            </SheetTitle>
            <SheetDescription>
              {t("pos.historyDescription", {
                defaultValue: "Recent receipts from this session.",
              })}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {lastReceipts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                {t("pos.noHistory", { defaultValue: "No recent receipts." })}
              </p>
            ) : (
              <div className="space-y-4">
                {lastReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {new Intl.DateTimeFormat(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }).format(new Date(receipt.createdAt))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(receipt.total, storeCurrency, locale)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLastReceipt(receipt);
                        setReceiptOpen(true);
                      }}
                    >
                      {t("pos.view", { defaultValue: "View" })}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={receiptOpen} onOpenChange={setReceiptOpen}>
        <SheetContent
          side="right"
          className="flex w-full max-w-md flex-col overflow-hidden border-l border-border/60 p-0"
        >
          <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
            <SheetTitle>
              {t("pos.receipt", { defaultValue: "Receipt" })}
            </SheetTitle>
            <SheetDescription>
              {t("pos.receiptDescription", {
                defaultValue: "Printable summary of the last sale.",
              })}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {lastReceipt ? (
              <div
                id="receipt-content"
                ref={receiptRef}
                className="mx-auto max-w-sm rounded-lg border border-dashed border-border/60 bg-card p-4 text-xs font-mono text-foreground"
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(
                    renderReceiptMarkdown(lastReceipt, {
                      formatCurrency: (amount) =>
                        formatCurrency(amount, storeCurrency, locale),
                      locale,
                      currency: storeCurrency,
                    })
                  ),
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("pos.noReceipt", {
                  defaultValue: "No receipt available.",
                })}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setReceiptOpen(false)}
            >
              {t("common.close", { defaultValue: "Close" })}
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handlePrintReceipt}
              disabled={!lastReceipt}
            >
              {t("pos.printReceipt", { defaultValue: "Print" })}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
