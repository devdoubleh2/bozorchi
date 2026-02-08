import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Lock, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useState, useCallback } from "react";
import { toast } from "sonner";

type SubscriptionStatus = "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";

interface PaywallProps {
    children: ReactNode;
}

interface StoreData {
    store: {
        id: string;
        user_id: string;
        subscription_status: SubscriptionStatus;
        subscription_ends_at: string | null;
    };
}

interface CheckoutResponse {
    id: string;
    url: string;
}

export function Paywall({ children }: PaywallProps) {
    const { t } = useTranslation();
    const { user, userStore } = useAuth();
    const queryClient = useQueryClient();
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [isActivatingCheckout, setIsActivatingCheckout] = useState(false);

    const { data, isLoading, error } = useQuery<StoreData>({
        queryKey: ["userStore"],
        queryFn: async () => {
            return await api.get<StoreData>("/api/stores/my-store");
        },
        enabled: !!user && !!userStore,
        retry: 1,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });

    const createCheckoutMutation = useMutation({
        mutationFn: async (): Promise<CheckoutResponse> => {
            if (!data?.store?.id) throw new Error("Store information not available");
            if (!user?.email) throw new Error("User email not available");

            setCheckoutError(null);
            setIsActivatingCheckout(true);

            return await api.post<CheckoutResponse>("/api/checkout/create-checkout", {
                storeId: data.store.id,
                customerEmail: user.email,
            });
        },
        onSuccess: async (response) => {
            try {
                const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed");
                const checkout = await PolarEmbedCheckout.create(response.url, "light");

                checkout.addEventListener("success", async () => {
                    toast.success(t("subscription.checkoutSuccess"));
                    await queryClient.invalidateQueries({ queryKey: ["userStore"] });
                    checkout.close();
                    setIsActivatingCheckout(false);
                    setCheckoutError(null);
                });

                checkout.addEventListener("close", () => {
                    setIsActivatingCheckout(false);
                });

                checkout.addEventListener("confirmed", () => {
                    toast.info(t("paywall.processingPayment"));
                });
            } catch (error) {
                console.error("Failed to initialize checkout:", error);
                setCheckoutError("Failed to initialize checkout");
                setIsActivatingCheckout(false);
            }
        },
        onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            const parsed = JSON.parse(errorMessage);
            setCheckoutError(parsed.error || errorMessage);

            setIsActivatingCheckout(false);
            toast.error(t("subscription.checkoutError"));
        },
    });

    const handleActivateSubscription = useCallback(() => {
        setCheckoutError(null);
        createCheckoutMutation.mutate();
    }, [createCheckoutMutation]);

    if (!user) return <>{children}</>;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                </div>
            </div>
        );
    }

    if (error || !data?.store) return <>{children}</>;

    const isOwner = data.store.user_id === user.id;
    if (!isOwner) return <>{children}</>;

    const { subscription_status } = data.store;
    const hasAccess = subscription_status === "active" || subscription_status === "trialing";

    if (hasAccess) return <>{children}</>;

    return (
        <div className="relative flex min-h-screen items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none">{children}</div>

            <div className="relative z-10 w-full flex items-center justify-center">
                <Card className="max-w-2xl w-full">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10">
                            <Lock className="size-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl">{t("paywall.title")}</CardTitle>
                            <CardDescription className="text-base">{t("paywall.description")}</CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {checkoutError && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertDescription>{checkoutError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="rounded-lg border bg-muted/50 p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <CheckCircle2 className="size-5 text-primary" />
                                {t("paywall.features.title")}
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "paywall.features.unlimitedProducts",
                                    "paywall.features.advancedAnalytics",
                                    "paywall.features.multiUser",
                                    "paywall.features.prioritySupport"
                                ].map((key, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="size-4 text-muted-foreground mt-1 shrink-0" />
                                        <span className="text-sm">{t(key)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            size="lg"
                            className="w-full text-lg h-12"
                            onClick={handleActivateSubscription}
                            disabled={createCheckoutMutation.isPending || isActivatingCheckout}
                        >
                            {createCheckoutMutation.isPending || isActivatingCheckout ? (
                                <>
                                    <Loader2 className="mr-2 size-5 animate-spin" />
                                    {t("common.loading")}
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 size-5" />
                                    {t("paywall.activateSubscription")}
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">{t("paywall.securePayment")}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
