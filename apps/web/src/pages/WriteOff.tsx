import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Calculator,
  PackageMinus,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { parseApiError } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const WRITE_OFF_REASONS = [
  "damaged",
  "expired",
  "lost",
  "theft",
  "other",
] as const;

export default function WriteOffPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();

  const { getStore } = useAuth();

  const [quantity, setQuantity] = useState<string>("");
  const [reasonType, setReasonType] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storeQuery = useQuery({
    queryKey: ["store"],
    queryFn: getStore,
    staleTime: 1000 * 60 * 5,
  });
  const storeId = storeQuery.data?.store?.id;
  const currency = storeQuery.data?.store?.currency || "UZS";

  // Fetch product details
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) return null;
      const response = await api.get<{
        id: string;
        quantity_in_stock: number;
        price: number;
        product: { name: string; image_url?: string };
        name: string; // variation name
        unit: { name: string };
        sku?: string;
        barcode?: string;
      }>(`/api/product-variations/${productId}`);
      return response;
    },
    enabled: !!productId && productId !== "new",
  });

  // Search products
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["inventory-search", debouncedSearchQuery, storeId],
    queryFn: async () => {
      if (!storeId || !debouncedSearchQuery) return [];
      const res = await api.get<{
        inventory: {
          product_variation_id: string;
          quantity_in_stock: number;
          product_variation: {
            id: string;
            name: string;
            barcode: string;
            product: { name: string };
            unit: { name: string };
          };
        }[];
      }>(
        `/api/inventory?storeId=${storeId}&search=${encodeURIComponent(
          debouncedSearchQuery
        )}`
      );
      // Transform results to include flattened product_name for filtering
      return (res.inventory || []).map((item) => ({
        ...item,
        product_name: item.product_variation?.product?.name || "",
        variation_name: item.product_variation?.name || "",
      }));
    },
    enabled: !!storeId && productId === "new" && debouncedSearchQuery.length > 0,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Show dropdown when we have debounced query and either loading or have results
  useEffect(() => {
    if (debouncedSearchQuery.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [debouncedSearchQuery]);

  const calculations = useMemo(() => {
    if (!product) return null;
    const qty = parseFloat(quantity) || 0;
    const cost = product.price || 0;
    const totalLoss = qty * cost;
    const currentStock = product.quantity_in_stock ?? 0;
    const remaining = Math.max(0, currentStock - qty);

    return { qty, totalLoss, remaining };
  }, [product, quantity]);

  const handleConfirm = async () => {
    if (!product || !storeId) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;
    if (qty > product.quantity_in_stock) return;
    if (!reasonType) return;

    setIsSubmitting(true);
    try {
      await api.post("/api/write-offs", {
        product_variation_id: product.id,
        quantity: qty,
        reason: reasonType,
        notes: customReason || undefined,
      });

      toast.success(
        t("inventory.writeOffSuccess", {
          defaultValue: "Items written off successfully",
        })
      );
      navigate("/inventory/write-offs");
    } catch (error) {
      console.error("Write-off failed", error);
      const parsedError = parseApiError(error);
      toast.error(
        parsedError.message ||
        t("inventory.writeOffFailed", {
          defaultValue: "Failed to write off items",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProductLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    if (productId === "new") {
      return (
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/inventory/write-offs")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold md:text-xl">
              {t("inventory.newWriteOff", { defaultValue: "New Write Off" })}
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("inventory.selectProduct", {
                  defaultValue: "Select Product",
                })}
              </CardTitle>
              <CardDescription>
                {t("inventory.searchPlaceholder", {
                  defaultValue: "Search by name, barcode...",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  className="pl-9"
                  placeholder={t("inventory.searchPlaceholder", {
                    defaultValue: "Search...",
                  })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (debouncedSearchQuery.length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                />

                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95"
                  >
                    {isSearchLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          {t("common.searching", { defaultValue: "Searching..." })}
                        </span>
                      </div>
                    ) : searchResults && searchResults.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto p-1">
                        {searchResults.map((item) => (
                          <div
                            key={item.product_variation_id}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => {
                              navigate(`/inventory/write-off/${item.product_variation.id}`);
                              setShowDropdown(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.product_variation.product.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.product_variation.name} •{" "}
                                {item.quantity_in_stock}{" "}
                                {t("common.inStock", {
                                  defaultValue: "in stock",
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm">
                        {t("common.noResults", {
                          defaultValue: "No results found.",
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">
          {t("products.notFound", { defaultValue: "Product not found" })}
        </p>
        <Button variant="outline" onClick={() => navigate("/inventory")}>
          {t("common.back", { defaultValue: "Back" })}
        </Button>
      </div>
    );
  }

  const isValid =
    !isNaN(parseFloat(quantity)) &&
    parseFloat(quantity) > 0 &&
    parseFloat(quantity) <= (product.quantity_in_stock ?? 0) &&
    !!reasonType &&
    (reasonType !== "other" || !!customReason);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/inventory")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold md:text-xl">
            {t("inventory.writeOffTitle", {
              defaultValue: "Write Off Inventory",
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {product.product.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT COLUMN: FORM */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("inventory.writeOffDetails", { defaultValue: "Details" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="quantity" className="text-base">
                {t("inventory.quantity", { defaultValue: "Quantity" })}
              </Label>
              <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="text-lg h-12 pr-16"
                  min="0"
                  max={product.quantity_in_stock}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  / {product.quantity_in_stock}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">
                {t("inventory.reason", { defaultValue: "Reason" })}
              </Label>
              <Select value={reasonType} onValueChange={setReasonType}>
                <SelectTrigger id="reason" className="h-12">
                  <SelectValue
                    placeholder={t("inventory.selectReason", {
                      defaultValue: "Select a reason",
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {WRITE_OFF_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`inventory.writeOffReasons.${r}`, { defaultValue: r })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reasonType === "other" && (
              <div className="grid gap-2">
                <Label htmlFor="customReason">
                  {t("inventory.customReason", { defaultValue: "Description" })}
                </Label>
                <Textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t("inventory.customReasonPlaceholder", {
                    defaultValue: "Enter details...",
                  })}
                  className="min-h-[100px]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="space-y-6">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageMinus className="h-5 w-5" />
                {t("inventory.overview", { defaultValue: "Overview" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                {product.product.image_url ? (
                  <img
                    src={product.product.image_url}
                    alt={product.product.name}
                    className="h-20 w-20 rounded-md object-cover border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center border">
                    <PackageMinus className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="font-medium">{product.product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.name}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {product.sku && (
                      <span className="bg-background px-1.5 py-0.5 rounded border">
                        SKU: {product.sku}
                      </span>
                    )}
                    {product.barcode && (
                      <span className="bg-background px-1.5 py-0.5 rounded border">
                        {product.barcode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    {t("inventory.currentStock", {
                      defaultValue: "Current Stock",
                    })}
                  </p>
                  <p className="font-medium">
                    {product.quantity_in_stock ?? 0} {product.unit.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("inventory.costPrice", { defaultValue: "Cost Price" })}
                  </p>
                  <p className="font-medium">
                    {formatCurrency(product.price, currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "border-l-4",
              isValid ? "border-l-destructive" : "border-l-muted"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" />
                {t("inventory.impact", { defaultValue: "Impact" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t("inventory.remainingStock", {
                    defaultValue: "Remaining Stock",
                  })}
                </span>
                <span
                  className={cn(
                    "font-mono font-medium",
                    calculations?.remaining === 0 && "text-destructive"
                  )}
                >
                  {calculations?.remaining} {product.unit.name}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {t("inventory.totalLoss", { defaultValue: "Total Loss" })}
                </span>
                <span className="text-xl font-bold text-destructive">
                  {formatCurrency(calculations?.totalLoss || 0, currency)}
                </span>
              </div>

              {calculations?.qty &&
                calculations.qty > (product.quantity_in_stock ?? 0) && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      {t("pos.insufficientStock", {
                        defaultValue: "Insufficient stock",
                      })}
                    </span>
                  </div>
                )}
            </CardContent>
            <CardFooter>
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/inventory")}
                  disabled={isSubmitting}
                >
                  {t("common.cancel", { defaultValue: "Cancel" })}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("inventory.writeOffAction", { defaultValue: "Write Off" })}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
