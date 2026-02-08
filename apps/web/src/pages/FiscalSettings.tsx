/**
 * FISCALIZATION DISABLED - This page has been disabled.
 * To re-enable, uncomment the code below and restore the route in App.tsx.
 */

export default function FiscalSettingsPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold">Fiscal Integration Disabled</h1>
            <p className="text-muted-foreground">
                Fiscal integration with Soliq.uz has been temporarily disabled.
            </p>
        </div>
    );
}

/*
// Original implementation below - kept for reference

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    RefreshCw,
    CheckCircle,
    Server,
    Printer,
    Activity
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from 'sonner';
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface StoreFiscalConfig {
    fiscal_enabled: boolean;
    fiscal_device_id: string | null;
    fiscal_terminal_id: string | null;
    fiscal_company_tin: string | null;
}

interface RegisterDeviceParams {
    deviceSerial: string;
    terminalId: string;
    companyTin: string;
    storeName: string;
    storeAddress: string;
}

interface FailedReceipt {
    id: string;
    group_id: string;
    receipt_number: string;
    total_amount: number;
    status: string;
    error_message: string;
    retry_count: number;
    created_at: string;
}

export default function FiscalSettingsPage() {
    const { t } = useTranslation();
    const { userStore, getStore } = useAuth();
    const queryClient = useQueryClient();

    // Config state
    const [config, setConfig] = useState<RegisterDeviceParams>({
        deviceSerial: "",
        terminalId: "",
        companyTin: "",
        storeName: userStore?.store?.name || "",
        storeAddress: userStore?.store?.address || "",
    });

    const storeId = userStore?.store_id;

    // Fetch current store fiscal settings
    const storeQuery = useQuery({
        queryKey: ["store-fiscal-config", storeId],
        queryFn: async () => {
            if (!storeId) return null;
            // We can reuse getStore or a specific endpoint
            const res = await getStore();
            const store = res?.store;
            if (store) {
                setConfig(prev => ({
                    ...prev,
                    deviceSerial: store.fiscal_device_id || "",
                    terminalId: store.fiscal_terminal_id || "",
                    companyTin: store.fiscal_company_tin || "",
                    storeName: store.name,
                    storeAddress: store.address || "",
                }));
            }
            return store as StoreFiscalConfig & { name: string, address?: string };
        },
        enabled: !!storeId,
    });

    // Fetch queue
    const queueQuery = useQuery({
        queryKey: ["fiscal-queue", storeId],
        queryFn: async () => {
            if (!storeId) return [];
            const res = await api.get<FailedReceipt[]>("/api/fiscal/queue");
            return res;
        },
        enabled: !!storeId && storeQuery.data?.fiscal_enabled === true,
        refetchInterval: 30000, // Poll every 30s
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: async (data: RegisterDeviceParams) => {
            return api.post("/api/fiscal/device/register", data);
        },
        onSuccess: () => {
            toast.success(t("fiscal.deviceRegistered"));
            queryClient.invalidateQueries({ queryKey: ["store-fiscal-config"] });
            queryClient.invalidateQueries({ queryKey: ["store"] }); // update global store context
        },
        onError: (error: Error) => {
            toast.error(error.message || t("fiscal.deviceRegistrationFailed"));
        }
    });

    // Retry all mutation
    const retryAllMutation = useMutation({
        mutationFn: async () => {
            return api.post("/api/fiscal/queue/retry-all");
        },
        onSuccess: (data: any) => {
            toast.success(t("fiscal.retrySuccess", { retried: data.retried, succeeded: data.succeeded }));
            queryClient.invalidateQueries({ queryKey: ["fiscal-queue"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || t("fiscal.retryFailed"));
        }
    });

    const isConfigured = storeQuery.data?.fiscal_enabled;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Printer className="h-6 w-6" />
                        {t("fiscal.title")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("fiscal.description")}
                    </p>
                </div>
                {isConfigured && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1 pl-2 pr-3 py-1">
                        <CheckCircle className="h-3 w-3 fill-green-600 text-white" />
                        {t("fiscal.activeConnected")}
                    </Badge>
                )}
            </div>

            <Tabs defaultValue="config" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="config">{t("fiscal.configTab")}</TabsTrigger>
                    <TabsTrigger value="queue" disabled={!isConfigured}>
                        {t("fiscal.queueTab")}
                        {queueQuery.data && queueQuery.data.length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                {queueQuery.data.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5" />
                                {t("fiscal.deviceRegistration")}
                            </CardTitle>
                            <CardDescription>
                                {t("fiscal.deviceRegistrationDescription")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="companyTin">{t("fiscal.companyTin")}</Label>
                                    <Input
                                        id="companyTin"
                                        value={config.companyTin}
                                        onChange={(e) => setConfig({ ...config, companyTin: e.target.value })}
                                        placeholder="123456789"
                                        disabled={isConfigured}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="terminalId">{t("fiscal.terminalId")}</Label>
                                    <Input
                                        id="terminalId"
                                        value={config.terminalId}
                                        onChange={(e) => setConfig({ ...config, terminalId: e.target.value })}
                                        placeholder="T123456"
                                        disabled={isConfigured}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deviceSerial">{t("fiscal.deviceSerial")}</Label>
                                    <Input
                                        id="deviceSerial"
                                        value={config.deviceSerial}
                                        onChange={(e) => setConfig({ ...config, deviceSerial: e.target.value })}
                                        placeholder="S/N 12345678"
                                        disabled={isConfigured}
                                    />
                                </div>
                            </div>

                            {!isConfigured ? (
                                <Button
                                    className="mt-4"
                                    onClick={() => registerMutation.mutate(config)}
                                    disabled={registerMutation.isPending || !config.companyTin || !config.terminalId || !config.deviceSerial}
                                >
                                    {registerMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    {registerMutation.isPending ? t("fiscal.registering") : t("fiscal.registerDevice")}
                                </Button>
                            ) : (
                                <div className="rounded-md bg-muted p-4 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        {t("fiscal.deviceActiveMessage")}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="queue" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        {t("fiscal.fiscalQueue")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("fiscal.queueDescription")}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => retryAllMutation.mutate()}
                                    disabled={!queueQuery.data?.length || retryAllMutation.isPending}
                                >
                                    {retryAllMutation.isPending ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    {retryAllMutation.isPending ? t("fiscal.retrying") : t("fiscal.retryAllFailed")}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("fiscal.receiptNumber")}</TableHead>
                                        <TableHead>{t("fiscal.amount")}</TableHead>
                                        <TableHead>{t("fiscal.status")}</TableHead>
                                        <TableHead>{t("fiscal.retries")}</TableHead>
                                        <TableHead>{t("fiscal.error")}</TableHead>
                                        <TableHead>{t("fiscal.time")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!queueQuery.data?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                {t("fiscal.noReceipts")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        queueQuery.data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.receipt_number || "..."}</TableCell>
                                                <TableCell>{new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(Number(item.total_amount))}</TableCell>
                                                <TableCell>
                                                    <Badge variant={item.status === 'failed' ? 'secondary' : 'secondary'} className={item.status === 'failed' ? "bg-red-100 text-red-800 hover:bg-red-100" : ""}>
                                                        {item.status === 'failed' ? t("fiscal.statusFailed") : item.status === 'pending' ? t("fiscal.statusPending") : t("fiscal.statusSuccess")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{item.retry_count}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={item.error_message}>{item.error_message || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
*/