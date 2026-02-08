import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    ShoppingBag,
    TrendingUp,
    Trash2,
    User,
    Gift,
    Pencil,
    Wallet,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ru, uz } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { formatNumber, formatCurrency } from "@/lib/format";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useState } from "react";

interface LoyaltyCard {
    id: string;
    points: number;
}

const locales: Record<string, any> = {
    ru,
    uz,
};

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    language: string | null;
    gender: string | null;
    social_links: Record<string, string> | null;
    store_id: string;
    created_at: string;
    updated_at: string;
    loyalty_card: LoyaltyCard | null;
    total_debt?: number;
    _count: {
        transactions: number;
    };
}

interface Transaction {
    id: string;
    transaction_type: "import" | "export" | "return" | "debt" | "repayment";
    total_amount: number;
    created_at: string;
    product_variation?: {
        product: {
            name: string;
        };
    };
    items?: Transaction[];
    returns?: Transaction[];
}



export default function CustomerDetailsPage() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;
    const { customerId } = useParams();
    const navigate = useNavigate();
    const { userStore } = useAuth();
    const queryClient = useQueryClient();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRepaymentSheetOpen, setIsRepaymentSheetOpen] = useState(false);
    const [repaymentAmount, setRepaymentAmount] = useState("");

    const storeId = userStore?.store?.id;

    const { data: customer, isLoading: isCustomerLoading } = useQuery({
        queryKey: ["customer", customerId, storeId],
        queryFn: async () => {
            if (!storeId || !customerId) return null;
            const res = await api.get<{ customer: Customer }>(
                `/api/customers/${customerId}?storeId=${encodeURIComponent(storeId)}`
            );
            return res.customer;
        },
        enabled: !!storeId && !!customerId,
    });

    const { data: transactions } = useQuery({
        queryKey: ["transactions", storeId, customerId],
        queryFn: async () => {
            if (!storeId || !customerId) return [];
            const res = await api.get<{ transactions: Transaction[] }>(
                `/api/transactions?storeId=${encodeURIComponent(storeId)}&customerId=${customerId}`
            );
            return res.transactions || [];
        },
        enabled: !!storeId && !!customerId,
    });



    const deleteCustomerMutation = useMutation({
        mutationFn: async () => {
            if (!storeId || !customerId) return;
            await api.delete(
                `/api/customers/${customerId}?storeId=${encodeURIComponent(storeId)}`
            );
        },
        onSuccess: () => {
            toast.success(t("customers.customerDeleted"));
            navigate("/customers");
        },
        onError: () => {
            toast.error(t("customers.deleteFailed"));
        },
    });

    const repaymentMutation = useMutation({
        mutationFn: async (amount: number) => {
            if (!storeId || !customerId) return;
            await api.post("/api/transactions/debt-repayment", {
                customerId,
                amount,
                storeId,
            });
        },
        onSuccess: () => {
            toast.success(t("transactions.repaymentSuccess", { defaultValue: "Debt repayment recorded" }));
            setIsRepaymentSheetOpen(false);
            setRepaymentAmount("");
            // Refetch customer and transactions to update UI
            queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
            queryClient.invalidateQueries({ queryKey: ["transactions", storeId, customerId] });
        },
        onError: (error) => {
            console.error("Repayment failed", error);
            toast.error(t("transactions.repaymentError"));
        },
    });

    const handleRepaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number.parseFloat(repaymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.warning(t("transactions.invalidAmount"));
            return;
        }
        repaymentMutation.mutate(amount);
    };

    if (isCustomerLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <User className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{t("customers.customerNotFound")}</h2>
                <Button onClick={() => navigate("/customers")}>
                    {t("common.back")}
                </Button>
            </div>
        );
    }

    const totalSpent = transactions?.reduce((sum, t) => sum + (t.transaction_type === 'export' ? t.total_amount : 0), 0) || 0;
    const averageOrderValue = transactions?.length ? totalSpent / transactions.length : 0;

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/customers")}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{t("customers.customerDetails")}</span>
                            <span>•</span>
                            <span className="font-mono text-xs">ID: {customer.id.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/customers/${customer.id}/edit`, { state: { customerName: customer.name } })}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("common.edit")}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("common.delete")}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t("customers.totalSpent")}
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(totalSpent)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t("customers.totalOrders")}
                        </CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transactions?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t("customers.avgOrderValue")}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(averageOrderValue)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t("customers.loyaltyPoints")}
                        </CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customer.loyalty_card?.points || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {customer.loyalty_card ? t("customers.loyaltyMember") : t("customers.notMember")}
                        </p>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setIsRepaymentSheetOpen(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t("customers.totalDebt", { defaultValue: "Total Debt" })}
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${(customer.total_debt || 0) > 0 ? "text-red-500" : ""}`}>
                            {formatNumber(customer.total_debt || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("customers.clickToRepay", { defaultValue: "Click to repay" })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">{t("common.overview")}</TabsTrigger>
                    <TabsTrigger value="transactions">{t("navigation.transactions")}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("customers.contactInfo")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="grid gap-0.5">
                                        <span className="text-sm font-medium leading-none">{t("auth.email")}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {customer.email || t("common.notSpecified")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="grid gap-0.5">
                                        <span className="text-sm font-medium leading-none">{t("storeSetup.phone")}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {customer.phone || t("common.notSpecified")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="grid gap-0.5">
                                        <span className="text-sm font-medium leading-none">{t("profile.memberSince")}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(customer.created_at), "PPP")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="grid gap-0.5">
                                        <span className="text-sm font-medium leading-none">{t("common.gender")}</span>
                                        <span className="text-sm text-muted-foreground capitalize">
                                            {customer.gender ? t(`common.${customer.gender}`) : t("common.notSpecified")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                                        <span className="text-xs font-bold text-muted-foreground">AZ</span>
                                    </div>
                                    <div className="grid gap-0.5">
                                        <span className="text-sm font-medium leading-none">{t("common.language")}</span>
                                        <span className="text-sm text-muted-foreground uppercase">
                                            {customer.language || t("common.notSpecified")}
                                        </span>
                                    </div>
                                </div>
                                {customer.social_links && Object.keys(customer.social_links).length > 0 && (
                                    <div className="pt-2 border-t mt-2">
                                        <span className="text-sm font-medium mb-2 block">{t("customers.socialLinks")}</span>
                                        <div className="grid gap-2">
                                            {Object.entries(customer.social_links as Record<string, string>).map(([platform, handle]) => (
                                                handle ? (
                                                    <div key={platform} className="flex items-center gap-2 text-sm">
                                                        <span className="capitalize text-muted-foreground w-20">{platform}:</span>
                                                        <span>{handle}</span>
                                                    </div>
                                                ) : null
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Loyalty Card Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("customers.loyaltyCard")}</CardTitle>
                                <CardDescription>
                                    {t("customers.loyaltyProgramDescription")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {customer.loyalty_card ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="rounded-lg border p-4 bg-primary/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-muted-foreground">{t("customers.balance")}</span>
                                                <Gift className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="text-3xl font-bold text-primary">
                                                {customer.loyalty_card.points}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {t("customers.points")}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <Gift className="h-10 w-10 text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {t("customers.noLoyaltyCard")}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("navigation.transactions")}</CardTitle>
                            <CardDescription>
                                {t("customers.transactionHistoryDescription")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions && transactions.length > 0 ? (
                                <div className="space-y-4">
                                    {transactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${transaction.transaction_type === 'export' ? 'bg-green-100 text-green-600' :
                                                    transaction.transaction_type === 'return' ? 'bg-orange-100 text-orange-600' :
                                                        transaction.transaction_type === 'debt' ? 'bg-red-100 text-red-600' :
                                                            transaction.transaction_type === 'repayment' ? 'bg-blue-100 text-blue-600' :
                                                                'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {transaction.transaction_type === 'export' ? <TrendingUp className="h-4 w-4" /> :
                                                        transaction.transaction_type === 'return' ? <ArrowLeft className="h-4 w-4" /> :
                                                            transaction.transaction_type === 'debt' ? <CreditCard className="h-4 w-4" /> :
                                                                transaction.transaction_type === 'repayment' ? <Wallet className="h-4 w-4" /> :
                                                                    <ShoppingBag className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium">
                                                        {t(`transactions.types.${transaction.transaction_type}`)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {format(new Date(transaction.created_at), "PPP p", { locale: locales[locale] || ru })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">
                                                    {formatNumber(transaction.transaction_type === 'repayment' ? Math.abs(transaction.total_amount) : transaction.total_amount)}
                                                </div>
                                                <Badge variant="outline">
                                                    {t("transactions.status.completed", { defaultValue: "Completed" })}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t("transactions.noTransactions")}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmationDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={() => deleteCustomerMutation.mutate()}
                title={t("customers.deleteCustomer")}
                description={t("customers.deleteCustomerConfirm")}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
            />

            <Sheet open={isRepaymentSheetOpen} onOpenChange={setIsRepaymentSheetOpen}>
                <SheetContent className="sm:max-w-md p-4">
                    <SheetHeader>
                        <SheetTitle>{t("transactions.repayDebtTitle", { defaultValue: "Repay Debt" })}</SheetTitle>
                        <SheetDescription>
                            {t("transactions.repayDebtDescription", { defaultValue: "Enter the amount to repay for this customer." })}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                        {/* Current Debt Card */}
                        <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">{t("customers.currentDebt", { defaultValue: "Current Debt" })}</span>
                            <div className="text-3xl font-bold text-red-500">
                                {formatCurrency(customer.total_debt || 0, "UZS", locale)}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label htmlFor="repayment-amount">{t("transactions.amount", { defaultValue: "Amount" })}</Label>
                            <div className="relative">
                                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="repayment-amount"
                                    type="number"
                                    value={repaymentAmount}
                                    onChange={(e) => setRepaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-9 pr-20"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => setRepaymentAmount((customer.total_debt || 0).toString())}
                                >
                                    {t("transactions.payFull", { defaultValue: "Pay Full" })}
                                </Button>
                            </div>
                        </div>

                        {/* Remaining Debt Preview */}
                        {repaymentAmount && !isNaN(Number(repaymentAmount)) && (
                            <div className="flex justify-between items-center p-3 rounded-md border border-dashed">
                                <span className="text-sm text-muted-foreground">{t("customers.remainingDebt", { defaultValue: "Remaining Debt" })}</span>
                                <span className="font-medium">
                                    {formatCurrency(Math.max(0, (customer.total_debt || 0) - Number(repaymentAmount)), "UZS", locale)}
                                </span>
                            </div>
                        )}

                        {/* Debt History */}
                        <div className="space-y-3 pt-4 border-t">
                            <h4 className="text-sm font-medium">{t("transactions.debtHistory", { defaultValue: "Debt History" })}</h4>
                            <div className="space-y-2">
                                {transactions
                                    ?.flatMap(t => t.items || [t])
                                    .filter(transaction => transaction.transaction_type === 'debt')
                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                    .slice(0, 20)
                                    .map((transaction) => {
                                        const paidAmount = transaction.returns?.reduce((sum, r) => sum + r.total_amount, 0) || 0;
                                        const isPaid = paidAmount >= transaction.total_amount;
                                        const isPartial = paidAmount > 0 && paidAmount < transaction.total_amount;

                                        return (
                                            <div key={transaction.id} className="flex justify-between items-center text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {transaction.product_variation?.product.name || t("common.unknownProduct", { defaultValue: "Unknown Product" })}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground/70">
                                                        {format(new Date(transaction.created_at), "PPP p", { locale: locales[locale] || ru })}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`font-medium ${isPaid ? "text-green-600" : "text-red-600"}`}>
                                                        {formatCurrency(transaction.total_amount, "UZS", locale)}
                                                    </span>
                                                    <div className="text-[10px]">
                                                        {isPaid ? (
                                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-1 py-0 h-4">
                                                                {t("common.paid", { defaultValue: "Paid" })}
                                                            </Badge>
                                                        ) : isPartial ? (
                                                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 px-1 py-0 h-4">
                                                                {t("common.partial", { defaultValue: "Partial" })} ({formatCurrency(paidAmount, "UZS", locale)})
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-red-400">{t("common.unpaid", { defaultValue: "Unpaid" })}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {(!transactions || transactions.filter(transaction => transaction.transaction_type === 'debt').length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-2">
                                        {t("transactions.noDebts", { defaultValue: "No debt history" })}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Repayment History */}
                        <div className="space-y-3 pt-4 border-t">
                            <h4 className="text-sm font-medium">{t("transactions.repaymentHistory", { defaultValue: "Repayment History" })}</h4>
                            <div className="space-y-2">
                                {transactions
                                    ?.filter(t => t.transaction_type === 'repayment')
                                    .slice(0, 5)
                                    .map((t) => (
                                        <div key={t.id} className="flex justify-between items-center text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-muted-foreground">
                                                    {format(new Date(t.created_at), "PPP", { locale: locales[locale] || ru })}
                                                </span>
                                                <span className="text-xs text-muted-foreground/70">
                                                    {format(new Date(t.created_at), "p", { locale: locales[locale] || ru })}
                                                </span>
                                            </div>
                                            <span className="font-medium text-blue-600">
                                                {formatCurrency(Math.abs(t.total_amount), "UZS", locale)}
                                            </span>
                                        </div>
                                    ))}
                                {(!transactions || transactions.filter(t => t.transaction_type === 'repayment').length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-2">
                                        {t("transactions.noRepayments", { defaultValue: "No repayment history" })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button
                            onClick={handleRepaymentSubmit}
                            disabled={repaymentMutation.isPending || !repaymentAmount || Number(repaymentAmount) <= 0}
                            className="w-full"
                        >
                            {repaymentMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("common.processing", { defaultValue: "Processing..." })}
                                </>
                            ) : (
                                t("transactions.confirmRepayment", { defaultValue: "Confirm Repayment" })
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
