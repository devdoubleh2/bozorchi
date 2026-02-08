import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";

type LowStockItem = {
  id: string;
  product_variation_id: string;
  quantity_in_stock: number;
  store_id: string;
  created_at: string;
  updated_at: string;
  product_variation: {
    id: string;
    name: string;
    description: string;
    barcode: string;
    sku: string;
    price: number;
    selling_price: number;
    unit_id: string;
    product_id: string;
    store_id: string;
    image_url: string;
    color: string;
    created_at: string;
    updated_at: string;
    supplier_id: string | null;
    product: {
      id: string;
      name: string;
      image_url: string;
      category_id: string;
      product_category_id: string;
      store_id: string;
      user_id: string;
      created_at: string;
      updated_at: string;
      category: {
        id: string;
        code: string;
        name: string;
        name_ru: string;
        name_uz: string;
        created_at: string;
        updated_at: string;
      };
    };
    unit: {
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      store_id: string;
    };
  };
};

const LowStockPage = () => {
  const { t } = useTranslation();
  const { userStore } = useAuth();
  const navigate = useNavigate();
  const storeId = userStore?.store_id;

  const { data: lowStockData, isLoading } = useQuery({
    queryKey: ["low-stock", storeId],
    queryFn: async () => {
      if (!storeId) return [] as LowStockItem[];
      const res = await api.get<{ lowStockItems: LowStockItem[] }>(
        `/api/inventory/low-stock?storeId=${encodeURIComponent(storeId)}`
      );
      return res.lowStockItems;
    },
    enabled: Boolean(storeId),
  });

  const getStockStatusTranslation = (quantity: number) => {
    if (quantity === 0) return t("inventory.outOfStock");
    if (quantity <= 5) return t("inventory.lowStock");
    return t("inventory.inStock");
  };

  const getStatusBadgeClass = (quantity: number) => {
    if (quantity === 0) return "bg-destructive/10 text-destructive";
    if (quantity <= 5)
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  };

  const legacyLowStockItems =
    (lowStockData as unknown as { lowStockItems?: LowStockItem[] } | undefined)
      ?.lowStockItems;
  const lowStockItems = Array.isArray(lowStockData)
    ? lowStockData
    : Array.isArray(legacyLowStockItems)
    ? legacyLowStockItems
    : [];

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <h1 className="text-lg font-medium md:text-xl">
          {t("inventory.lowStock", { defaultValue: "Low Stock Items" })}
        </h1>
      </header>
      <main className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-md border bg-card text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border bg-card text-sm text-muted-foreground">
            {t("inventory.noLowStockItems", {
              defaultValue: "No low stock items found",
            })}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-card">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("inventory.table.name")}</TableHead>
                    <TableHead>{t("inventory.table.category")}</TableHead>
                    <TableHead>{t("inventory.table.stockStatus")}</TableHead>
                    <TableHead>{t("inventory.table.currentStock")}</TableHead>
                    <TableHead>{t("inventory.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product_variation.product.name}
                      </TableCell>
                      <TableCell>
                        {item.product_variation.product.category.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadgeClass(
                            item.quantity_in_stock
                          )}
                        >
                          {getStockStatusTranslation(item.quantity_in_stock)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.quantity_in_stock}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() =>
                            navigate(
                              `/inventory/restock/${item.product_variation.product_id}`,
                              {
                                state: {
                                  restockProductName:
                                    item.product_variation.product.name,
                                },
                              }
                            )
                          }
                          size="sm"
                        >
                          {t("inventory.restock", { defaultValue: "Restock" })}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LowStockPage;
