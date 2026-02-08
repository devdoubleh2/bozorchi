import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  MoreHorizontal,
  Search,
  RotateCcw,
  Plus,
  Minus,
  Package2,
  GripVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Pencil,
} from "lucide-react";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  useFlattenedInventoryData,
  type FlattenedInventoryItem,
  type StockStatus,
} from "@/hooks/useInventoryData";
import { toast } from 'sonner'
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { formatPrice, parseApiError } from "@/lib/utils";
import { useInventoryMutations } from "@/hooks/useInventoryMutations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const STOCK_STATUS_OPTIONS: StockStatus[] = ["good", "low", "out"];

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

// Context for drag handle
interface RowDraggableContextType {
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
}

const RowDraggableContext = createContext<RowDraggableContextType>({
  attributes: {
    role: "button",
    tabIndex: 0,
    "aria-disabled": false,
    "aria-pressed": undefined,
    "aria-roledescription": "",
    "aria-describedby": "",
  },
  listeners: undefined,
});

// Drag handle component
function DragHandle() {
  const { attributes, listeners } = useContext(RowDraggableContext);

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 cursor-grab touch-none text-muted-foreground hover:bg-transparent active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// Draggable row component
interface DraggableRowProps {
  item: FlattenedInventoryItem;
  isSelected: boolean;
  children: React.ReactNode;
}

const DraggableRow = ({ item, isSelected, children }: DraggableRowProps) => {
  const {
    transform,
    transition,
    setNodeRef,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: item.id,
  });

  return (
    <TableRow
      data-state={isSelected && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Translate.toString(transform),
        transition: transition,
      }}
    >
      <RowDraggableContext.Provider value={{ attributes, listeners }}>
        {children}
      </RowDraggableContext.Provider>
    </TableRow>
  );
};

type SortDirection = "asc" | "desc" | null;

interface SortConfig {
  key: keyof FlattenedInventoryItem | null;
  direction: SortDirection;
}

const InventoryTable = () => {
  const { t } = useTranslation();
  const { user, userStore, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // Get store ID from auth state - single source of truth
  const storeId = userStore?.store_id;

  const {
    filteredFlattenedItems,
    isLoading: isInventoryLoading,
    searchQuery,
    setSearchQuery,
    setFilters,
    refetch,
    storeCurrency,
  } = useFlattenedInventoryData();
  const { deleteProduct, bulkDeleteProducts } = useInventoryMutations();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedStockStatuses, setSelectedStockStatuses] = useState<
    StockStatus[]
  >([]);
  const [data, setData] = useState<FlattenedInventoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [deleteItem, setDeleteItem] = useState<FlattenedInventoryItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkTransferSheet, setShowBulkTransferSheet] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedTransferStore, setSelectedTransferStore] =
    useState<string>("");
  // Robust transfer state - quantities managed in React instead of DOM
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({});
  // Single item transfer state
  const [singleTransferItem, setSingleTransferItem] = useState<FlattenedInventoryItem | null>(null);

  // Update data when filtered items change
  useEffect(() => {
    setData((prev) => {
      const prevIds = new Set(prev.map((item) => item.id));
      const newIds = new Set(filteredFlattenedItems.map((item) => item.id));

      if (
        prevIds.size !== newIds.size ||
        !filteredFlattenedItems.every((item) => prevIds.has(item.id))
      ) {
        return filteredFlattenedItems;
      }

      // Preserve order but update content
      const newItemMap = new Map(
        filteredFlattenedItems.map((item) => [item.id, item])
      );
      return prev.map((item) => newItemMap.get(item.id)!);
    });
  }, [filteredFlattenedItems]);

  // Queries for filter dropdowns - enabled only when storeId is available
  const categoriesQuery = useQuery({
    queryKey: ["product-categories", storeId],
    queryFn: async () => {
      const response = await api.get<{
        productCategories: Array<{ id: string; name: string }>;
      }>("/api/product-categories");
      return response.productCategories ?? [];
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 60,
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", storeId],
    queryFn: async () => {
      const response = await api.get<{
        suppliers: Array<{ id: string; name: string }>;
      }>(`/api/suppliers?store_id=${encodeURIComponent(storeId!)}`);
      return response.suppliers;
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 15,
  });

  // Check if user is admin/owner to enable stores query (matches StoreSwitcher)
  const isAdmin = user?.membership?.role === "admin" || !!user?.owned_organization;

  // Fetch all stores with higher limit (use different cache key than StoreSwitcher to ensure limit works)
  const allStoresQuery = useQuery({
    queryKey: ["all-stores-for-transfer"],
    queryFn: async () => {
      const response = await api.get<{
        stores: Array<{ id: string; name: string }>;
      }>("/api/stores?limit=100");
      return response.stores ?? [];
    },
    enabled: !!isAdmin && !!storeId,
    staleTime: 1000 * 60 * 30,
  });

  // Filter out current store for transfer dropdown
  const otherStoresData = useMemo(() => {
    const allStores = allStoresQuery.data ?? [];
    return allStores.filter((store) => store.id !== storeId);
  }, [allStoresQuery.data, storeId]);

  // Create a "storesQuery" compatible object for the rest of the component
  const storesQuery = {
    ...allStoresQuery,
    data: otherStoresData,
  };

  // Loading state: wait for auth first, then data queries
  // If auth is loading, show loading state
  // If auth is done but no store, don't show loading (show empty state instead)
  // If auth is done and store exists, check query loading states
  const isLoading = isAuthLoading || (
    !!storeId && (
      isInventoryLoading ||
      categoriesQuery.isLoading ||
      suppliersQuery.isLoading
    )
  );

  const selectedCategoryNames = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    return selectedCategories
      .map((id) => categoriesQuery.data?.find((cat) => cat.id === id)?.name)
      .filter((name): name is string => !!name);
  }, [selectedCategories, categoriesQuery.data]);

  const selectedSupplierNames = useMemo(() => {
    if (selectedSuppliers.length === 0) return [];
    return selectedSuppliers
      .map((id) => suppliersQuery.data?.find((sup) => sup.id === id)?.name)
      .filter((name): name is string => !!name);
  }, [selectedSuppliers, suppliersQuery.data]);

  // Update filters in the hook when local filter state changes
  useEffect(() => {
    const newFilters = {
      categoryNames: selectedCategoryNames,
      supplierNames: selectedSupplierNames,
      stockStatus: selectedStockStatuses,
      colors: [],
      unitValues: [],
      productCategoryColors: [],
      priceRange: null,
    };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  }, [
    selectedCategoryNames,
    selectedSupplierNames,
    selectedStockStatuses,
    setFilters,
  ]);

  const getStockStatusTranslation = (status: string) => {
    switch (status) {
      case "good":
        return t("inventory.stockStatus.good");
      case "low":
        return t("inventory.stockStatus.low");
      case "out":
        return t("inventory.stockStatus.out");
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: StockStatus) => {
    switch (status) {
      case "good":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
      case "low":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
      case "out":
        return "bg-destructive/10 text-destructive";
      default:
        return "";
    }
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      if (!deleteItem) return;
      await deleteProduct.mutateAsync(deleteItem.productId);
      toast.success(t("products.productDeletedSuccessfully"));
      setDeleteItem(null);
    } catch (error) {
      console.error("Product delete failed", error);
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("products.productDeleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteItem, refetch, t]);

  // Bulk Actions Logic
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      // Get unique product IDs from selected items
      const selectedItems = data.filter((item) => selectedIds.has(item.id));
      const productIds = Array.from(new Set(selectedItems.map((item) => item.productId)));

      // Use bulk delete mutation instead of individual deletes
      await bulkDeleteProducts.mutateAsync(productIds);

      toast.success(t("inventory.bulkDeleteSuccess", {
        defaultValue: "Products deleted successfully",
      }));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error("Bulk delete failed", error);
      toast.error(
        t("inventory.bulkDeleteError", {
          defaultValue: "Failed to delete products",
        })
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkRestock = () => {
    const selectedItems = data.filter((item) => selectedIds.has(item.id));
    navigate("/inventory/restock", {
      state: { selectedVariations: selectedItems },
    });
  };

  // Navigate to bulk edit page with selected items
  const handleBulkEdit = useCallback(() => {
    const selectedItems = data.filter((item) => selectedIds.has(item.id));
    navigate("/inventory/bulk-edit", {
      state: { selectedItems },
    });
  }, [data, selectedIds, navigate]);

  // Sorting Logic
  const handleSort = (key: keyof FlattenedInventoryItem) => {
    setSortConfig((current) => {
      if (current.key === key) {
        if (current.direction === "asc") return { key, direction: "desc" };
        if (current.direction === "desc") return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!] ?? "";
      const bValue = b[sortConfig.key!] ?? "";

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection Logic
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map((item) => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.has(item.id));
  const isSomeSelected =
    paginatedData.some((item) => selectedIds.has(item.id)) && !isAllSelected;

  // Drag and Drop Logic
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = data.findIndex((item) => item.id === active.id);
        const newIndex = data.findIndex((item) => item.id === over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSuppliers.length > 0 ||
    selectedStockStatuses.length > 0;
  const activeFilterCount =
    selectedCategories.length +
    selectedSuppliers.length +
    selectedStockStatuses.length;

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSuppliers([]);
    setSelectedStockStatuses([]);
    setSearchQuery("");
  };

  const SortIcon = ({
    columnKey,
  }: {
    columnKey: keyof FlattenedInventoryItem;
  }) => {
    if (sortConfig.key !== columnKey)
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    if (sortConfig.direction === "asc")
      return <ArrowUp className="ml-2 h-4 w-4" />;
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Empty state when no store is selected
  if (!storeId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
        <Package2 className="h-16 w-16 text-muted-foreground/50" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            {t("inventory.noStoreSelected", { defaultValue: "No Store Selected" })}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("inventory.noStoreSelectedDescription", {
              defaultValue: "Please select a store from the navigation to view and manage your inventory.",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col w-full max-w-full min-w-0">
      <header className="border-b px-4 py-3 md:px-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight md:text-xl">
              {t("inventory.title", { defaultValue: "Inventory" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("inventory.subtitle", {
                defaultValue: "Track stock levels and pricing in one view.",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>{t("inventory.add", { defaultValue: "Add" })}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => navigate("/inventory/products/new")}
                >
                  {t("inventory.newProduct", { defaultValue: "New Product" })}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/inventory/products/bulk")}
                >
                  {t("inventory.bulkAdd", {
                    defaultValue: "Bulk Product Upload",
                  })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6 max-w-full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border bg-card max-w-full">
          <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="px-2 py-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                  {selectedIds.size > 0 && (
                    <Badge variant="default" className="gap-1">
                      <span className="text-xs font-semibold">
                        {selectedIds.size}
                      </span>
                      {t("inventory.selected", { defaultValue: "Selected" })}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleBulkEdit}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        {t("inventory.bulkEdit", { defaultValue: "Edit" })}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleBulkRestock}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {t("inventory.restock", { defaultValue: "Restock" })}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowBulkTransferSheet(true)}

                        className="gap-2"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        {t("inventory.transfer", { defaultValue: "Transfer" })}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowBulkDeleteConfirm(true)}

                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("common.delete", { defaultValue: "Delete" })}
                      </Button>
                    </>
                  )}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("common.reset", { defaultValue: "Reset" })}
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[220px] flex-1">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={t("inventory.searchPlaceholder", {
                        defaultValue: "Search by product, SKU...",
                      })}
                      className="h-10 pl-9"
                    />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 min-w-[160px]"
                    >
                      {selectedStockStatuses.length > 0
                        ? `${t("inventory.filters.stockStatus", {
                          defaultValue: "Stock Status",
                        })} (${selectedStockStatuses.length})`
                        : t("inventory.filters.stockStatus", {
                          defaultValue: "Stock Status",
                        })}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>
                      {t("inventory.filters.stockStatus", {
                        defaultValue: "Stock Status",
                      })}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STOCK_STATUS_OPTIONS.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={selectedStockStatuses.includes(status)}
                        onCheckedChange={(checked) => {
                          setSelectedStockStatuses((prev) =>
                            checked
                              ? [...prev, status]
                              : prev.filter((s) => s !== status)
                          );
                        }}
                      >
                        {getStockStatusTranslation(status)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 min-w-[180px]"
                    >
                      {selectedCategories.length > 0
                        ? `${t("inventory.filters.category", {
                          defaultValue: "Category",
                        })} (${selectedCategories.length})`
                        : t("inventory.filters.allCategories", {
                          defaultValue: "All Categories",
                        })}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>
                      {t("inventory.filters.category", {
                        defaultValue: "Category",
                      })}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-48">
                      {categoriesQuery.data?.map((category) => (
                        <DropdownMenuCheckboxItem
                          key={category.id}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            setSelectedCategories((prev) =>
                              checked
                                ? [...prev, category.id]
                                : prev.filter((id) => id !== category.id)
                            );
                          }}
                        >
                          {category.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 min-w-[180px]"
                    >
                      {selectedSuppliers.length > 0
                        ? `${t("inventory.filters.supplier", {
                          defaultValue: "Supplier",
                        })} (${selectedSuppliers.length})`
                        : t("inventory.filters.allSuppliers", {
                          defaultValue: "All Suppliers",
                        })}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>
                      {t("inventory.filters.supplier", {
                        defaultValue: "Supplier",
                      })}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-48">
                      {suppliersQuery.data?.map((supplier) => (
                        <DropdownMenuCheckboxItem
                          key={supplier.id}
                          checked={selectedSuppliers.includes(supplier.id)}
                          onCheckedChange={(checked) => {
                            setSelectedSuppliers((prev) =>
                              checked
                                ? [...prev, supplier.id]
                                : prev.filter((id) => id !== supplier.id)
                            );
                          }}
                        >
                          {supplier.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[40px] text-center">
                      <Checkbox
                        checked={
                          isAllSelected ||
                          (isSomeSelected ? "indeterminate" : false)
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("displayName")}
                      >
                        {t("inventory.table.name")}
                        <SortIcon columnKey="displayName" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("barcode")}
                      >
                        {t("inventory.table.barcode", { defaultValue: "Barcode" })}
                        <SortIcon columnKey="barcode" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("sku")}
                      >
                        {t("inventory.table.sku", { defaultValue: "SKU" })}
                        <SortIcon columnKey="sku" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("categoryName")}
                      >
                        {t("inventory.table.category")}
                        <SortIcon columnKey="categoryName" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("inventory.table.stockStatus")}</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("inStock")}
                      >
                        {t("inventory.table.stock")}
                        <SortIcon columnKey="inStock" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("sellingPrice")}
                      >
                        {t("inventory.table.sellingPrice")}
                        <SortIcon columnKey="sellingPrice" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("supplierPrice")}
                      >
                        {t("inventory.table.supplierPrice")}
                        <SortIcon columnKey="supplierPrice" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("unitCost")}
                      >
                        {t("inventory.table.unitCost")}
                        <SortIcon columnKey="unitCost" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("inventory.table.unit")}</TableHead>
                    <TableHead>{t("inventory.table.supplier")}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={paginatedData.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={15} className="h-24 text-center">
                          {t("common.noResults", {
                            defaultValue: "No results found.",
                          })}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item) => (
                        <DraggableRow
                          key={item.id}
                          item={item}
                          isSelected={selectedIds.has(item.id)}
                        >
                          <TableCell>
                            <DragHandle />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={(checked) =>
                                toggleSelectRow(item.id, !!checked)
                              }
                              aria-label="Select row"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted/60">
                              {normalizeImageUrl(item.displayImageUrl) ? (
                                <img
                                  src={
                                    normalizeImageUrl(item.displayImageUrl) ??
                                    undefined
                                  }
                                  alt={item.displayName}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Package2 className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.displayName}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {item.barcode || "-"}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {item.sku || "-"}
                          </TableCell>
                          <TableCell>{item.categoryName}</TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusBadgeClass(item.stockStatus)}
                            >
                              {getStockStatusTranslation(item.stockStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.inStock}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(item.sellingPrice, storeCurrency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(item.supplierPrice, storeCurrency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(item.unitCost, storeCurrency)}
                          </TableCell>
                          <TableCell>{item.unitName}</TableCell>
                          <TableCell>{item.supplierName || "-"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="flex size-8"
                                  size="icon"
                                  aria-label={t("inventory.table.openMenu")}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                  {t("inventory.table.actions")}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    navigate(
                                      `/inventory/products/edit/${item.productId}`
                                    )
                                  }
                                >
                                  {t("inventory.table.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => setDeleteItem(item)}
                                >
                                  {t("inventory.table.delete")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    navigate(
                                      `/inventory/restock/${item.productId}`,
                                      {
                                        state: {
                                          restockProductName: item.productName,
                                        },
                                      }
                                    );
                                  }}
                                >
                                  {t("inventory.restock", {
                                    defaultValue: "Restock",
                                  })}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setTransferQuantities({});
                                    setSingleTransferItem(item);
                                  }}
                                  disabled={!storesQuery.data || storesQuery.data.length === 0}
                                >
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  {t("inventory.transferTo", {
                                    defaultValue: "Transfer to...",
                                  })}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    navigate(
                                      `/inventory/write-off/${item.productId}`
                                    )
                                  }
                                  className="text-destructive focus:text-destructive"
                                >
                                  {t("inventory.writeOff", {
                                    defaultValue: "Write Off",
                                  })}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </DraggableRow>
                      ))
                    )}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {t("common.pagination.showing", {
                start: (currentPage - 1) * pageSize + 1,
                end: Math.min(currentPage * pageSize, sortedData.length),
                total: sortedData.length,
                defaultValue: `Showing ${(currentPage - 1) * pageSize + 1
                  } to ${Math.min(
                    currentPage * pageSize,
                    sortedData.length
                  )} of ${sortedData.length} entries`,
              })}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">
                  {t("common.pagination.rowsPerPage", {
                    defaultValue: "Rows per page",
                  })}
                </p>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {PAGE_SIZE_OPTIONS.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                {t("common.pagination.pageOf", {
                  current: currentPage,
                  total: totalPages,
                  defaultValue: `Page ${currentPage} of ${totalPages}`,
                })}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("products.deleteProductTitle", {
                defaultValue: "Delete Product",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("products.deleteProductDescription", {
                defaultValue:
                  "Are you sure you want to delete this product? This action cannot be undone.",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteItem(null)}
              disabled={isDeleting}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? t("common.deleting", { defaultValue: "Deleting..." })
                : t("common.delete", { defaultValue: "Delete" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("inventory.bulkDeleteConfirmTitle", {
                defaultValue: "Delete Selected Products?",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("inventory.bulkDeleteConfirmDescription", {
                defaultValue:
                  "This will permanently delete the selected products. This action cannot be undone.",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("common.delete", { defaultValue: "Delete" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={showBulkTransferSheet || singleTransferItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowBulkTransferSheet(false);
            setSingleTransferItem(null);
            setSelectedTransferStore("");
            setTransferQuantities({});
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-4">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              {t("inventory.transferItems", {
                defaultValue: "Transfer Stock",
              })}
            </SheetTitle>
            <SheetDescription>
              {t("inventory.specifyQuantityForEachItem", {
                defaultValue:
                  "Specify how much of each item you want to transfer",
              })}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* No stores available warning */}
            {(!storesQuery.data || storesQuery.data.length === 0) && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t("inventory.noOtherStores", {
                      defaultValue: "No Other Stores Available",
                    })}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t("inventory.noOtherStoresDescription", {
                      defaultValue:
                        "Your organization needs at least 2 stores to transfer stock between them.",
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Store Selection */}
            {storesQuery.data && storesQuery.data.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("inventory.transferTo", {
                    defaultValue: "Transfer To",
                  })}
                </label>
                <Select
                  value={selectedTransferStore}
                  onValueChange={setSelectedTransferStore}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("inventory.selectStore", {
                        defaultValue: "Select destination store",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {storesQuery.data.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Items List Header with Actions */}
            {(() => {
              const itemsToTransfer = singleTransferItem
                ? [singleTransferItem]
                : data.filter((item) => selectedIds.has(item.id));

              // Initialize quantities when items change
              if (Object.keys(transferQuantities).length === 0 && itemsToTransfer.length > 0) {
                const initial: Record<string, number> = {};
                itemsToTransfer.forEach((item) => {
                  initial[item.id] = Math.min(1, item.inStock ?? 0);
                });
                // Use setTimeout to avoid state update during render
                setTimeout(() => setTransferQuantities(initial), 0);
              }

              return (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {t("inventory.items", {
                        defaultValue: "Items",
                      })} ({itemsToTransfer.length})
                    </label>
                    {itemsToTransfer.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const maxQuantities: Record<string, number> = {};
                          itemsToTransfer.forEach((item) => {
                            maxQuantities[item.id] = item.inStock ?? 0;
                          });
                          setTransferQuantities(maxQuantities);
                        }}
                        className="text-xs h-7"
                      >
                        {t("inventory.setAllToMax", {
                          defaultValue: "Set All to Max",
                        })}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {itemsToTransfer.map((item) => {
                      const quantity = transferQuantities[item.id] ?? 0;
                      const maxStock = item.inStock ?? 0;
                      const isOverMax = quantity > maxStock;
                      const isZero = quantity === 0;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-lg border p-3 bg-card space-y-3 ${isOverMax || isZero ? "border-amber-400 dark:border-amber-600" : ""
                            }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Product Image */}
                              <div className="h-10 w-10 rounded-md border bg-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {normalizeImageUrl(item.displayImageUrl) ? (
                                  <img
                                    src={normalizeImageUrl(item.displayImageUrl) ?? undefined}
                                    alt={item.displayName}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <Package2 className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.variationName || "Default"}
                                  {item.barcode && ` • ${item.barcode}`}
                                </p>
                              </div>
                            </div>
                            {/* Remove item button (only for bulk transfer) */}
                            {!singleTransferItem && itemsToTransfer.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const newSelected = new Set(selectedIds);
                                  newSelected.delete(item.id);
                                  setSelectedIds(newSelected);
                                  const newQuantities = { ...transferQuantities };
                                  delete newQuantities[item.id];
                                  setTransferQuantities(newQuantities);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div className="text-xs text-muted-foreground">
                              {t("inventory.availableQuantity", {
                                defaultValue: "Available",
                              })}
                              : <span className="font-medium">{maxStock}</span> {item.unitName}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setTransferQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1),
                                  }));
                                }}
                                disabled={quantity <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min={0}
                                max={maxStock}
                                value={quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setTransferQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: val,
                                  }));
                                }}
                                className="w-16 h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setTransferQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: Math.min(maxStock, (prev[item.id] ?? 0) + 1),
                                  }));
                                }}
                                disabled={quantity >= maxStock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs px-2"
                                onClick={() => {
                                  setTransferQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: maxStock,
                                  }));
                                }}
                                disabled={quantity === maxStock}
                              >
                                {t("common.max", { defaultValue: "Max" })}
                              </Button>
                            </div>
                          </div>

                          {/* Validation warnings */}
                          {isOverMax && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {t("inventory.quantityExceedsStock", {
                                defaultValue: "Quantity exceeds available stock",
                              })}
                            </p>
                          )}
                          {isZero && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {t("inventory.zeroQuantitySkipped", {
                                defaultValue: "This item will be skipped (quantity is 0)",
                              })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Transfer Summary */}
                  {selectedTransferStore && (
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                      <p className="text-sm font-medium">
                        {t("inventory.transferSummary", {
                          defaultValue: "Transfer Summary",
                        })}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          {t("inventory.destinationStore", { defaultValue: "Destination" })}:{" "}
                          <span className="font-medium text-foreground">
                            {storesQuery.data?.find((s) => s.id === selectedTransferStore)?.name}
                          </span>
                        </p>
                        <p>
                          {t("inventory.totalItems", { defaultValue: "Total items" })}:{" "}
                          <span className="font-medium text-foreground">
                            {Object.values(transferQuantities).filter((q) => q > 0).length}
                          </span>
                        </p>
                        <p>
                          {t("inventory.totalQuantity", { defaultValue: "Total quantity" })}:{" "}
                          <span className="font-medium text-foreground">
                            {Object.values(transferQuantities).reduce((sum, q) => sum + Math.max(0, q), 0)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <SheetFooter className="gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkTransferSheet(false);
                setSingleTransferItem(null);
                setSelectedTransferStore("");
                setTransferQuantities({});
              }}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              onClick={async () => {
                if (!selectedTransferStore) {
                  toast.error(
                    t("inventory.selectStoreToProceed", {
                      defaultValue: "Please select a destination store",
                    })
                  );
                  return;
                }

                // Validate quantities
                const itemsToTransfer = singleTransferItem
                  ? [singleTransferItem]
                  : data.filter((item) => selectedIds.has(item.id));

                const validItems = itemsToTransfer.filter((item) => {
                  const qty = transferQuantities[item.id] ?? 0;
                  const maxStock = item.inStock ?? 0;
                  return qty > 0 && qty <= maxStock;
                });

                if (validItems.length === 0) {
                  toast.error(
                    t("inventory.noValidItemsToTransfer", {
                      defaultValue: "No valid items to transfer. Check quantities.",
                    })
                  );
                  return;
                }

                setIsTransferring(true);
                try {
                  const transferData = validItems.map((item) => ({
                    variationId: item.id,
                    quantity: transferQuantities[item.id] ?? 0,
                  }));

                  // Call transfer API
                  await api.post("/api/inventory/transfer", {
                    destinationStoreId: selectedTransferStore,
                    items: transferData,
                  });

                  toast.success(
                    t("inventory.transferSuccess", {
                      defaultValue: "Items transferred successfully",
                    })
                  );

                  // Clear state
                  setSelectedIds(new Set());
                  setSelectedTransferStore("");
                  setShowBulkTransferSheet(false);
                  setSingleTransferItem(null);
                  setTransferQuantities({});

                  // Refresh inventory data
                  await refetch();
                } catch (error) {
                  const parsedError = parseApiError(error);
                  toast.error(
                    parsedError.message ||
                    t("inventory.transferFailed", {
                      defaultValue: "Failed to transfer items",
                    })
                  );
                  console.error("Transfer failed:", error);
                } finally {
                  setIsTransferring(false);
                }
              }}
              disabled={
                isTransferring ||
                !selectedTransferStore ||
                Object.values(transferQuantities).filter((q) => q > 0).length === 0
              }
              className="gap-2"
            >
              {isTransferring && <Loader2 className="h-4 w-4 animate-spin" />}
              <ArrowRightLeft className="h-4 w-4" />
              {t("inventory.proceedToTransfer", {
                defaultValue: "Transfer",
              })}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default InventoryTable;
