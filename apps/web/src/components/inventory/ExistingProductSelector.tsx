import { useState } from "react";
import { Search, Package, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface Product {
    id: string;
    name: string;
    image_url?: string | null;
    product_category?: {
        id: string;
        name: string;
    } | null;
    _count?: {
        product_variations: number;
    };
}

interface ExistingProductSelectorProps {
    value: Product | null;
    onChange: (product: Product | null) => void;
    error?: string;
}

export default function ExistingProductSelector({
    value,
    onChange,
    error,
}: ExistingProductSelectorProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const debouncedQuery = useDebounce(searchQuery, 300);

    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ["products-search", debouncedQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedQuery) params.set("q", debouncedQuery);
            params.set("limit", "20");
            const res = await api.get<Product[]>(`/api/products/search?${params}`);
            return res;
        },
        staleTime: 10 * 1000,
        enabled: debouncedQuery.length > 0 || isFocused,
    });

    const handleSelect = (product: Product) => {
        onChange(product);
        setSearchQuery("");
        setIsFocused(false);
    };

    const handleClear = () => {
        onChange(null);
        setSearchQuery("");
    };

    const showResults = isFocused && (searchQuery.length > 0 || products.length > 0);

    return (
        <div className="space-y-2">
            {value ? (
                // Selected product display
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-background border flex items-center justify-center">
                        {value.image_url ? (
                            <img
                                src={value.image_url}
                                alt={value.name}
                                className="w-full h-full object-cover rounded-md"
                            />
                        ) : (
                            <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{value.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {value.product_category && (
                                <Badge variant="secondary" className="text-xs">
                                    {value.product_category.name}
                                </Badge>
                            )}
                            {value._count && (
                                <span>
                                    {t("bulk.productVariationCount", {
                                        count: value._count.product_variations,
                                        defaultValue: "{{count}} variations",
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                // Search input with results
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={t("bulk.searchProducts", { defaultValue: "Search products..." })}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => {
                                // Small delay to allow click on result
                                setTimeout(() => setIsFocused(false), 200);
                            }}
                            className={cn("pl-9", error && "border-destructive")}
                        />
                    </div>

                    {/* Results dropdown */}
                    {showResults && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-[300px] overflow-auto">
                            {isLoading ? (
                                <div className="p-3 text-sm text-muted-foreground text-center">
                                    {t("common.loading", { defaultValue: "Loading..." })}
                                </div>
                            ) : products.length === 0 ? (
                                <div className="p-3 text-sm text-muted-foreground text-center">
                                    {searchQuery
                                        ? t("common.noResults", { defaultValue: "No products found" })
                                        : t("bulk.typeToSearch", { defaultValue: "Type to search products..." })}
                                </div>
                            ) : (
                                <ul className="py-1">
                                    {products.map((product) => (
                                        <li
                                            key={product.id}
                                            onClick={() => handleSelect(product)}
                                            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover rounded"
                                                    />
                                                ) : (
                                                    <Package className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate text-sm">{product.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {product.product_category && (
                                                        <span>{product.product_category.name}</span>
                                                    )}
                                                    {product._count && (
                                                        <span>• {product._count.product_variations} var.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
