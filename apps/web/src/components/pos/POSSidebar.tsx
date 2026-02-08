import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    BadgePercent,
    Gift,
    Minus,
    Plus,
    ShoppingCart,
    Users,
    X,
    Search,
    User,
    Check,
} from "lucide-react";
import { usePOSStore } from "@/context/POSStore";
import { SessionQueue } from "@/components/pos/SessionQueue";
import { PauseSessionButton } from "@/components/pos/PauseSessionButton";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const QUICK_DISCOUNTS = [10, 20, 30];

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    loyalty_card: {
        id: string;
        points: number;
    } | null;
}

interface POSSidebarProps {
    storeCurrency: string;
    customers: Customer[];
    onCheckout: () => void;
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;
    isDebtSale: boolean;
    setIsDebtSale: (isDebtSale: boolean) => void;
    className?: string;
}

export function POSSidebar({
    storeCurrency,
    customers,
    onCheckout,
    selectedCustomer,
    setSelectedCustomer,
    isDebtSale,
    setIsDebtSale,
    className,
}: POSSidebarProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || "ru-RU";


    // Local state
    const [customerSearch, setCustomerSearch] = useState("");
    const [customDiscount, setCustomDiscount] = useState("");
    const [redeemPointsInput, setRedeemPointsInput] = useState("");
    const loyaltyPointValue = 1;

    const {
        cart,
        removeFromCart,
        updateCartQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        getCartItemCount,
        getCartTotal,
        discount,
        setDiscount,
        clearDiscount,
        getDiscountAmount,
        getFinalTotal,
        loyaltyRedemption,
        setLoyaltyRedemption,
        clearLoyaltyRedemption,
        is_processing_transaction: isProcessing,
        paymentMethods,
    } = usePOSStore();

    const cartItemCount = getCartItemCount();
    const subtotal = getCartTotal();
    const discountAmount = getDiscountAmount();
    const loyaltyDiscountAmount = loyaltyRedemption?.amount ?? 0;
    const total = getFinalTotal();

    const maxRedeemablePoints = Math.max(
        selectedCustomer?.loyalty_card?.points ?? 0,
        0
    );
    const loyaltyBalanceValue = maxRedeemablePoints * Math.max(loyaltyPointValue, 1);
    const remainingTotalBeforeLoyalty = Math.max(subtotal - discountAmount, 0);
    const loyaltyApplied =
        Boolean(loyaltyRedemption) &&
        Boolean(
            selectedCustomer && loyaltyRedemption?.customerId === selectedCustomer.id
        );

    // Filter customers for search
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return [];
        const query = customerSearch.toLowerCase();
        return customers.filter((customer) => {
            return (
                customer.name.toLowerCase().includes(query) ||
                (customer.email && customer.email.toLowerCase().includes(query)) ||
                (customer.phone && customer.phone.includes(query))
            );
        });
    }, [customers, customerSearch]);

    useEffect(() => {
        if (
            loyaltyRedemption &&
            (!selectedCustomer ||
                loyaltyRedemption.customerId !== selectedCustomer.id)
        ) {
            clearLoyaltyRedemption();
            setRedeemPointsInput("");
        }
    }, [selectedCustomer, loyaltyRedemption, clearLoyaltyRedemption]);

    const handleApplyCustomDiscount = () => {
        const value = Number.parseFloat(customDiscount);
        if (Number.isNaN(value) || value <= 0) {
            toast.error(t("pos.invalidDiscount"));
            return;
        }
        if (value > subtotal) {
            toast.error(t("pos.discountExceedsTotal"));
            return;
        }
        setDiscount({ type: "amount", value });
        setCustomDiscount("");
    };

    const handleApplyLoyaltyRedemption = () => {
        if (!selectedCustomer) {
            toast.error(t("pos.loyaltySelectCustomer"));
            return;
        }
        if (maxRedeemablePoints <= 0) {
            toast.error(t("pos.loyaltyNoBalance"));
            return;
        }
        const parsedPoints = Number.parseInt(redeemPointsInput, 10);
        if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
            toast.error(t("pos.enterValidPoints"));
            return;
        }
        if (parsedPoints > maxRedeemablePoints) {
            toast.error(t("pos.loyaltyInsufficientPoints"));
            return;
        }
        const pointValue = Math.max(loyaltyPointValue, 1);
        const potentialAmount = parsedPoints * pointValue;
        const cappedAmount = Math.min(potentialAmount, remainingTotalBeforeLoyalty);
        if (cappedAmount <= 0) {
            toast.error(t("pos.loyaltyExceedsTotal"));
            return;
        }
        const maxPointsByAmount = Math.floor(cappedAmount / pointValue);
        if (maxPointsByAmount <= 0) {
            toast.error(t("pos.loyaltyExceedsTotal"));
            return;
        }
        const appliedPoints = Math.min(parsedPoints, maxPointsByAmount);
        setLoyaltyRedemption({
            customerId: selectedCustomer.id,
            points: appliedPoints,
            amount: appliedPoints * pointValue,
        });
        setRedeemPointsInput("");
    };

    const handleClearLoyaltyRedemption = () => {
        clearLoyaltyRedemption();
        setRedeemPointsInput("");
    };

    const handleDebtToggle = (next: boolean) => {
        if (next && !selectedCustomer) {
            toast.error(t("pos.debtCustomerRequired"));
            return;
        }
        if (next) {
            clearLoyaltyRedemption();
            setRedeemPointsInput("");
        }
        setIsDebtSale(next);
    };

    return (
        <div className={`flex h-full flex-col overflow-hidden border-l border-border/60 bg-background ${className}`}>
            <div className="flex h-16 items-center justify-between px-6">
                <div className="space-y-0.5">
                    <h3 className="text-lg font-semibold">{t("pos.orderSummary", { defaultValue: "Order summary" })}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t("pos.cartItems", {
                            defaultValue: "{{count}} items",
                            count: cartItemCount,
                        })}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        clearCart();
                        setSelectedCustomer(null);
                    }}
                    disabled={cart.length === 0}
                >
                    {t("pos.clearCart")}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">


                    <section className="rounded-2xl border border-border/60 bg-muted/10">
                        {cart.length === 0 ? (
                            <div className="flex h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                                <ShoppingCart className="size-8" />
                                <p>{t("pos.emptyCart")}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {cart.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex flex-1 flex-col gap-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-foreground">
                                                        {item.product_variation.product.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.product_variation.name}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeFromCart(item.id)}
                                                    aria-label={t("pos.removeItem")}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => decrementQuantity(item.id)}
                                                        aria-label={t("pos.decreaseQuantity")}
                                                    >
                                                        <Minus className="size-4" />
                                                    </Button>
                                                    <Input
                                                        value={item.cart_quantity}
                                                        onChange={(event) =>
                                                            updateCartQuantity(
                                                                item.id,
                                                                Number.parseInt(event.target.value, 10) || 0
                                                            )
                                                        }
                                                        className="w-20 text-center"
                                                        min={1}
                                                        max={item.quantity_in_stock}
                                                        type="number"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => incrementQuantity(item.id)}
                                                        aria-label={t("pos.increaseQuantity")}
                                                    >
                                                        <Plus className="size-4" />
                                                    </Button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatNumber(item.quantity_in_stock, locale)}{" "}
                                                        {t("inventory.inStock")}
                                                    </p>
                                                    <p className="text-base font-semibold text-foreground">
                                                        {formatCurrency(
                                                            item.product_variation.selling_price *
                                                            item.cart_quantity,
                                                            storeCurrency,
                                                            locale
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <Accordion
                        type="multiple"
                        defaultValue={["customers", "discount", "loyalty"]}
                        className="space-y-4"
                    >
                        <AccordionItem
                            value="customers"
                            className="overflow-hidden rounded-2xl border border-border/60 bg-muted/10"
                        >
                            <AccordionTrigger className="px-4 py-3 text-left text-sm font-medium">
                                <span className="flex items-center gap-2 text-foreground">
                                    <Users className="size-4" />
                                    {t("customers.title")}
                                    {selectedCustomer ? (
                                        <span className="text-xs text-muted-foreground">
                                            • {selectedCustomer.name}
                                        </span>
                                    ) : null}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-0">
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={customerSearch}
                                            onChange={(event) => setCustomerSearch(event.target.value)}
                                            placeholder={t("customers.searchCustomers", {
                                                defaultValue: "Search customers",
                                            })}
                                            className="pl-9"
                                        />
                                    </div>

                                    {/* Customer Search Results List */}
                                    {customerSearch.trim() && !selectedCustomer && (
                                        <div className="max-h-[200px] overflow-y-auto rounded-md border border-border bg-background shadow-sm">
                                            {filteredCustomers.length === 0 ? (
                                                <div className="p-3 text-sm text-muted-foreground text-center">
                                                    {t("customers.noCustomers", { defaultValue: "No customers found" })}
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border/50">
                                                    {filteredCustomers.map((customer) => (
                                                        <button
                                                            key={customer.id}
                                                            className="flex w-full items-center gap-3 p-3 text-left text-sm hover:bg-muted/50 transition-colors"
                                                            onClick={() => {
                                                                setSelectedCustomer(customer);
                                                                setCustomerSearch("");
                                                            }}
                                                        >
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{customer.name}</p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {customer.phone || customer.email || t("common.noContact")}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedCustomer && (
                                        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{selectedCustomer.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {selectedCustomer.phone || selectedCustomer.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => setSelectedCustomer(null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                            value="discount"
                            className="overflow-hidden rounded-2xl border border-border/60 bg-muted/10"
                        >
                            <AccordionTrigger className="px-4 py-3 text-left text-sm font-medium">
                                <span className="flex items-center gap-2 text-foreground">
                                    <BadgePercent className="size-4" />
                                    {t("pos.discount")}
                                    {discount ? (
                                        <span className="text-xs text-muted-foreground">
                                            •{" "}
                                            {discount.type === "percentage"
                                                ? `${discount.value}%`
                                                : formatCurrency(discount.value, storeCurrency, locale)}
                                        </span>
                                    ) : null}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-0">
                                <div className="space-y-4">
                                    <ToggleGroup
                                        type="single"
                                        value={
                                            discount?.type === "percentage"
                                                ? String(discount.value)
                                                : ""
                                        }
                                        onValueChange={(value) => {
                                            if (value) {
                                                setDiscount({
                                                    type: "percentage",
                                                    value: Number.parseInt(value, 10),
                                                });
                                            }
                                        }}
                                        className="flex flex-wrap gap-2"
                                    >
                                        {QUICK_DISCOUNTS.map((value) => (
                                            <ToggleGroupItem key={value} value={String(value)}>
                                                {value}%
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                        <Input
                                            value={customDiscount}
                                            onChange={(event) => setCustomDiscount(event.target.value)}
                                            placeholder={t("pos.customAmount")}
                                            type="number"
                                            min={0}
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <Button size="sm" variant="ghost" onClick={clearDiscount}>
                                            {t("pos.removeDiscount")}
                                        </Button>
                                        <Button
                                            onClick={handleApplyCustomDiscount}
                                            disabled={!customDiscount}
                                        >
                                            {t("pos.applyDiscount")}
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem
                            value="loyalty"
                            className="overflow-hidden rounded-2xl border border-border/60 bg-muted/10"
                        >
                            <AccordionTrigger className="px-4 py-3 text-left text-sm font-medium">
                                <span className="flex items-center gap-2 text-foreground">
                                    <Gift className="size-4" />
                                    {t("pos.loyaltyHeading", { defaultValue: "Loyalty points" })}
                                    {loyaltyApplied && loyaltyRedemption ? (
                                        <Badge variant="secondary" className="ml-2">
                                            {t("pos.pointsApplied", {
                                                defaultValue: "{{points}} pts applied",
                                                points: loyaltyRedemption.points,
                                            })}
                                        </Badge>
                                    ) : null}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-0">
                                {selectedCustomer ? (
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">
                                                    {t("pos.loyaltyBalance", { defaultValue: "Balance" })}
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {t("pos.pointsValue", {
                                                        defaultValue: "{{points}} pts",
                                                        points: maxRedeemablePoints,
                                                    })}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                ≈{" "}
                                                {formatCurrency(
                                                    loyaltyBalanceValue,
                                                    storeCurrency,
                                                    locale
                                                )}
                                                {" · "}
                                                {t("pos.loyaltyRate", {
                                                    defaultValue: "1 pt = {{value}}",
                                                    value: formatCurrency(
                                                        Math.max(loyaltyPointValue, 1),
                                                        storeCurrency,
                                                        locale
                                                    ),
                                                })}
                                            </div>
                                        </div>
                                        {maxRedeemablePoints > 0 ? (
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    {t("pos.pointsToRedeem", {
                                                        defaultValue: "Points to redeem",
                                                    })}
                                                </label>
                                                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={redeemPointsInput}
                                                        onChange={(event) =>
                                                            setRedeemPointsInput(event.target.value)
                                                        }
                                                        placeholder={t("pos.enterPoints", {
                                                            defaultValue: "Enter points",
                                                        })}
                                                    />
                                                    <Button
                                                        onClick={handleApplyLoyaltyRedemption}
                                                        disabled={cart.length === 0}
                                                    >
                                                        {t("pos.applyPoints", {
                                                            defaultValue: "Apply points",
                                                        })}
                                                    </Button>
                                                </div>
                                                {loyaltyApplied ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-foreground"
                                                        onClick={handleClearLoyaltyRedemption}
                                                    >
                                                        {t("pos.clearLoyalty", {
                                                            defaultValue: "Remove loyalty discount",
                                                        })}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                {t("pos.noLoyaltyPoints", {
                                                    defaultValue: "This customer has no points yet.",
                                                })}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        {t("pos.loyaltySelectCustomer", {
                                            defaultValue: "Select a customer to redeem points.",
                                        })}
                                    </p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>


            <div className="px-6">
                <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-4 my-2">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {t("pos.debtSale", { defaultValue: "Debt sale" })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t("pos.debtSaleDescription", {
                                    defaultValue:
                                        "Release inventory without payment and track the customer's debt.",
                                })}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant={isDebtSale ? "default" : "outline"}
                            onClick={() => handleDebtToggle(!isDebtSale)}
                            className="shrink-0"
                        >
                            {isDebtSale
                                ? t("common.on", { defaultValue: "On" })
                                : t("common.off", { defaultValue: "Off" })}
                        </Button>
                    </div>
                    {isDebtSale && !selectedCustomer ? (
                        <p className="text-xs font-medium text-destructive">
                            {t("pos.debtCustomerRequired", {
                                defaultValue: "Select a customer to enable debt sales.",
                            })}
                        </p>
                    ) : null}
                </div>
            </div>

            <Separator />

            <div className="space-y-4 px-6 py-6">
                <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span>{t("pos.subtotal")}</span>
                        <span>{formatCurrency(subtotal, storeCurrency, locale)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>{t("pos.discount")}</span>
                        <span>
                            -{formatCurrency(discountAmount, storeCurrency, locale)}
                        </span>
                    </div>
                    {loyaltyDiscountAmount > 0 ? (
                        <div className="flex items-center justify-between">
                            <span>
                                {t("pos.loyaltyDiscount", {
                                    defaultValue: "Loyalty discount",
                                })}
                            </span>
                            <span>
                                -
                                {formatCurrency(
                                    loyaltyDiscountAmount,
                                    storeCurrency,
                                    locale
                                )}
                            </span>
                        </div>
                    ) : null}
                    <div className="flex items-center justify-between text-base font-semibold text-foreground">
                        <span>{t("pos.total")}</span>
                        <span>{formatCurrency(total, storeCurrency, locale)}</span>
                    </div>
                </div>

                {/* Session Management Buttons */}
                <div className="flex gap-2 flex-wrap">
                    <PauseSessionButton disabled={isProcessing} />
                    <SessionQueue />
                </div>

                <Button
                    size="lg"
                    className="w-full"
                    onClick={onCheckout}
                    disabled={cart.length === 0 || isProcessing || (!isDebtSale && !Object.values(paymentMethods).some(Boolean))}
                >
                    {isProcessing
                        ? t("payment.paymentInProgress", {
                            defaultValue: "Processing...",
                        })
                        : t("pos.checkout")}
                </Button>
            </div>
        </div>
    );
}
