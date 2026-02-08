import { useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  AlertCircle,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner"

interface AuditItem {
  id: string;
  product_variation_id: string;
  expected_quantity: number;
  counted_quantity?: number;
  discrepancy?: number;
  product_variation?: {
    product?: {
      name: string;
    };
    name: string;
    barcode: string;
  };
}

interface Audit {
  id: string;
  created_at: string;
  status: "in_progress" | "completed" | "cancelled";
  expected_count: number;
  actual_count?: number;
  items: AuditItem[];
  user?: {
    name?: string;
    email: string;
  };
}

export default function AuditDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { auditId } = useParams<{ auditId: string }>();


  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState("");
  const [countedQuantity, setCountedQuantity] = useState<
    Record<string, number>
  >({});
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isCompletingAudit, setIsCompletingAudit] = useState(false);

  // Fetch audit details
  const { data: audit, isLoading: isAuditLoading } = useQuery({
    queryKey: ["audit", auditId],
    queryFn: async () => {
      const response = await api.get<Audit>(`/api/audit/${auditId}`);
      return response;
    },
    enabled: !!auditId,
  });

  // Initialize counted quantities
  const initializeCountedQuantities = useCallback(() => {
    if (audit?.items) {
      const quantities: Record<string, number> = {};
      audit.items.forEach((item) => {
        quantities[item.id] = item.counted_quantity || 0;
      });
      setCountedQuantity(quantities);
    }
  }, [audit?.items]);

  useState(() => {
    initializeCountedQuantities();
  });

  // Mutation to update audit item count
  const updateAuditItemMutation = useMutation({
    mutationFn: async ({
      auditItemId,
      countedQuantity,
    }: {
      auditItemId: string;
      countedQuantity: number;
    }) => {
      await api.put(`/api/audit/${auditId}/item`, {
        item_id: auditItemId,
        counted_quantity: countedQuantity,
      });
    },
  });

  // Mutation to delete audit item
  const deleteAuditItemMutation = useMutation({
    mutationFn: async (auditItemId: string) => {
      await api.delete(`/api/audit/${auditId}/item/${auditItemId}`);
    },
    onSuccess: () => {
      toast.success(t("inventory.itemRemoved", { defaultValue: "Item removed" }));
      setItemToDelete(null);
    },
    onError: () => {
      toast.error(
        t("inventory.removeItemFailed", {
          defaultValue: "Failed to remove item",
        })
      );
    },
  });

  // Mutation to complete audit
  const completeAuditMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/audit/${auditId}/complete`, {});
    },
    onSuccess: () => {
      toast.success(
        t("inventory.auditCompleted", {
          defaultValue: "Audit completed successfully",
        })
      );
      navigate("/inventory/audits");
    },
    onError: () => {
      toast.error(
        t("inventory.auditCompleteFailed", {
          defaultValue: "Failed to complete audit",
        })
      );
    },
  });

  const handleBarcodeScan = async () => {
    if (!barcode.trim()) return;

    try {
      // Find product by barcode
      const response = await api.get<{
        id: string;
        product: { name: string };
        name: string;
      }>(`/api/product-variations?barcode=${encodeURIComponent(barcode)}`);

      if (response.id) {
        // Check if item already exists in audit
        const existingItem = audit?.items?.find(
          (item) => item.product_variation_id === response.id
        );

        if (existingItem) {
          // Increment count for existing item
          const newCount = (countedQuantity[existingItem.id] || 0) + 1;
          setCountedQuantity((prev) => ({
            ...prev,
            [existingItem.id]: newCount,
          }));

          // Update backend
          await updateAuditItemMutation.mutateAsync({
            auditItemId: existingItem.id,
            countedQuantity: newCount,
          });

          toast.success(
            t("inventory.barcodeAdded", {
              defaultValue: `${response.product?.name || response.name
                }: ${newCount}`,
            })
          );
        } else {
          toast.warning(
            t("inventory.productNotInAudit", {
              defaultValue: "Product not in this audit",
            })
          );
        }
      }

      setBarcode("");
      barcodeInputRef.current?.focus();
    } catch (error) {
      toast.error(
        t("inventory.barcodeNotFound", { defaultValue: "Barcode not found" })
      );
      setBarcode("");
      barcodeInputRef.current?.focus();
    }
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setCountedQuantity((prev) => ({
      ...prev,
      [itemId]: Math.max(0, quantity),
    }));
  };

  const handleSaveQuantity = async (auditItemId: string) => {
    const quantity = countedQuantity[auditItemId] || 0;
    try {
      await updateAuditItemMutation.mutateAsync({
        auditItemId,
        countedQuantity: quantity,
      });

      toast.success(
        t("inventory.quantityUpdated", { defaultValue: "Quantity updated" })
      );
    } catch (error) {
      toast.error(
        t("inventory.updateFailed", { defaultValue: "Failed to update" })
      );
    }
  };

  const handleCompleteAudit = async () => {
    setIsCompletingAudit(true);
    try {
      await completeAuditMutation.mutateAsync();
    } finally {
      setIsCompletingAudit(false);
    }
  };

  if (isAuditLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="text-center py-12">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t("common.notFound", { defaultValue: "Not found" })}
          </p>
        </div>
      </div>
    );
  }

  const discrepancyItems = (audit.items || []).filter(
    (item) => item.discrepancy !== 0 && item.discrepancy !== undefined
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/inventory/audits")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">
            {t("inventory.auditDetail", { defaultValue: "Audit Details" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {auditId}
            {audit.created_at && !isNaN(new Date(audit.created_at).getTime())
              ? ` • ${format(new Date(audit.created_at), "PPpp")}`
              : ""}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            audit.status === "completed"
              ? "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : audit.status === "in_progress"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                : "bg-red-50 text-red-700 dark:bg-destructive/10 dark:text-destructive"
          }
        >
          {audit.status === "completed"
            ? t("common.completed", { defaultValue: "Completed" })
            : audit.status === "in_progress"
              ? t("common.inProgress", { defaultValue: "In Progress" })
              : audit.status === "cancelled"
                ? t("common.cancelled", { defaultValue: "Cancelled" })
                : audit.status || "-"}
        </Badge>
      </div>

      {/* Scanner Card */}
      {audit.status === "in_progress" && (
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("inventory.scanBarcode", { defaultValue: "Scan Barcode" })}
            </CardTitle>
            <CardDescription>
              {t("inventory.scanBarcodeDesc", {
                defaultValue:
                  "Scan product barcodes to count items in this audit",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="flex gap-2">
              <Input
                ref={barcodeInputRef}
                placeholder={t("inventory.barcodeInputPlaceholder", {
                  defaultValue: "Scan barcode...",
                })}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleBarcodeScan();
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleBarcodeScan} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("common.add", { defaultValue: "Add" })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("inventory.summary", { defaultValue: "Summary" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              {t("inventory.itemsExpected", { defaultValue: "Items Expected" })}
            </span>
            <span className="text-2xl font-bold">
              {(audit.items || []).reduce(
                (sum, item) => sum + (item.expected_quantity || 0),
                0
              )}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              {t("inventory.itemsCounted", { defaultValue: "Items Counted" })}
            </span>
            <span className="text-2xl font-bold">
              {(audit.items || []).reduce(
                (sum, item) => sum + (countedQuantity[item.id] || 0),
                0
              )}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              {t("inventory.discrepancies", { defaultValue: "Discrepancies" })}
            </span>
            <span className="text-2xl font-bold text-destructive">
              {discrepancyItems.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              {t("inventory.totalItems", { defaultValue: "Total Items" })}
            </span>
            <span className="text-2xl font-bold">
              {(audit.items || []).length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("inventory.items", { defaultValue: "Items" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("inventory.product", { defaultValue: "Product" })}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("inventory.expected", { defaultValue: "Expected" })}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("inventory.counted", { defaultValue: "Counted" })}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("inventory.variance", { defaultValue: "Variance" })}
                  </TableHead>
                  {audit.status === "in_progress" && (
                    <TableHead className="text-right">
                      {t("common.actions", { defaultValue: "Actions" })}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(audit.items || []).map((item) => {
                  const counted = countedQuantity[item.id] || 0;
                  const variance = counted - (item.expected_quantity || 0);
                  const hasDiscrepancy = variance !== 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {item.product_variation?.product?.name ||
                              t("common.unknown", {
                                defaultValue: "(Unknown)",
                              })}
                          </span>
                          {item.product_variation?.name && (
                            <span className="text-xs text-muted-foreground">
                              {item.product_variation.name}
                            </span>
                          )}
                          {item.product_variation?.barcode && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {item.product_variation.barcode}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.expected_quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {audit.status === "in_progress" ? (
                          <Input
                            type="number"
                            min="0"
                            value={counted}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 text-right"
                          />
                        ) : (
                          <span className="font-mono">{counted}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasDiscrepancy ? (
                          <Badge
                            variant="outline"
                            className={
                              variance > 0
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }
                          >
                            {variance > 0 ? "+" : ""}
                            {variance}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {audit.status === "in_progress" && (
                        <TableCell className="text-right gap-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveQuantity(item.id)}
                            disabled={
                              updateAuditItemMutation.isPending ||
                              countedQuantity[item.id] === item.counted_quantity
                            }
                            className="gap-2"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setItemToDelete(item.id)}
                            disabled={deleteAuditItemMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancies Warning */}
      {discrepancyItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="h-5 w-5" />
              {t("inventory.discrepanciesDetected", {
                defaultValue: "Discrepancies Detected",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-900">
              {discrepancyItems.map((item) => {
                const variance =
                  (countedQuantity[item.id] || 0) -
                  (item.expected_quantity || 0);
                return (
                  <li key={item.id} className="flex items-center gap-2">
                    {variance > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    {item.product_variation?.product?.name ||
                      t("common.unknown", { defaultValue: "(Unknown)" })}
                    : {variance > 0 ? "+" : ""}
                    {variance} {t("common.items", { defaultValue: "items" })}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {audit.status === "in_progress" && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/inventory/audits")}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            onClick={handleCompleteAudit}
            disabled={isCompletingAudit}
            className="gap-2 flex-1"
          >
            {isCompletingAudit && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("inventory.completeAudit", {
              defaultValue: "Complete Audit",
            })}
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {t("inventory.removeItem", { defaultValue: "Remove Item?" })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("inventory.removeItemDesc", {
              defaultValue:
                "This item will be removed from the audit. This action cannot be undone.",
            })}
          </AlertDialogDescription>
          <div className="gap-3 flex justify-end">
            <AlertDialogCancel>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  deleteAuditItemMutation.mutate(itemToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.remove", { defaultValue: "Remove" })}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
