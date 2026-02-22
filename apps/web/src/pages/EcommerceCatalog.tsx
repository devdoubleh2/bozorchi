import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Search, ShoppingCart, Loader2, X, Plus, Minus, Package2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Seo from "@/components/Seo";

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

// Use the same InventoryItem type as POS.tsx
interface InventoryItem {
  id: string;
  quantity_in_stock: number;
  created_at: string;
  updated_at: string | null;
  is_service?: boolean;
  product_variation: {
    id: string;
    name: string;
    barcode: string;
    sku: string | null;
    price: number;
    selling_price: number;
    description: string;
    color: string | null;
    image_url: string | null;
    unit: { id: string; name: string } | null;
    product: {
      id: string;
      name: string;
      image_url: string | null;
      type?: "simple" | "variable" | "service";
      category: { id: string; name: string } | null;
      product_category: { id: string; name: string; color: string | null } | null;
    };
  };
}

// Same response type as POS.tsx
interface InventoryResponse {
  inventory: InventoryItem[];
  pagination: {
    total: number;
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

// Cart item uses InventoryItem
interface CartItem {
  item: InventoryItem;
  quantity: number;
}

interface Organization {
  id: string;
  name: string;
  logo?: string;
}

const toDisplayName = (slug: string): string => {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function EcommerceCatalog() {
  const { retailName } = useParams<{ retailName: string }>();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch organization data
  const { data: orgData, isLoading: orgLoading, error: orgError } = useQuery({
    queryKey: ["organization", retailName],
    queryFn: async () => {
      const response = await api.get<Organization>(
        `/api/organizations/by-name/${retailName}`
      );
      return response;
    },
    retry: false,
  });

  const fallbackStoreName = useMemo(() => {
    return retailName ? toDisplayName(retailName) : "Store";
  }, [retailName]);

  const organizationName = orgData?.name ?? null;
  const hasOrganization = Boolean(orgData);
  const hasOrgError = Boolean(orgError);
  const storeNameForSeo = organizationName ?? fallbackStoreName;
  const isStoreUnavailable = !orgLoading && (hasOrgError || !hasOrganization);
  const seoTitle = isStoreUnavailable
    ? `${storeNameForSeo} Store`
    : `${storeNameForSeo} Online Store`;
  const seoDescription = isStoreUnavailable
    ? `The store page for ${storeNameForSeo} is currently unavailable.`
    : `Shop ${storeNameForSeo} online. Browse available products and place orders in minutes.`;
  const seoRobots = isStoreUnavailable
    ? "noindex,nofollow"
    : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  const seoJsonLd = isStoreUnavailable
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "Store",
        name: storeNameForSeo,
        url:
          typeof window !== "undefined"
            ? `${window.location.origin}${location.pathname}`
            : location.pathname,
      };

  // Use infinite query for paginated inventory loading (same pattern as POS.tsx)
  const inventoryQuery = useInfiniteQuery({
    queryKey: ["ecommerce-inventory", orgData?.id, debouncedSearch],
    queryFn: async ({ pageParam }): Promise<InventoryResponse> => {
      const emptyResponse: InventoryResponse = {
        inventory: [],
        pagination: { total: 0, limit: 50, hasNextPage: false, nextCursor: null },
      };

      if (!orgData?.id) return emptyResponse;

      const params = new URLSearchParams({ limit: "50" });

      if (pageParam) {
        params.set("cursor", pageParam);
      }

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      const response = await api.get<InventoryResponse>(
        `/api/organizations/${orgData.id}/products?${params.toString()}`
      );

      return {
        inventory: response?.inventory ?? [],
        pagination: response?.pagination ?? emptyResponse.pagination,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextCursor ?? null,
    enabled: !!orgData?.id,
    staleTime: 1000 * 60 * 2,
    retry: 3,
  });

  // Flatten paginated inventory data
  const inventory = useMemo(() => {
    if (!inventoryQuery.data?.pages) return [];
    return inventoryQuery.data.pages.flatMap((page) => {
      // Ensure page.inventory is always an array
      if (!page || !Array.isArray(page.inventory)) return [];
      return page.inventory;
    });
  }, [inventoryQuery.data]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && inventoryQuery.hasNextPage && !inventoryQuery.isFetchingNextPage) {
          inventoryQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [inventoryQuery.hasNextPage, inventoryQuery.isFetchingNextPage, inventoryQuery.fetchNextPage]);

  const handleAddToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.item.id === item.id);
      
      // Check stock limit (skip for services)
      const isService = item.is_service || item.product_variation?.product?.type === "service";
      if (!isService && existing && existing.quantity >= item.quantity_in_stock) {
        return prev;
      }

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((cartItem) => cartItem.item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((cartItem) =>
        cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem
      )
    );
  };

  const cartTotal = cart.reduce(
    (sum, cartItem) => sum + cartItem.item.product_variation.selling_price * cartItem.quantity,
    0
  );

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!orgData?.id) throw new Error("Organization not found");
      if (!phoneNumber.trim()) throw new Error("Phone number is required");

      const groupId = `ecommerce-${Date.now()}`;
      
      // Create a transaction for each cart item
      const transactionPromises = cart.map((cartItem) => {
        const transactionData = {
          product_variation_id: cartItem.item.product_variation.id,
          quantity: cartItem.quantity,
          unit_price: cartItem.item.product_variation.selling_price,
          total_amount: cartItem.item.product_variation.selling_price * cartItem.quantity,
          transaction_type: "export",
          phone_number: phoneNumber,
          remarks: `📱 Интернет-заказ
Товар: ${cartItem.item.product_variation.product.name}${cartItem.item.product_variation.name ? ` (${cartItem.item.product_variation.name})` : ''}
Телефон клиента: ${phoneNumber}
Количество: ${cartItem.quantity}`,
          group_id: groupId,
        };

        return api.post(`/api/organizations/${orgData.id}/transactions`, transactionData);
      });

      await Promise.all(transactionPromises);
      return { groupId };
    },
    onSuccess: () => {
      setOrderSuccess(true);
      toast.success("Заказ успешно оформлен!");
      
      // Clear cart and close modal
      setCart([]);
      setPhoneNumber("");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Что-то пошло не так. Попробуйте снова.");
    },
  });

  const handleCheckout = () => {
    checkoutMutation.mutate();
  };

  if (orgLoading) {
    return (
      <>
        <Seo
          title={seoTitle}
          description={seoDescription}
          path={location.pathname}
          robots={seoRobots}
          type="website"
          jsonLd={seoJsonLd}
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        </div>
      </>
    );
  }

  if (orgError || !orgData) {
    const isDisabled = orgError && 
      typeof orgError === 'object' && 
      'response' in orgError && 
      (orgError.response as unknown as { status: number })?.status === 403;

    return (
      <>
        <Seo
          title={seoTitle}
          description={seoDescription}
          path={location.pathname}
          robots={seoRobots}
          type="website"
          jsonLd={seoJsonLd}
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              {isDisabled ? "Магазин недоступен" : "Магазин не найден"}
            </h1>
            <p className="text-muted-foreground">
              {isDisabled 
                ? `Интернет-магазин ${retailName} в настоящее время отключен. Пожалуйста, свяжитесь с владельцем магазина.`
                : `Не удалось найти магазин: ${retailName}`
              }
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={location.pathname}
        robots={seoRobots}
        type="website"
        jsonLd={seoJsonLd}
      />
      <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {orgData?.logo && (
                <img
                  src={orgData.logo}
                  alt={orgData.name}
                  className="h-10 w-auto"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{orgData?.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {inventory.length} товаров
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Cart Button */}
            <Button
              variant="outline"
              className="relative"
              onClick={() => {
                setIsCartOpen(true);
                setOrderSuccess(false);
              }}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              <span className="font-semibold">{formatNumber(cartTotal)}</span>
              {cart.length > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
                >
                  {cart.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Корзина</DialogTitle>
          </DialogHeader>
          
          {orderSuccess ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Заказ оформлен!</h3>
              <p className="text-muted-foreground">Спасибо за ваш заказ.</p>
              <p className="text-sm text-muted-foreground mt-1">Мы свяжемся с вами в ближайшее время.</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ваша корзина пуста</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {cart.map((cartItem) => {
                    const variation = cartItem.item.product_variation;
                    const imageUrl = normalizeImageUrl(variation.image_url ?? variation.product.image_url);
                    
                    return (
                      <div
                        key={cartItem.item.id}
                        className="flex gap-4 p-4 border rounded-lg"
                      >
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={variation.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {variation.product.name}
                          </h3>
                          {variation.name && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                              {variation.name}
                            </p>
                          )}
                          <p className="text-sm font-semibold">
                            {formatNumber(variation.selling_price)}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end justify-between">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleRemoveFromCart(cartItem.item.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>

                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateQuantity(
                                  cartItem.item.id,
                                  cartItem.quantity - 1
                                )
                              }
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {cartItem.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateQuantity(
                                  cartItem.item.id,
                                  cartItem.quantity + 1
                                )
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <p className="text-sm font-bold">
                            {formatNumber(variation.selling_price * cartItem.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Cart Summary */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Итого</span>
                  <span className="text-2xl font-bold">
                    {formatNumber(cartTotal)}
                  </span>
                </div>
                
                {/* Phone Number Input */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Телефон для доставки
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={!phoneNumber.trim() || checkoutMutation.isPending}
                  onClick={handleCheckout}
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    "Оформить заказ"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Products Grid */}
        {inventoryQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full h-48" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12">
            <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "Товары не найдены" : "Нет доступных товаров"}
            </h3>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Попробуйте другой поисковый запрос
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inventory.map((item) => {
                const variation = item.product_variation;
                const imageUrl = normalizeImageUrl(variation.image_url ?? variation.product.image_url);
                const isService = item.is_service || variation.product?.type === "service";
                const inCart = cart.find((c) => c.item.id === item.id);

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="relative bg-muted h-48 overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={variation.product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Package2 className="w-12 h-12" />
                            <span className="text-xs">Нет фото</span>
                          </div>
                        </div>
                      )}

                      {/* Stock Badge */}
                      {!isService && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant="secondary"
                            className={
                              item.quantity_in_stock === 0
                                ? "bg-destructive/10 text-destructive"
                                : item.quantity_in_stock <= 5
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                            }
                          >
                            {item.quantity_in_stock === 0
                              ? "Нет в наличии"
                              : item.quantity_in_stock <= 5
                                ? "Мало на складе"
                                : "В наличии"}
                          </Badge>
                        </div>
                      )}

                      {/* In Cart Badge */}
                      {inCart && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="default">
                            В корзине: {inCart.quantity}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      {/* Product Name */}
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                        {variation.product.name}
                      </h3>

                      {/* Variation Name */}
                      {variation.name && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {variation.name}
                        </p>
                      )}

                      {/* Category */}
                      {variation.product.product_category && (
                        <Badge variant="outline" className="text-xs mb-3">
                          {variation.product.product_category.name}
                        </Badge>
                      )}

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Цена</p>
                          <p className="text-lg font-bold">
                            {formatNumber(variation.selling_price)}
                          </p>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="w-full"
                        size="sm"
                        disabled={!isService && item.quantity_in_stock === 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        В корзину
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Infinite Scroll Trigger */}
            {inventoryQuery.hasNextPage && (
              <div
                ref={observerTarget}
                className="flex justify-center py-8"
              >
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
}
