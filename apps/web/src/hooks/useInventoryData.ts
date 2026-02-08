import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type {
  Prisma,
  ProductCategory,
  Unit,
} from "@/types/generated/tenant/client";

const LOW_STOCK_THRESHOLD = 10;
const DEFAULT_CATEGORY = "Uncategorized";

export type StockStatus = "good" | "low" | "out";

export type PrismaProductCategory = ProductCategory;
export type PrismaUnit = Unit;

export type PrismaProductVariation = Prisma.ProductVariationGetPayload<{
  include: {
    inventory: true;
    unit: true;
    supplier: true;
  };
}>;

export type PrismaProduct = Prisma.ProductGetPayload<{
  include: {
    product_variations: {
      include: {
        inventory: true;
        unit: true;
        supplier: true;
      };
    };
    product_category: true;
  };
}>;

export type InventoryProductVariation = PrismaProductVariation;

export interface InventoryItem {
  id: string;
  name: string;
  categoryName: string;
  imageUrl: string;
  inStock: number;
  totalVariations: number;
  lowStock: boolean;
  stockStatus: StockStatus;
  color: string;
  barcodes: string[];
  skus: (string | null)[];
  unitValueVariations: string[];
  variationColors: (string | null)[];
  productVariations: InventoryProductVariation[];
  supplierId?: string | null;
  supplierName?: string | null;
}

export interface InventoryGroup {
  title: string;
  items: InventoryItem[];
}

export interface InventoryFilters {
  stockStatus: StockStatus[];
  colors: string[];
  unitValues: string[];
  productCategoryColors: string[];
  categoryNames: string[];
  supplierNames?: string[];
  priceRange: { min: number; max: number } | null;
}

export interface InventoryFilterMeta {
  colors: string[];
  unitValues: string[];
  productCategoryColors: string[];
  categoryNames: string[];
  supplierNames?: string[];
  priceRange: { min: number; max: number } | null;
}

export interface UseInventoryDataResult {
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  items: InventoryItem[];
  groupedItems: InventoryGroup[];
  filteredItems: InventoryItem[];
  filters: InventoryFilters;
  filterMeta: InventoryFilterMeta;
  setFilters: (filters: InventoryFilters) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  refetch: () => Promise<void>;
  lowStockCount: number;
  storeCurrency?: string;
}

export function useInventoryData(): UseInventoryDataResult {
  const { userStore, getStore } = useAuth();
  const storeId = userStore?.store?.id;

  const storeCurrency = userStore?.store?.currency ?? undefined;

  const {
    data: products,
    isLoading: productsLoading,
    isFetching: productsFetching,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", storeId],
    queryFn: async () => {
      const response = await api.get<{ products: PrismaProduct[] }>(
        "/api/products/list"
      );
      return response.products ?? [];
    },
    enabled: !!storeId,
    staleTime: 1000 * 30,
    retry: 3,
  });

  const { data: lowStockResponse } = useQuery({
    queryKey: ["inventory-low-stock", storeId],
    queryFn: async () => {
      if (!storeId) {
        return { lowStockItems: [] as unknown[] };
      }
      try {
        return await api.get<{ lowStockItems: unknown[] }>(
          `/api/inventory/low-stock?storeId=${encodeURIComponent(storeId)}`
        );
      } catch {
        return { lowStockItems: [] as unknown[] };
      }
    },
    enabled: !!storeId,
    staleTime: 1000 * 60,
  });

  const [filters, setFilters] = useState<InventoryFilters>({
    stockStatus: [],
    colors: [],
    unitValues: [],
    productCategoryColors: [],
    categoryNames: [],
    supplierNames: [],
    priceRange: null,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const processedItems = useMemo<InventoryItem[]>(() => {
    if (!products) {
      return [];
    }

    return products.map((product) => {
      let inStock = 0;
      let lowStock = false;
      const unitValueVariations = new Set<string>();
      const variationColors = new Set<string | null>();
      const barcodes: string[] = [];
      const skus: (string | null)[] = [];

      const productVariationsWithUnit = product.product_variations;

      productVariationsWithUnit.forEach((variation: PrismaProductVariation) => {
        const stockQuantity = (variation.inventory ?? []).reduce(
          (sum, inv) => sum + inv.quantity_in_stock,
          0
        );

        inStock += stockQuantity;
        if (stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD) {
          lowStock = true;
        }
        if (stockQuantity === 0) {
          lowStock = lowStock || false;
        }

        if (variation.unit) {
          unitValueVariations.add(variation.unit.name);
        }
        variationColors.add(variation.color);
        if (variation.barcode) {
          barcodes.push(variation.barcode);
        }
        skus.push(variation.sku);
      });

      const category = product.product_category;

      let stockStatus: StockStatus = "good";
      if (inStock === 0) {
        stockStatus = "out";
      } else if (lowStock || inStock <= LOW_STOCK_THRESHOLD) {
        stockStatus = "low";
      }

      return {
        id: product.id,
        name: product.name,
        categoryName: category?.name || DEFAULT_CATEGORY,
        imageUrl: product.image_url || "",
        inStock,
        totalVariations: product.product_variations?.length ?? 0,
        lowStock: stockStatus === "low",
        stockStatus,
        color: category?.color || "#6FCF97",
        barcodes,
        skus,
        unitValueVariations: Array.from(unitValueVariations),
        variationColors: Array.from(variationColors),
        productVariations: productVariationsWithUnit,
        supplierId: product.product_variations[0]?.supplier?.id,
        supplierName: product.product_variations[0]?.supplier?.name,
      };
    });
  }, [products]);

  const filterMeta = useMemo<InventoryFilterMeta>(() => {
    const colors = new Set<string>();
    const unitValues = new Set<string>();
    const productCategoryColors = new Set<string>();
    const categoryNames = new Set<string>();
    const supplierNames = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    products?.forEach((product) => {
      const category = product.product_category;
      if (category?.color) {
        productCategoryColors.add(category.color);
      }
      if (category?.name) {
        categoryNames.add(category.name);
      }

      (product.product_variations ?? []).forEach(
        (variation: PrismaProductVariation) => {
          if (variation.supplier?.name) {
            supplierNames.add(variation.supplier.name);
          }
          if (variation.color) {
            colors.add(variation.color);
          }
          if (variation.unit) {
            unitValues.add(variation.unit.name);
          }

          const sellingPrice = Number(variation.selling_price);
          if (sellingPrice < minPrice) {
            minPrice = sellingPrice;
          }
          if (sellingPrice > maxPrice) {
            maxPrice = sellingPrice;
          }
        }
      );
    });

    return {
      colors: Array.from(colors),
      unitValues: Array.from(unitValues),
      productCategoryColors: Array.from(productCategoryColors),
      categoryNames: Array.from(categoryNames),
      supplierNames: Array.from(supplierNames),
      priceRange:
        minPrice !== Infinity && maxPrice !== -Infinity
          ? { min: minPrice, max: maxPrice }
          : null,
    };
  }, [products]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return processedItems.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        item.barcodes.some((barcode) =>
          barcode.toLowerCase().includes(query)
        ) ||
        item.skus.some((sku) => sku && sku.toLowerCase().includes(query));

      if (!matchesQuery) {
        return false;
      }

      if (
        filters.stockStatus.length > 0 &&
        !filters.stockStatus.includes(item.stockStatus)
      ) {
        return false;
      }

      if (
        filters.colors.length > 0 &&
        !item.variationColors.some(
          (color) => color && filters.colors.includes(color)
        )
      ) {
        return false;
      }

      if (
        filters.unitValues.length > 0 &&
        !item.unitValueVariations.some((value) =>
          filters.unitValues.includes(value)
        )
      ) {
        return false;
      }

      if (
        filters.productCategoryColors.length > 0 &&
        !filters.productCategoryColors.includes(item.color)
      ) {
        return false;
      }

      if (
        filters.categoryNames.length > 0 &&
        !filters.categoryNames.includes(item.categoryName)
      ) {
        return false;
      }

      if (
        filters.supplierNames &&
        filters.supplierNames.length > 0 &&
        (!item.supplierName ||
          !filters.supplierNames.includes(item.supplierName))
      ) {
        return false;
      }

      if (filters.priceRange) {
        const withinRange = item.productVariations.some((variation) => {
          const price = Number(variation.selling_price);
          return (
            price >= filters.priceRange!.min && price <= filters.priceRange!.max
          );
        });
        if (!withinRange) {
          return false;
        }
      }

      return true;
    });
  }, [processedItems, searchQuery, filters]);

  const groupedItems = useMemo<InventoryGroup[]>(() => {
    const groups = new Map<string, InventoryItem[]>();

    filteredItems.forEach((item) => {
      const key = item.categoryName;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries())
      .map(([title, items]) => ({
        title,
        items,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredItems]);

  const refetch = useCallback(async () => {
    await Promise.all([getStore(), refetchProducts()]);
  }, [getStore, refetchProducts]);

  const isLoading = productsLoading;
  const isFetching = productsFetching;
  const error = productsError;

  return {
    isLoading,
    isFetching,
    error,
    items: processedItems,
    groupedItems,
    filteredItems,
    filters,
    filterMeta,
    setFilters,
    searchQuery,
    setSearchQuery,
    refetch,
    lowStockCount: lowStockResponse?.lowStockItems?.length ?? 0,
    storeCurrency,
  };
}

/**
 * Flattened inventory item representing a single product variation as a row
 */
export interface FlattenedInventoryItem {
  id: string; // variation id
  productId: string;
  productName: string;
  variationName: string;
  displayName: string; // combined product + variation name
  categoryName: string;
  productImageUrl: string;
  variationImageUrl: string;
  displayImageUrl: string; // variation image or fallback to product image
  inStock: number;
  stockStatus: StockStatus;
  sellingPrice: number;
  supplierPrice: number;
  unitCost: number; // cost per unit (product price fallback)
  unitId: string;
  unitName: string;
  supplierId: string | null;
  supplierName: string | null;
  barcode: string | null;
  sku: string | null;
  color: string | null;
  productCategoryColor: string;
  // Keep reference to full variation data for editing
  fullVariation: InventoryProductVariation;
}

export interface UseFlattenedInventoryDataResult {
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  flattenedItems: FlattenedInventoryItem[];
  filteredFlattenedItems: FlattenedInventoryItem[];
  filters: InventoryFilters;
  filterMeta: InventoryFilterMeta;
  setFilters: (filters: InventoryFilters) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  refetch: () => Promise<void>;
  lowStockCount: number;
  storeCurrency?: string;
}

/**
 * Hook that returns flattened inventory data with each variation as a separate row
 */
export function useFlattenedInventoryData(): UseFlattenedInventoryDataResult {
  const { userStore, getStore } = useAuth();
  const storeId = userStore?.store?.id;
  const storeCurrency = userStore?.store?.currency ?? undefined;

  const {
    data: products,
    isLoading: productsLoading,
    isFetching: productsFetching,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", storeId],
    queryFn: async () => {
      const response = await api.get<{ products: PrismaProduct[] }>(
        "/api/products/list"
      );
      return response.products ?? [];
    },
    enabled: !!storeId,
    staleTime: 1000 * 30,
    retry: 3,
  });

  const { data: lowStockResponse } = useQuery({
    queryKey: ["inventory-low-stock", storeId],
    queryFn: async () => {
      if (!storeId) {
        return { lowStockItems: [] as unknown[] };
      }
      try {
        return await api.get<{ lowStockItems: unknown[] }>(
          `/api/inventory/low-stock?storeId=${encodeURIComponent(storeId)}`
        );
      } catch {
        return { lowStockItems: [] as unknown[] };
      }
    },
    enabled: !!storeId,
    staleTime: 1000 * 60,
  });

  const [filters, setFilters] = useState<InventoryFilters>({
    stockStatus: [],
    colors: [],
    unitValues: [],
    productCategoryColors: [],
    categoryNames: [],
    supplierNames: [],
    priceRange: null,
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Flatten variations into individual rows
  const flattenedItems = useMemo<FlattenedInventoryItem[]>(() => {
    if (!products) {
      return [];
    }

    const flattened: FlattenedInventoryItem[] = [];

    products.forEach((product) => {
      const category = product.product_category;
      const productImageUrl = product.image_url || "";
      const categoryName = category?.name || DEFAULT_CATEGORY;
      const productCategoryColor = category?.color || "#6FCF97";

      product.product_variations.forEach(
        (variation: PrismaProductVariation) => {
          const stockQuantity = (variation.inventory ?? []).reduce(
            (sum, inv) => sum + inv.quantity_in_stock,
            0
          );

          let stockStatus: StockStatus = "good";
          if (stockQuantity === 0) {
            stockStatus = "out";
          } else if (stockQuantity <= LOW_STOCK_THRESHOLD) {
            stockStatus = "low";
          }

          const variationName = variation.name || "";
          const displayName =
            variationName && variationName !== product.name
              ? `${product.name} - ${variationName}`
              : product.name;

          flattened.push({
            id: variation.id,
            productId: product.id,
            productName: product.name,
            variationName,
            displayName,
            categoryName,
            productImageUrl,
            variationImageUrl: variation.image_url || "",
            displayImageUrl: variation.image_url || productImageUrl,
            inStock: stockQuantity,
            stockStatus,
            sellingPrice: Number(
              variation.selling_price ?? variation.price ?? 0
            ),
            supplierPrice: Number(variation.price ?? 0),
            unitCost: Number(variation.price ?? 0),
            unitId: variation.unit_id,
            unitName: variation.unit?.name ?? "",
            supplierId: variation.supplier?.id ?? null,
            supplierName: variation.supplier?.name ?? null,
            barcode: variation.barcode ?? null,
            sku: variation.sku ?? null,
            color: variation.color ?? null,
            productCategoryColor,
            fullVariation: variation,
          });
        }
      );
    });

    return flattened;
  }, [products]);

  // Build filter metadata
  const filterMeta = useMemo<InventoryFilterMeta>(() => {
    const colors = new Set<string>();
    const unitValues = new Set<string>();
    const productCategoryColors = new Set<string>();
    const categoryNames = new Set<string>();
    const supplierNames = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    flattenedItems.forEach((item) => {
      if (item.color) {
        colors.add(item.color);
      }
      if (item.unitName) {
        unitValues.add(item.unitName);
      }
      if (item.productCategoryColor) {
        productCategoryColors.add(item.productCategoryColor);
      }
      if (item.categoryName) {
        categoryNames.add(item.categoryName);
      }
      if (item.supplierName) {
        supplierNames.add(item.supplierName);
      }

      if (item.sellingPrice < minPrice) {
        minPrice = item.sellingPrice;
      }
      if (item.sellingPrice > maxPrice) {
        maxPrice = item.sellingPrice;
      }
    });

    return {
      colors: Array.from(colors),
      unitValues: Array.from(unitValues),
      productCategoryColors: Array.from(productCategoryColors),
      categoryNames: Array.from(categoryNames),
      supplierNames: Array.from(supplierNames),
      priceRange:
        minPrice !== Infinity && maxPrice !== -Infinity
          ? { min: minPrice, max: maxPrice }
          : null,
    };
  }, [flattenedItems]);

  // Apply filters
  const filteredFlattenedItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return flattenedItems.filter((item) => {
      // Search filter
      const matchesQuery =
        !query ||
        item.displayName.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        (item.barcode && item.barcode.toLowerCase().includes(query)) ||
        (item.sku && item.sku.toLowerCase().includes(query));

      if (!matchesQuery) {
        return false;
      }

      // Stock status filter
      if (
        filters.stockStatus.length > 0 &&
        !filters.stockStatus.includes(item.stockStatus)
      ) {
        return false;
      }

      // Color filter
      if (
        filters.colors.length > 0 &&
        (!item.color || !filters.colors.includes(item.color))
      ) {
        return false;
      }

      // Unit filter
      if (
        filters.unitValues.length > 0 &&
        !filters.unitValues.includes(item.unitName)
      ) {
        return false;
      }

      // Product category color filter
      if (
        filters.productCategoryColors.length > 0 &&
        !filters.productCategoryColors.includes(item.productCategoryColor)
      ) {
        return false;
      }

      // Category name filter
      if (
        filters.categoryNames.length > 0 &&
        !filters.categoryNames.includes(item.categoryName)
      ) {
        return false;
      }

      // Supplier filter
      if (
        filters.supplierNames &&
        filters.supplierNames.length > 0 &&
        (!item.supplierName ||
          !filters.supplierNames.includes(item.supplierName))
      ) {
        return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const price = item.sellingPrice;
        if (price < filters.priceRange.min || price > filters.priceRange.max) {
          return false;
        }
      }

      return true;
    });
  }, [flattenedItems, searchQuery, filters]);

  const refetch = useCallback(async () => {
    await Promise.all([getStore(), refetchProducts()]);
  }, [getStore, refetchProducts]);

  const isLoading = productsLoading;
  const isFetching = productsFetching;
  const error = productsError;

  return {
    isLoading,
    isFetching,
    error,
    flattenedItems,
    filteredFlattenedItems,
    filters,
    filterMeta,
    setFilters,
    searchQuery,
    setSearchQuery,
    refetch,
    lowStockCount: lowStockResponse?.lowStockItems?.length ?? 0,
    storeCurrency,
  };
}
