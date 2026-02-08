import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "react-router";
import { AgGridReact } from "ag-grid-react";
import {
  type ColDef,
  type CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
  colorSchemeLight,
} from "ag-grid-community";
import { api } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

type ProductVariation = {
  id: string;
  name: string;
  selling_price?: number | null;
  price?: number | null;
  inventory: Array<{
    quantity_in_stock: number;
  }>;
};

type Product = {
  id: string;
  name: string;
  product_variations: ProductVariation[];
};

type RestockRowData = {
  id: string;
  name: string;
  currentStock: number;
  quantity: number | null;
  cost_price: number | null;
  price: number | null;
  selling_price: number | null;
};

type RestockPayload = {
  variationId: string;
  quantity: number;
  cost_price?: number;
  price?: number;
  selling_price?: number;
};

const RestockPage = () => {
  const { t } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReact<RestockRowData>>(null);

  const { userStore } = useAuth();
  const storeCurrency = userStore?.store?.currency || "UZS";
  const { theme } = useTheme();

  const [rowData, setRowData] = useState<RestockRowData[]>([]);

  // Determine if dark mode is active
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      if (theme === "dark") {
        setIsDark(true);
      } else if (theme === "light") {
        setIsDark(false);
      } else {
        // System theme - check actual applied class
        const isDarkMode = document.documentElement.classList.contains("dark");
        setIsDark(isDarkMode);
      }
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme]);

  // Create AG Grid theme with proper color scheme
  const gridTheme = useMemo(() => {
    return themeQuartz.withPart(isDark ? colorSchemeDark : colorSchemeLight);
  }, [isDark]);

  const selectedVariations = (
    location.state as { selectedVariations?: any[] }
  )?.selectedVariations;

  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useQuery<Product | null>({
    queryKey: ["product", productId],
    queryFn: async (): Promise<Product | null> => {
      if (!productId) return null;
      const response = await api.get<{ product: Product }>(
        `/api/products/${productId}`
      );
      if (response.product) {
        return response.product;
      }
      throw new Error("Invalid API response structure.");
    },
    enabled: !!productId && !selectedVariations,
  });

  const restockMutation = useMutation({
    mutationFn: async (items: RestockPayload[]) => {
      await Promise.all(
        items.map((item) => api.post("/api/inventory/restock", item))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ["product", productId] });
      }
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      // Reset quantities after successful restock
      setRowData((prev) =>
        prev.map((row) => ({
          ...row,
          quantity: null,
        }))
      );
      toast.success(
        t("inventory.restockSuccess", { defaultValue: "Restock successful" })
      );
      navigate("/inventory");
    },
    onError: (error: Error) => {
      const parsed = parseApiError(error);
      toast.error(parsed.message || t("errors.generic"));
    },
  });

  const initializeRowData = useCallback((variations: ProductVariation[]) => {
    setRowData((prev) => {
      const existingMap = new Map(prev.map((row) => [row.id, row]));

      return variations.map((variation) => {
        const existing = existingMap.get(variation.id);
        if (existing) {
          return existing;
        }

        return {
          id: variation.id,
          name: variation.name || "",
          currentStock: variation.inventory?.[0]?.quantity_in_stock || 0,
          quantity: null,
          cost_price:
            variation.price !== null && variation.price !== undefined
              ? variation.price
              : null,
          price:
            variation.price !== null &&
              variation.price !== undefined
              ? variation.price
              : null,
          selling_price:
            variation.selling_price !== null &&
              variation.selling_price !== undefined
              ? variation.selling_price
              : null,
        };
      });
    });
  }, []);

  useEffect(() => {
    if (selectedVariations) {
      // Map selected variations to ProductVariation structure if needed
      // Assuming selectedVariations are FlattenedInventoryItem
      const variations: ProductVariation[] = selectedVariations.map(
        (item: any) => ({
          id: item.id,
          name: item.displayName,
          selling_price: item.sellingPrice,
          price: item.fullVariation?.price ?? 0,
          inventory: [{ quantity_in_stock: item.inStock }],
        })
      );
      initializeRowData(variations);
    } else if (productData?.product_variations) {
      initializeRowData(productData.product_variations);
    }
  }, [productData, selectedVariations, initializeRowData]);

  useEffect(() => {
    if (selectedVariations) return;
    if (!productData?.name) return;
    const stateObject =
      location.state && typeof location.state === "object"
        ? (location.state as Record<string, unknown> & {
          restockProductName?: string;
        })
        : undefined;
    if (stateObject?.restockProductName === productData.name) return;
    navigate(".", {
      replace: true,
      state: {
        ...(stateObject ?? {}),
        restockProductName: productData.name,
      },
    });
  }, [productData?.name, location.state, navigate, selectedVariations]);

  const handleProductVariationRestock = () => {
    const itemsToRestock: RestockPayload[] = rowData
      .map((row) => {
        const quantity = row.quantity;
        if (!quantity || quantity <= 0) return null;

        return {
          variationId: row.id,
          quantity,
          cost_price:
            row.cost_price !== null && row.cost_price > 0
              ? row.cost_price
              : undefined,
          price:
            row.price !== null && row.price > 0
              ? row.price
              : undefined,
          selling_price:
            row.selling_price !== null && row.selling_price > 0
              ? row.selling_price
              : undefined,
        };
      })
      .filter(Boolean) as RestockPayload[];

    if (itemsToRestock.length === 0) {
      toast.warning(
        t("inventory.noItemsToRestock", {
          defaultValue: "No items to restock",
        })
      );
      return;
    }

    restockMutation.mutate(itemsToRestock);
  };

  const hasPendingRestock = rowData.some((row) => {
    const qty = row.quantity;
    return qty !== null && qty > 0;
  });

  // Currency formatter
  const currencyFormatter = (params: { value: number | null }) => {
    if (params.value === null || params.value === undefined) return "";
    return `${storeCurrency} ${params.value.toLocaleString()}`;
  };

  // Handle cell value changes
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<RestockRowData>) => {
      const { data, colDef, newValue } = event;
      const field = colDef.field as keyof RestockRowData;

      if (!data || !field) return;

      let parsedValue: number | null = null;

      if (typeof newValue === "string") {
        const cleaned = newValue.replace(/[^\d.]/g, "");
        parsedValue = cleaned === "" ? null : parseFloat(cleaned);
        if (isNaN(parsedValue as number)) parsedValue = null;
      } else if (typeof newValue === "number") {
        parsedValue = isNaN(newValue) ? null : newValue;
      }

      setRowData((prev) =>
        prev.map((row) =>
          row.id === data.id ? { ...row, [field]: parsedValue } : row
        )
      );
    },
    []
  );

  const columnDefs: ColDef<RestockRowData>[] = useMemo(
    () => [
      {
        field: "name",
        headerName: t("products.variationName", { defaultValue: "Variation" }),
        editable: false,
        minWidth: 200,
        flex: 1,
      },
      {
        field: "currentStock",
        headerName: t("inventory.currentStock", {
          defaultValue: "Current Stock",
        }),
        editable: false,
        minWidth: 120,
        type: "numericColumn",
      },
      {
        field: "quantity",
        headerName: t("inventory.restockQuantity", {
          defaultValue: "Restock Qty",
        }),
        editable: true,
        minWidth: 130,
        type: "numericColumn",
        cellEditor: "agNumberCellEditor",
        cellEditorParams: {
          min: 0,
        },
        cellStyle: {
          backgroundColor: isDark
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)",
        },
      },
      {
        field: "cost_price",
        headerName: t("inventory.costPrice", { defaultValue: "Cost Price" }),
        editable: true,
        minWidth: 140,
        type: "numericColumn",
        cellEditor: "agNumberCellEditor",
        cellEditorParams: {
          min: 0,
        },
        valueFormatter: currencyFormatter,
        cellStyle: {
          backgroundColor: isDark
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)",
        },
      },
      {
        field: "price",
        headerName: t("products.cost", {
          defaultValue: "Cost",
        }),
        editable: true,
        minWidth: 150,
        type: "numericColumn",
        cellEditor: "agNumberCellEditor",
        cellEditorParams: {
          min: 0,
        },
        valueFormatter: currencyFormatter,
        cellStyle: {
          backgroundColor: isDark
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)",
        },
      },
      {
        field: "selling_price",
        headerName: t("products.sellingPrice", {
          defaultValue: "Selling Price",
        }),
        editable: true,
        minWidth: 140,
        type: "numericColumn",
        cellEditor: "agNumberCellEditor",
        cellEditorParams: {
          min: 0,
        },
        valueFormatter: currencyFormatter,
        cellStyle: {
          backgroundColor: isDark
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)",
        },
      },
    ],
    [t, storeCurrency, isDark]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      suppressMovable: true,
    }),
    []
  );

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <h1 className="text-lg font-medium md:text-xl">
            {t("inventory.restock", { defaultValue: "Restock" })}
          </h1>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        </main>
      </div>
    );
  }

  if (isError && !selectedVariations) {
    const message =
      error instanceof Error ? error.message : t("errors.generic");
    return (
      <div className="flex h-full min-h-0 w-full flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <h1 className="text-lg font-medium md:text-xl">
            {t("inventory.restock", { defaultValue: "Restock" })}
          </h1>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-sm text-destructive">{message}</div>
        </main>
      </div>
    );
  }

  if (
    (!productData || !productData.product_variations?.length) &&
    !selectedVariations
  ) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <h1 className="text-lg font-medium md:text-xl">
            {t("inventory.restock", { defaultValue: "Restock" })}
          </h1>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-sm text-muted-foreground">
            {t("products.productNotFound", {
              defaultValue: "Product not found",
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <h1 className="text-lg font-medium md:text-xl">
          {t("inventory.restock", { defaultValue: "Restock" })}
          {productData?.name ? ` - ${productData.name}` : ""}
        </h1>
        <Button
          onClick={handleProductVariationRestock}
          disabled={restockMutation.isPending || !hasPendingRestock}
        >
          {restockMutation.isPending
            ? t("common.loading")
            : t("inventory.confirmRestock", {
              defaultValue: "Confirm Restock",
            })}
        </Button>
      </header>
      <main className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
        <div className="flex-1 min-h-0 rounded-md border">
          <AgGridReact<RestockRowData>
            ref={gridRef}
            theme={gridTheme}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            stopEditingWhenCellsLoseFocus={true}
            onCellValueChanged={onCellValueChanged}
            getRowId={(params) => params.data.id}
          />
        </div>
      </main>
    </div>
  );
};

export default RestockPage;
