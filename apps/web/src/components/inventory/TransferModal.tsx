import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { InventoryItem } from "@/hooks/useInventoryData";
import { toast } from "sonner";

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItems: InventoryItem[];
    onSuccess: () => void;
}

interface Store {
    id: string;
    name: string;
}

export function TransferModal({
    isOpen,
    onClose,
    selectedItems,
    onSuccess,
}: TransferModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [destinationStoreId, setDestinationStoreId] = useState<string>("");
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Initialize quantities with 1 for each item
    useState(() => {
        const initialQuantities: Record<string, number> = {};
        selectedItems.forEach((item) => {
            // Use first variation's ID as key
            if (item.productVariations[0]) {
                initialQuantities[item.productVariations[0].id] = 1;
            }
        });
        setQuantities(initialQuantities);
    });

    const { data: stores, isLoading: isLoadingStores } = useQuery({
        queryKey: ["organization-stores"],
        queryFn: async () => {
            const response = await api.get<{ stores: Store[] }>("/api/stores");
            return response.stores;
        },
        enabled: isOpen,
    });

    const transferMutation = useMutation({
        mutationFn: async (data: {
            items: { variationId: string; quantity: number }[];
            destinationStoreId: string;
        }) => {
            await api.post("/api/inventory/transfer", data);
        },
        onSuccess: () => {
            toast.success(t("inventory.transferSuccess"));
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            onSuccess();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleTransfer = () => {
        if (!destinationStoreId) {
            toast.error(t("inventory.selectDestinationStore"));
            return;
        }

        const itemsToTransfer = selectedItems
            .filter((item) => item.productVariations[0])
            .map((item) => ({
                variationId: item.productVariations[0].id,
                quantity: quantities[item.productVariations[0].id] || 1,
            }));

        transferMutation.mutate({
            items: itemsToTransfer,
            destinationStoreId,
        });
    };

    const handleQuantityChange = (variationId: string, value: string) => {
        const qty = parseInt(value);
        if (!isNaN(qty) && qty > 0) {
            setQuantities((prev) => ({ ...prev, [variationId]: qty }));
        }
    };

    const getItemStock = (item: InventoryItem) => {
        return item.inStock;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t("inventory.transferItems")}</DialogTitle>
                    <DialogDescription>
                        {t("inventory.transferDescription", { count: selectedItems.length })}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="destination-store">
                            {t("inventory.destinationStore")}
                        </Label>
                        <Select
                            value={destinationStoreId}
                            onValueChange={setDestinationStoreId}
                        >
                            <SelectTrigger id="destination-store">
                                <SelectValue
                                    placeholder={
                                        isLoadingStores
                                            ? t("common.loading")
                                            : t("inventory.selectStore")
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {stores?.map((store) => (
                                    <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        <Label>{t("inventory.itemsToTransfer")}</Label>
                        {selectedItems.map((item) => {
                            if (!item.productVariations[0]) return null;
                            const variationId = item.productVariations[0].id;
                            const maxStock = getItemStock(item);

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 border rounded-md"
                                >
                                    <div className="flex-1 truncate mr-2">
                                        <div className="font-medium truncate">{item.name}</div>
                                        <div className="text-sm text-muted-foreground truncate">
                                            {item.productVariations[0].name || "Default"}
                                        </div>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="1"
                                            max={maxStock}
                                            value={quantities[variationId] || 1}
                                            onChange={(e) =>
                                                handleQuantityChange(variationId, e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={transferMutation.isPending || !destinationStoreId}
                    >
                        {transferMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t("inventory.transfer")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
