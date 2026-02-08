import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  Search,
  ScanBarcode,
  Package2,
  Check,
  Layers,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type AuditType = "full" | "cycle";

interface ProductVariation {
  id: string;
  name: string;
  barcode: string;
  product: {
    id: string;
    name: string;
    product_category?: {
      id: string;
      name: string;
    };
  };
  inventory?: {
    quantity_in_stock: number;
  };
}

interface InventoryItem {
  id: string;
  product_variation_id: string;
  quantity_in_stock: number;
  product_variation: ProductVariation;
}

interface InventoryResponse {
  inventory: InventoryItem[];
  pagination?: {
    total: number;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function NewAuditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getStore } = useAuth();

  // State
  const [auditType, setAuditType] = useState<AuditType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: storeData } = useQuery({
    queryKey: ["store"],
    queryFn: getStore,
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeData?.store?.id;

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["product-categories", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const response = await api.get<{ productCategories: Category[] }>("/api/product-categories");
      return response.productCategories ?? [];
    },
    enabled: !!storeId,
  });

  // Fetch inventory
  const { data: inventoryResponse, isLoading: isInventoryLoading } = useQuery({
    queryKey: ["inventory", storeId],
    queryFn: async () => {
      if (!storeId) return { inventory: [] };
      const params = new URLSearchParams({
        storeId,
        limit: "1000",
      });
      const response = await api.get<InventoryResponse>(
        `/api/inventory?${params.toString()}`
      );
      return response;
    },
    enabled: !!storeId,
  });

  const inventoryItems = inventoryResponse?.inventory || [];
  const categories = categoriesData || [];

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, InventoryItem[]>();

    inventoryItems.forEach((item) => {
      const categoryId = item.product_variation.product.product_category?.id || "uncategorized";
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)!.push(item);
    });

    return grouped;
  }, [inventoryItems]);

  // Filter items based on search, selected categories, and audit type
  const filteredItems = useMemo(() => {
    let items = inventoryItems;

    // For cycle count, filter by selected categories
    if (auditType === "cycle" && selectedCategories.size > 0) {
      items = items.filter((item) => {
        const categoryId = item.product_variation.product.product_category?.id || "uncategorized";
        return selectedCategories.has(categoryId);
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.product_variation.product.name.toLowerCase().includes(query) ||
          item.product_variation.name.toLowerCase().includes(query) ||
          item.product_variation.barcode.toLowerCase().includes(query)
      );
    }

    return items;
  }, [inventoryItems, searchQuery, selectedCategories, auditType]);

  const selectedItemsList = useMemo(() => {
    return Array.from(selectedItems)
      .map((id) => inventoryItems.find((item) => item.id === id))
      .filter(Boolean) as InventoryItem[];
  }, [selectedItems, inventoryItems]);

  const totalExpectedCount = selectedItemsList.reduce(
    (sum, item) => sum + (item.quantity_in_stock || 0),
    0
  );

  // Auto-select all items when Full Count is selected
  useEffect(() => {
    if (auditType === "full") {
      setSelectedItems(new Set(inventoryItems.map((item) => item.id)));
      setSelectedCategories(new Set());
    }
  }, [auditType, inventoryItems]);

  // When categories are selected in cycle count, auto-select those items
  useEffect(() => {
    if (auditType === "cycle" && selectedCategories.size > 0) {
      const itemsInCategories = inventoryItems.filter((item) => {
        const categoryId = item.product_variation.product.product_category?.id || "uncategorized";
        return selectedCategories.has(categoryId);
      });
      setSelectedItems(new Set(itemsInCategories.map((item) => item.id)));
    } else if (auditType === "cycle" && selectedCategories.size === 0) {
      setSelectedItems(new Set());
    }
  }, [selectedCategories, auditType, inventoryItems]);

  // Handle barcode scan
  const handleBarcodeScan = useCallback(() => {
    if (!barcodeInput.trim()) return;

    const foundItem = inventoryItems.find(
      (item) => item.product_variation.barcode.toLowerCase() === barcodeInput.toLowerCase()
    );

    if (foundItem) {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.add(foundItem.id);
        return newSet;
      });
      toast.success(
        t("inventory.itemAddedToAudit", {
          defaultValue: `${foundItem.product_variation.product.name} added`,
        })
      );
    } else {
      toast.error(
        t("inventory.barcodeNotFound", { defaultValue: "Barcode not found" })
      );
    }

    setBarcodeInput("");
    barcodeInputRef.current?.focus();
  }, [barcodeInput, inventoryItems, t]);

  // Mutation to create audit
  const createAuditMutation = useMutation({
    mutationFn: async () => {
      if (selectedItemsList.length === 0) {
        throw new Error(
          t("inventory.selectAtLeastOne", {
            defaultValue: "Please select at least one item",
          })
        );
      }

      // Create the audit
      const auditResponse = await api.post<{ data: { audit: { id: string } } }>(
        `/api/audit/start`,
        {
          notes: auditType === "full" ? "Full inventory count" : "Cycle count",
        }
      );

      const auditId = auditResponse.data.audit.id;

      // Add items in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < selectedItemsList.length; i += batchSize) {
        const batch = selectedItemsList.slice(i, i + batchSize);
        await Promise.all(
          batch.map((item) =>
            api.put(`/api/audit/${auditId}/item`, {
              product_variation_id: item.product_variation_id,
              actual_quantity: item.quantity_in_stock,
            })
          )
        );
      }

      return { id: auditId };
    },
    onSuccess: (data) => {
      toast.success(
        t("inventory.auditCreated", {
          defaultValue: "Audit created successfully",
        })
      );
      navigate(`/inventory/audits/${data.id}`);
    },
    onError: (error) => {
      toast.error(
        (error as Error).message ||
        t("inventory.auditCreateFailed", {
          defaultValue: "Failed to create audit",
        })
      );
    },
  });

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(itemId);
      } else {
        newSelected.delete(itemId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAllFiltered = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        filteredItems.forEach((item) => newSet.add(item.id));
        return newSet;
      });
    } else {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        filteredItems.forEach((item) => newSet.delete(item.id));
        return newSet;
      });
    }
  }, [filteredItems]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const handleCreateAudit = async () => {
    setIsSubmitting(true);
    try {
      await createAuditMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllFilteredSelected = filteredItems.length > 0 &&
    filteredItems.every((item) => selectedItems.has(item.id));
  const isSomeFilteredSelected = filteredItems.some((item) => selectedItems.has(item.id)) &&
    !isAllFilteredSelected;

  if (isInventoryLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step 1: Select Audit Type
  if (!auditType) {
    return (
      <div className="flex h-full min-h-0 flex-col w-full max-w-full min-w-0">
        <header className="border-b px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/inventory/audits")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold md:text-xl">
                {t("inventory.newAudit", { defaultValue: "New Inventory Audit" })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("inventory.selectAuditType", {
                  defaultValue: "Choose the type of count you want to perform",
                })}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto grid gap-4 md:grid-cols-2">
            {/* Full Count Card */}
            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-primary hover:shadow-md",
                "group relative overflow-hidden"
              )}
              onClick={() => setAuditType("full")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <ClipboardList className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {t("inventory.fullCount", { defaultValue: "Full Count" })}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {t("inventory.fullCountDesc", {
                    defaultValue:
                      "Count all items in your inventory. Best for comprehensive stock verification.",
                  })}
                </CardDescription>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Package2 className="h-4 w-4 mr-2" />
                  {t("inventory.itemCount", {
                    count: inventoryItems.length,
                    defaultValue: `${inventoryItems.length} items`,
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cycle Count Card */}
            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-primary hover:shadow-md",
                "group relative overflow-hidden"
              )}
              onClick={() => setAuditType("cycle")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2.5">
                    <Layers className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {t("inventory.cycleCount", { defaultValue: "Cycle Count" })}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {t("inventory.cycleCountDesc", {
                    defaultValue:
                      "Count specific categories or items. Ideal for regular spot checks.",
                  })}
                </CardDescription>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Layers className="h-4 w-4 mr-2" />
                  {t("inventory.categoryCount", {
                    count: categories.length,
                    defaultValue: `${categories.length} categories`,
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Step 2: Configure and Select Items
  return (
    <div className="flex h-full min-h-0 flex-col w-full max-w-full min-w-0">
      {/* Header */}
      <header className="border-b px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAuditType(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold md:text-xl">
                  {auditType === "full"
                    ? t("inventory.fullCount", { defaultValue: "Full Count" })
                    : t("inventory.cycleCount", { defaultValue: "Cycle Count" })}
                </h1>
                <Badge variant="secondary" className="text-xs">
                  {auditType === "full"
                    ? t("inventory.allItems", { defaultValue: "All Items" })
                    : t("inventory.selectedCategories", { defaultValue: "Selected Categories" })}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {auditType === "full"
                  ? t("inventory.fullCountHint", {
                    defaultValue: "All inventory items will be included",
                  })
                  : t("inventory.cycleCountHint", {
                    defaultValue: "Select categories or scan barcodes to add items",
                  })}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">{selectedItemsList.length}</p>
              <p className="text-xs text-muted-foreground">
                {t("inventory.itemsSelected", { defaultValue: "items selected" })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
          {/* Left Panel: Filters & Search */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            {/* Barcode Scanner */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScanBarcode className="h-4 w-4" />
                  {t("inventory.scanBarcode", { defaultValue: "Scan Barcode" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    ref={barcodeInputRef}
                    placeholder={t("inventory.barcodeInputPlaceholder", {
                      defaultValue: "Scan or enter barcode...",
                    })}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleBarcodeScan();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleBarcodeScan}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Filter (for Cycle Count) */}
            {auditType === "cycle" && (
              <Card className="flex-1 min-h-0 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {t("inventory.selectCategories", { defaultValue: "Select Categories" })}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("inventory.selectCategoriesDesc", {
                      defaultValue: "Choose which categories to count",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                  <ScrollArea className="h-full max-h-[300px]">
                    <div className="space-y-1">
                      {categories.map((category) => {
                        const itemCount = itemsByCategory.get(category.id)?.length || 0;
                        const isSelected = selectedCategories.has(category.id);

                        return (
                          <div
                            key={category.id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                            onClick={() => handleCategoryToggle(category.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleCategoryToggle(category.id)}
                            />
                            <span className="flex-1 text-sm font-medium truncate">
                              {category.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {itemCount}
                            </Badge>
                          </div>
                        );
                      })}

                      {/* Uncategorized items */}
                      {itemsByCategory.has("uncategorized") && (
                        <div
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                            selectedCategories.has("uncategorized")
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                          onClick={() => handleCategoryToggle("uncategorized")}
                        >
                          <Checkbox
                            checked={selectedCategories.has("uncategorized")}
                            onCheckedChange={() => handleCategoryToggle("uncategorized")}
                          />
                          <span className="flex-1 text-sm font-medium">
                            {t("inventory.uncategorized", { defaultValue: "Uncategorized" })}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {itemsByCategory.get("uncategorized")?.length || 0}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Summary Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {t("inventory.summary", { defaultValue: "Summary" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t("inventory.itemsSelected", { defaultValue: "Items Selected" })}
                  </span>
                  <span className="text-lg font-bold">{selectedItemsList.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t("inventory.expectedCount", { defaultValue: "Expected Count" })}
                  </span>
                  <span className="text-lg font-bold font-mono">{totalExpectedCount}</span>
                </div>
                {auditType === "cycle" && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("inventory.categoriesSelected", { defaultValue: "Categories" })}
                    </span>
                    <span className="text-lg font-bold">{selectedCategories.size}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Items Table */}
          <div className="flex-1 min-h-0 flex flex-col rounded-md border bg-card">
            {/* Search Bar */}
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("inventory.searchPlaceholder", {
                    defaultValue: "Search by name, barcode...",
                  })}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllFilteredSelected}
                        onCheckedChange={(checked) => handleSelectAllFiltered(!!checked)}
                        className={isSomeFilteredSelected ? "opacity-50" : ""}
                      />
                    </TableHead>
                    <TableHead>{t("inventory.product", { defaultValue: "Product" })}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("inventory.barcode", { defaultValue: "Barcode" })}
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("inventory.category", { defaultValue: "Category" })}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("inventory.stock", { defaultValue: "Stock" })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Package2 className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchQuery
                              ? t("common.noSearchResults", { defaultValue: "No results found" })
                              : auditType === "cycle" && selectedCategories.size === 0
                                ? t("inventory.selectCategoryFirst", {
                                  defaultValue: "Select a category to see items",
                                })
                                : t("inventory.noItemsAvailable", {
                                  defaultValue: "No items available",
                                })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow
                        key={item.id}
                        data-state={selectedItems.has(item.id) && "selected"}
                        className="cursor-pointer"
                        onClick={() => handleSelectItem(item.id, !selectedItems.has(item.id))}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">
                              {item.product_variation.product.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.product_variation.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                          {item.product_variation.barcode}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {item.product_variation.product.product_category?.name ||
                              t("inventory.uncategorized", { defaultValue: "Uncategorized" })}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {item.quantity_in_stock}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer with info */}
            <div className="border-t px-4 py-3 bg-muted/50">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {t("inventory.showingItems", {
                    count: filteredItems.length,
                    total: inventoryItems.length,
                    defaultValue: `Showing ${filteredItems.length} of ${inventoryItems.length} items`,
                  })}
                </span>
                <span className="hidden md:inline">
                  {selectedItems.size > 0 &&
                    t("inventory.selectedCount", {
                      count: selectedItems.size,
                      defaultValue: `${selectedItems.size} selected`,
                    })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setAuditType(null)}
            disabled={isSubmitting}
          >
            {t("common.back", { defaultValue: "Back" })}
          </Button>
          <Button
            onClick={handleCreateAudit}
            disabled={selectedItemsList.length === 0 || isSubmitting}
            className="flex-1 gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("inventory.startCount", {
              defaultValue: "Start Count",
            })}
            {selectedItemsList.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedItemsList.length}
              </Badge>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
