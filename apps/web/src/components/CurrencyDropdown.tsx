import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Banknote,
    Check,
    Plus,
    Loader2,
    Pencil,
    Trash2,
    MoreHorizontal,
    RefreshCw,
} from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { toast } from "sonner";

interface Currency {
    id: string;
    store_id: string;
    code: string;
    symbol: string;
    name: string;
    rate: number;
    is_base: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface CurrencyFormData {
    code: string;
    symbol: string;
    name: string;
    rate: string;
    is_base: boolean;
    is_active: boolean;
}

const defaultFormData: CurrencyFormData = {
    code: "",
    symbol: "",
    name: "",
    rate: "1",
    is_base: false,
    is_active: true,
};

interface CurrencyDropdownProps {
    className?: string;
}

export function CurrencyDropdown({ className }: CurrencyDropdownProps) {
    const { t } = useTranslation();
    const { userStore } = useAuth();
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
    const [deletingCurrency, setDeletingCurrency] = useState<Currency | null>(null);
    const [formData, setFormData] = useState<CurrencyFormData>(defaultFormData);

    const isOwnerRole = userStore?.role === "owner";

    // Fetch currencies
    const { data: currencies = [], isLoading } = useQuery({
        queryKey: ["currencies"],
        queryFn: async () => {
            const response = await api.get<{ currencies: Currency[] }>("/api/currencies");
            return response.currencies;
        },
        staleTime: 1000 * 60 * 5,
    });

    const baseCurrency = useMemo(
        () => currencies.find((c) => c.is_base),
        [currencies]
    );

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: CurrencyFormData) => {
            return api.post("/api/currencies", {
                code: data.code,
                symbol: data.symbol,
                name: data.name,
                rate: Number(data.rate),
                is_base: data.is_base,
                is_active: data.is_active,
            });
        },
        onSuccess: () => {
            toast.success(t("currencies.created", { defaultValue: "Currency created" }));
            setDialogOpen(false);
            setFormData(defaultFormData);
            queryClient.invalidateQueries({ queryKey: ["currencies"] });
        },
        onError: (error: Error) => {
            toast.error(
                error.message ||
                t("currencies.createFailed", { defaultValue: "Failed to create currency" })
            );
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: CurrencyFormData }) => {
            return api.put(`/api/currencies/${id}`, {
                code: data.code,
                symbol: data.symbol,
                name: data.name,
                rate: Number(data.rate),
                is_base: data.is_base,
                is_active: data.is_active,
            });
        },
        onSuccess: () => {
            toast.success(t("currencies.updated", { defaultValue: "Currency updated" }));
            setDialogOpen(false);
            setEditingCurrency(null);
            setFormData(defaultFormData);
            queryClient.invalidateQueries({ queryKey: ["currencies"] });
        },
        onError: (error: Error) => {
            toast.error(
                error.message ||
                t("currencies.updateFailed", { defaultValue: "Failed to update currency" })
            );
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/api/currencies/${id}`);
        },
        onSuccess: () => {
            toast.success(t("currencies.deleted", { defaultValue: "Currency deleted" }));
            setDeleteDialogOpen(false);
            setDeletingCurrency(null);
            queryClient.invalidateQueries({ queryKey: ["currencies"] });
        },
        onError: (error: Error) => {
            toast.error(
                error.message ||
                t("currencies.deleteFailed", { defaultValue: "Failed to delete currency" })
            );
        },
    });

    // Set base currency mutation
    const setBaseMutation = useMutation({
        mutationFn: async (currencyId: string) => {
            await api.put(`/api/currencies/${currencyId}`, { is_base: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["currencies"] });
            toast.success(t("currencies.baseCurrencyUpdated", { defaultValue: "Base currency updated" }));
        },
        onError: () => {
            toast.error(t("currencies.baseCurrencyFailed", { defaultValue: "Failed to update base currency" }));
        },
    });

    const handleOpenCreate = () => {
        setEditingCurrency(null);
        setFormData(defaultFormData);
        setOpen(false);
        setDialogOpen(true);
    };

    const handleOpenEdit = (currency: Currency, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCurrency(currency);
        setFormData({
            code: currency.code,
            symbol: currency.symbol,
            name: currency.name,
            rate: currency.rate.toString(),
            is_base: currency.is_base,
            is_active: currency.is_active,
        });
        setOpen(false);
        setDialogOpen(true);
    };

    const handleOpenDelete = (currency: Currency, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingCurrency(currency);
        setOpen(false);
        setDeleteDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.code.trim() || !formData.name.trim()) {
            toast.error(
                t("currencies.requiredFields", { defaultValue: "Code and Name are required" })
            );
            return;
        }

        if (editingCurrency) {
            updateMutation.mutate({ id: editingCurrency.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = () => {
        if (deletingCurrency) {
            deleteMutation.mutate(deletingCurrency.id);
        }
    };

    const handleCurrencySelect = (currency: Currency) => {
        if (!currency.is_base && isOwnerRole) {
            setBaseMutation.mutate(currency.id);
        }
        setOpen(false);
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    // Only render for owners
    if (!isOwnerRole) {
        return null;
    }

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2 px-2.5", className)}
                        aria-label={t("currencies.selectCurrency", { defaultValue: "Select currency" })}
                    >
                        <Banknote className="h-4 w-4" />
                        <span className="hidden sm:inline text-sm font-medium">
                            {isLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                baseCurrency?.code || "UZS"
                            )}
                        </span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                    {/* Header */}
                    <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
                        {t("currencies.title", { defaultValue: "Currencies" })}
                    </div>
                    <DropdownMenuSeparator />

                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : currencies.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                            {t("currencies.noCurrencies", { defaultValue: "No currencies yet" })}
                        </div>
                    ) : (
                        <>
                            {currencies.map((currency) => (
                                <div
                                    key={currency.id}
                                    className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm group"
                                >
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 flex-1 text-left"
                                        onClick={() => handleCurrencySelect(currency)}
                                    >
                                        <div className="w-4">
                                            {currency.is_base && <Check className="h-4 w-4 text-primary" />}
                                        </div>
                                        <span className="font-medium text-sm">{currency.code}</span>
                                        <span className="text-muted-foreground text-xs">{currency.symbol}</span>
                                        <span className="text-muted-foreground text-xs ml-auto mr-2">
                                            {currency.is_base ? t("currencies.base", { defaultValue: "Base" }) : `×${currency.rate}`}
                                        </span>
                                    </button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                            <DropdownMenuItem onClick={(e) => handleOpenEdit(currency, e)}>
                                                <Pencil className="mr-2 h-3 w-3" />
                                                {t("common.edit", { defaultValue: "Edit" })}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => handleOpenDelete(currency, e)}
                                                className="text-destructive"
                                                disabled={currency.is_base}
                                            >
                                                <Trash2 className="mr-2 h-3 w-3" />
                                                {t("common.delete", { defaultValue: "Delete" })}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        {t("currencies.addCurrency", { defaultValue: "Add Currency" })}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCurrency
                                ? t("currencies.editCurrency", { defaultValue: "Edit Currency" })
                                : t("currencies.addCurrency", { defaultValue: "Add Currency" })}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCurrency
                                ? t("currencies.editDescription", {
                                    defaultValue: "Update the currency details and exchange rate",
                                })
                                : t("currencies.addDescription", {
                                    defaultValue: "Add a new currency for your store",
                                })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    {t("currencies.code", { defaultValue: "Code" })} *
                                </Label>
                                <Input
                                    id="code"
                                    placeholder="USD"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                                    }
                                    maxLength={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="symbol">
                                    {t("currencies.symbol", { defaultValue: "Symbol" })} *
                                </Label>
                                <Input
                                    id="symbol"
                                    placeholder="$"
                                    value={formData.symbol}
                                    onChange={(e) =>
                                        setFormData((f) => ({ ...f, symbol: e.target.value }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {t("currencies.name", { defaultValue: "Name" })} *
                            </Label>
                            <Input
                                id="name"
                                placeholder="US Dollar"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((f) => ({ ...f, name: e.target.value }))
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rate">
                                {t("currencies.rate", { defaultValue: "Exchange Rate" })} *
                            </Label>
                            <CurrencyInput
                                id="rate"
                                value={formData.rate}
                                onValueChange={(values) =>
                                    setFormData((f) => ({ ...f, rate: values.value }))
                                }
                                decimalScale={4}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t("currencies.rateHelp", {
                                    defaultValue: "1 Base Currency = X This Currency",
                                })}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="isBase"
                                checked={formData.is_base}
                                onCheckedChange={(checked) =>
                                    setFormData((f) => ({ ...f, is_base: checked === true }))
                                }
                                disabled={editingCurrency?.is_base}
                            />
                            <div className="space-y-0.5">
                                <Label htmlFor="isBase">
                                    {t("currencies.isBase", { defaultValue: "Base Currency" })}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {t("currencies.baseDescription", {
                                        defaultValue: "Use this as the main currency for your store",
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="isActive"
                                checked={formData.is_active}
                                onCheckedChange={(checked) =>
                                    setFormData((f) => ({ ...f, is_active: checked === true }))
                                }
                            />
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive">
                                    {t("currencies.active", { defaultValue: "Active" })}
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            {t("common.cancel", { defaultValue: "Cancel" })}
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            {editingCurrency
                                ? t("common.save", { defaultValue: "Save" })
                                : t("common.create", { defaultValue: "Create" })}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t("currencies.deleteConfirmTitle", { defaultValue: "Delete Currency?" })}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("currencies.deleteConfirmDescription", {
                                defaultValue: "This action cannot be undone. You cannot delete the base currency.",
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t("common.cancel", { defaultValue: "Cancel" })}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending && (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t("common.delete", { defaultValue: "Delete" })}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
