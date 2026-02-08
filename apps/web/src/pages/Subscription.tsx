import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2, CreditCard, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface Store {
    id: string;
    subscription_status: string;
    subscription_ends_at: string | null;
}

interface CheckoutResponse {
    id: string;
    url: string;
}

interface StoreResponse {
    store: Store;
}

interface PaymentHistory {
    id: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    invoiceUrl: string | null;
}

interface HistoryResponse {
    history: PaymentHistory[];
}

/**
 * Subscription management page
 * 
 * Allows users to:
 * - View their current subscription status
 * - Activate a new subscription via Polar embedded checkout
 * - Cancel an existing subscription
 * 
 * Features:
 * - Comprehensive error handling with user-friendly messages
 * - Loading states for all async operations
 * - Automatic data refresh after checkout success
 * - Type-safe API calls
 */

export default function SubscriptionPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // Fetch store data with subscription information
    const {
        data: storeData,
        isLoading: isStoreLoading,
        error: storeError
    } = useQuery<StoreResponse>({
        queryKey: ["userStore"],
        queryFn: async () => {
            return await api.get<StoreResponse>("/api/stores/my-store");
        },
        retry: 2,
        staleTime: 30 * 1000, // 30 seconds
    });

    // Fetch subscription history
    const { data: historyData, isLoading: isHistoryLoading } = useQuery<HistoryResponse>({
        queryKey: ["subscriptionHistory"],
        queryFn: async () => {
            return await api.get<HistoryResponse>("/api/stores/history");
        },
        enabled: !!storeData?.store,
    });

    // Create checkout session mutation
    const createCheckoutMutation = useMutation({
        mutationFn: async (): Promise<CheckoutResponse> => {
            if (!storeData?.store?.id) {
                throw new Error("Store ID not available");
            }
            if (!user?.email) {
                throw new Error("User email not available");
            }

            setCheckoutError(null);

            return await api.post<CheckoutResponse>("/api/checkout/create-checkout", {
                storeId: storeData.store.id,
                customerEmail: user.email,
            });
        },
        onSuccess: async (data) => {
            try {
                // Dynamically import Polar checkout to reduce bundle size
                const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed");

                // Create embedded checkout with the returned URL
                const checkout = await PolarEmbedCheckout.create(data.url);

                // Handle successful checkout completion
                checkout.addEventListener('success', () => {
                    toast.success(t("subscription.checkoutSuccess"));
                    queryClient.invalidateQueries({ queryKey: ["userStore"] });
                    checkout.close();
                });

                // Handle checkout closure
                checkout.addEventListener('close', () => {
                    // Checkout was closed, no action needed
                });
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : "Failed to initialize checkout";
                setCheckoutError(errorMessage);
                toast.error(t("subscription.checkoutError"));
            }
        },
        onError: (error) => {
            const errorMessage = error instanceof Error
                ? error.message
                : "Unknown error occurred";

            // Parse backend error messages
            try {
                const parsed = JSON.parse(errorMessage);
                setCheckoutError(parsed.error || errorMessage);
            } catch {
                setCheckoutError(errorMessage);
            }

            toast.error(t("subscription.checkoutError"));
        },
    });

    // Cancel subscription mutation
    const cancelMutation = useMutation({
        mutationFn: async () => {
            if (!storeData?.store?.id) {
                throw new Error("Store ID not available");
            }

            await api.post("/api/checkout/cancel-subscription", {
                storeId: storeData.store.id
            });
        },
        onSuccess: () => {
            toast.success(t("subscription.cancelSuccess"));
            queryClient.invalidateQueries({ queryKey: ["userStore"] });
        },
        onError: (error) => {
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to cancel subscription";
            toast.error(t("subscription.cancelError"));
            console.error("Cancellation failed:", errorMessage);
        },
    });

    // Handle checkout activation
    const handleActivateSubscription = useCallback(() => {
        setCheckoutError(null);
        createCheckoutMutation.mutate();
    }, [createCheckoutMutation]);

    // Handle subscription cancellation with confirmation
    const handleCancelSubscription = useCallback(() => {
        if (window.confirm(t("subscription.cancelConfirmation"))) {
            cancelMutation.mutate();
        }
    }, [cancelMutation, t]);

    // Loading state
    if (isStoreLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (storeError || !storeData?.store) {
        return (
            <div className="container mx-auto py-10">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="size-5" />
                            {t("common.error")}
                        </CardTitle>
                        <CardDescription>{t("subscription.noStore")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()}>
                            {t("common.retry")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { store } = storeData;
    // Check for valid subscription statuses that grant access
    // "active" = paid and active subscription
    // "trialing" = user is in trial period and should have access
    const validStatuses = ["active", "trialing"];
    const isActive = store.subscription_status ? validStatuses.includes(store.subscription_status.toLowerCase()) : false;

    const safeFormatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "Invalid Date";
            }
            return format(date, "PPP");
        } catch (e) {
            return "Invalid Date";
        }
    };

    return (
        <div className="container mx-auto py-10">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>{t("subscription.title")}</CardTitle>
                    {!isActive && (
                        <CardDescription>
                            {t("subscription.upgradePrompt")}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Subscription Status Card */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                            <p className="font-medium">{t("subscription.status")}</p>
                            <div className="flex items-center gap-2">
                                {isActive ? (
                                    <CheckCircle2 className="size-4 text-green-500" />
                                ) : (
                                    <AlertTriangle className="size-4 text-yellow-500" />
                                )}
                                <span className="capitalize">
                                    {isActive
                                        ? t("subscription.active")
                                        : t("subscription.inactive")
                                    }
                                </span>
                            </div>
                        </div>
                        {store.subscription_ends_at && (
                            <div className="text-right space-y-1">
                                <p className="font-medium">{t("subscription.renewsEnds")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {safeFormatDate(store.subscription_ends_at)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Activation Section for Inactive Subscriptions */}
                    {!isActive && (
                        <div className="space-y-4">
                            {checkoutError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="size-4" />
                                    <AlertDescription>
                                        {checkoutError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleActivateSubscription}
                                    disabled={createCheckoutMutation.isPending}
                                >
                                    {createCheckoutMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            {t("subscription.checkoutLoading")}
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="mr-2 size-4" />
                                            {t("subscription.activateSubscription")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Cancellation Section for Active Subscriptions */}
                    {isActive && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                            <h3 className="font-medium text-destructive mb-2">
                                {t("subscription.dangerZone")}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t("subscription.dangerZoneDescription")}
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleCancelSubscription}
                                disabled={cancelMutation.isPending}
                            >
                                {cancelMutation.isPending && (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                )}
                                {t("subscription.cancelSubscription")}
                            </Button>
                        </div>
                    )}

                    {/* Payment History Section */}
                    <div className="pt-6 border-t">
                        <h3 className="font-semibold mb-4">{t("subscription.paymentHistory")}</h3>

                        {isHistoryLoading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : historyData?.history && historyData.history.length > 0 ? (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="h-10 px-4 text-left font-medium">{t("common.date")}</th>
                                            <th className="h-10 px-4 text-left font-medium">{t("common.amount")}</th>
                                            <th className="h-10 px-4 text-left font-medium">{t("common.status")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyData.history.map((payment) => (
                                            <tr key={payment.id} className="border-b last:border-0">
                                                <td className="p-4">
                                                    {safeFormatDate(payment.date)}
                                                </td>
                                                <td className="p-4">
                                                    {(payment.amount / 100).toLocaleString(undefined, {
                                                        style: "currency",
                                                        currency: payment.currency.toUpperCase()
                                                    })}
                                                </td>
                                                <td className="p-4 capitalize">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${payment.status === "paid" || payment.status === "succeeded"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-700"
                                                        }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {t("subscription.noHistory")}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
