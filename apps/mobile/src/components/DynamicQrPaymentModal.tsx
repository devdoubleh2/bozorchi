/**
 * Dynamic QR Payment Modal Component
 *
 * Displays QR code for Dynamic QR payments and handles payment status polling.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
} from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { X, RefreshCw, CheckCircle, XCircle, Smartphone } from "lucide-react-native";
import { api } from "../../lib/api";
import { useHaptics } from "../hooks/useHaptics";

interface DynamicQrPaymentModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    isDark?: boolean;
    colors?: {
        background: string;
        surfaceSecondary: string;
        textPrimary: string;
        textSecondary: string;
        textInverse: string;
        primary: string;
        border: string;
        success: string;
        error: string;
    };
    amount: number;
    orderId: string;
    groupId?: string;
    onPaymentSuccess: (paymentData: {
        paymentId: string;
        transactionId: string;
        clientPhoneNumber?: string;
    }) => void;
    onPaymentFailed: (error: string) => void;
    onCancel: () => void;
}

interface PaymentStatus {
    status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED" | "UNKNOWN";
    paymentId?: string;
    errorMessage?: string;
}

export const DynamicQrPaymentModal: React.FC<DynamicQrPaymentModalProps> = ({
    bottomSheetRef,
    isDark: propIsDark,
    colors: propColors,
    amount,
    orderId,
    groupId,
    onPaymentSuccess,
    onPaymentFailed,
    onCancel,
}) => {
    const { t } = useTranslation();
    const { triggerHaptic } = useHaptics();

    // Use theme from props or fallback to defaults
    const isDark = propIsDark ?? false;
    const colors = propColors ?? {
        background: "#ffffff",
        surfaceSecondary: "#f8f9fa",
        textPrimary: "#333333",
        textSecondary: "#666666",
        textInverse: "#ffffff",
        primary: "#007AFF",
        border: "#e0e0e0",
        success: "#4CAF50",
        error: "#f44336",
    };

    const [isLoading, setIsLoading] = useState(false);
    const [paymentInitiated, setPaymentInitiated] = useState(false);
    const [paymentData, setPaymentData] = useState<{
        paymentId: string;
        transactionId: string;
        clientPhoneNumber?: string;
    } | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
        status: "PENDING",
    });
    const [error, setError] = useState<string | null>(null);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);

    // Format price
    const formatPrice = (price: number) => {
        return `${price.toLocaleString()} UZS`;
    };

    // Generate QR code for receiving payment
    const generateQRCode = useCallback(async (paymentId: string, paymentAmount: number, paymentOrderId: string) => {
        try {
            const response = await api.post("/api/payments/dynamic-qr/generate-qr", {
                paymentId,
                amount: paymentAmount,
                orderId: paymentOrderId,
            }) as { data: { success: boolean; qrCode?: string; errorMessage?: string } };

            if (response.data.success && response.data.qrCode) {
                setQrCode(response.data.qrCode);
            }
        } catch (err) {
            console.error("Error generating QR code:", err);
            // Don't fail the payment if QR generation fails
        }
    }, []);

    // Initialize payment
    const initiatePayment = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setQrCode(null);

        try {
            const response = await api.post("/api/payments/dynamic-qr/initiate", {
                amount,
                orderId,
                groupId,
            }) as { data: { success: boolean; payment?: { paymentId: string; transactionId: string; clientPhoneNumber?: string }; errorMessage?: string } };

            if (response.data.success && response.data.payment) {
                setPaymentInitiated(true);
                setPaymentData({
                    paymentId: response.data.payment.paymentId,
                    transactionId: response.data.payment.transactionId,
                    clientPhoneNumber: response.data.payment.clientPhoneNumber,
                });
                triggerHaptic("notificationSuccess");

                // Generate QR code for the payment
                await generateQRCode(
                    response.data.payment.paymentId,
                    amount,
                    orderId
                );

                // Start polling for status
                startPolling(response.data.payment.paymentId);
            } else {
                setError(response.data.errorMessage || t("payment.dynamicQrInitFailed", { defaultValue: "Failed to initialize payment" }));
                triggerHaptic("notificationError");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t("payment.dynamicQrInitFailed", { defaultValue: "Failed to initialize payment" });
            setError(errorMessage);
            triggerHaptic("notificationError");
        } finally {
            setIsLoading(false);
        }
    }, [amount, orderId, groupId, t, triggerHaptic, generateQRCode]);

    // Check payment status
    const checkPaymentStatus = useCallback(async (paymentId: string) => {
        try {
            const response = await api.get(`/api/payments/dynamic-qr/status/${paymentId}`) as { data: { success: boolean; status?: string; errorMessage?: string } };

            if (response.data.success) {
                const rawStatus = response.data.status;
                const normalizedStatus: PaymentStatus["status"] =
                    rawStatus === "SUCCESS"
                        ? "SUCCESS"
                        : rawStatus === "REVERSED"
                            ? "REVERSED"
                            : rawStatus === "FAILED" || rawStatus === "CANCELLED" || rawStatus === "PARTIAL_CANCELLED"
                                ? "FAILED"
                                : "PENDING";

                setPaymentStatus({
                    status: normalizedStatus,
                    paymentId,
                });

                if (normalizedStatus === "SUCCESS") {
                    // Payment completed successfully
                    if (pollingInterval) {
                        clearInterval(pollingInterval);
                        setPollingInterval(null);
                    }
                    triggerHaptic("notificationSuccess");
                    onPaymentSuccess({
                        paymentId,
                        transactionId: paymentData?.transactionId || "",
                        clientPhoneNumber: paymentData?.clientPhoneNumber,
                    });
                } else if (normalizedStatus === "FAILED" || normalizedStatus === "REVERSED") {
                    // Payment failed
                    if (pollingInterval) {
                        clearInterval(pollingInterval);
                        setPollingInterval(null);
                    }
                    triggerHaptic("notificationError");
                    onPaymentFailed(response.data.errorMessage || t("payment.paymentFailed", { defaultValue: "Payment failed" }));
                }
            }
        } catch (err) {
            console.error("Error checking payment status:", err);
        }
    }, [onPaymentSuccess, onPaymentFailed, paymentData, pollingInterval, t, triggerHaptic]);

    // Start polling for payment status
    const startPolling = useCallback((paymentId: string) => {
        // Check immediately
        checkPaymentStatus(paymentId);

        // Then poll every 2 seconds
        const interval = setInterval(() => {
            checkPaymentStatus(paymentId);
        }, 2000);

        setPollingInterval(interval);

        // Stop polling after 2 minutes (60 attempts)
        setTimeout(() => {
            clearInterval(interval);
            setPollingInterval(null);
            if (paymentStatus.status === "PENDING") {
                setPaymentStatus({ status: "UNKNOWN" });
            }
        }, 120000);
    }, [checkPaymentStatus, paymentStatus.status]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    // Auto-initiate payment when modal becomes visible
    useEffect(() => {
        if (!paymentInitiated && !isLoading && !error) {
            initiatePayment();
        }
    }, [initiatePayment, paymentInitiated, isLoading, error]);

    const handleCancel = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
        }
        onCancel();
        bottomSheetRef.current?.dismiss();
    };

    const handleRetry = () => {
        setError(null);
        setPaymentInitiated(false);
        setPaymentStatus({ status: "PENDING" });
        setQrCode(null);
        initiatePayment();
    };

    // Generate QR code data (this would be the actual QR code data from the provider)
    // For now, we display instructions since the provider generates the QR link
    const getQRInstructions = () => {
        return t("payment.dynamicQrInstructions", {
            defaultValue: "Scan this QR code to complete the payment",
        });
    };

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={["80%"]}
            onDismiss={handleCancel}
            backgroundStyle={{
                backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
            }}
            handleIndicatorStyle={{ backgroundColor: colors.border }}
        >
            <BottomSheetScrollView
                contentContainerStyle={[
                    styles.container,
                    { backgroundColor: isDark ? colors.surfaceSecondary : colors.background },
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        {t("payment.dynamicQr", { defaultValue: "Dynamic QR" })}
                    </Text>
                    <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                        <X size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Amount Display */}
                <View style={[styles.amountContainer, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                        {t("payment.amountToPay", { defaultValue: "Amount to Pay" })}
                    </Text>
                    <Text style={[styles.amount, { color: colors.primary }]}>
                        {formatPrice(amount)}
                    </Text>
                </View>

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            {t("payment.initializing", { defaultValue: "Initializing payment..." })}
                        </Text>
                    </View>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <View style={styles.centerContent}>
                        <XCircle size={64} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>
                            {error}
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.primary }]}
                            onPress={handleRetry}
                        >
                            <RefreshCw size={20} color={colors.textInverse} />
                            <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>
                                {t("common.retry", { defaultValue: "Retry" })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Payment QR Code Display */}
                {paymentInitiated && !error && !isLoading && (
                    <View style={styles.qrContainer}>
                        {/* QR Code Display */}
                        <View style={[styles.qrCodeBox, { borderColor: colors.border }]}>
                            {qrCode ? (
                                <Image
                                    source={{ uri: qrCode }}
                                    style={styles.qrCodeImage}
                                    resizeMode="contain"
                                />
                            ) : (
                                <>
                                    <Smartphone size={80} color={colors.primary} />
                                    <Text style={[styles.qrCodeText, { color: colors.textSecondary }]}>
                                        {paymentData?.paymentId}
                                    </Text>
                                </>
                            )}
                        </View>

                        {/* Instructions */}
                        <Text style={[styles.instructions, { color: colors.textSecondary }]}>
                            {getQRInstructions()}
                        </Text>

                        {/* Status Indicator */}
                        <View style={[styles.statusContainer, { backgroundColor: colors.surfaceSecondary }]}>
                            {paymentStatus.status === "PENDING" && (
                                <>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                                        {t("payment.waitingForPayment", { defaultValue: "Waiting for payment..." })}
                                    </Text>
                                </>
                            )}
                            {paymentStatus.status === "SUCCESS" && (
                                <>
                                    <CheckCircle size={24} color={colors.success} />
                                    <Text style={[styles.statusText, { color: colors.success }]}>
                                        {t("payment.paymentSuccessful", { defaultValue: "Payment successful!" })}
                                    </Text>
                                </>
                            )}
                            {paymentStatus.status === "FAILED" && (
                                <>
                                    <XCircle size={24} color={colors.error} />
                                    <Text style={[styles.statusText, { color: colors.error }]}>
                                        {t("payment.paymentFailed", { defaultValue: "Payment failed" })}
                                    </Text>
                                </>
                            )}
                        </View>

                        {/* Customer Info (if available) */}
                        {paymentData?.clientPhoneNumber && (
                            <View style={styles.customerInfo}>
                                <Text style={[styles.customerLabel, { color: colors.textSecondary }]}>
                                    {t("payment.customerPhone", { defaultValue: "Customer" })}
                                </Text>
                                <Text style={[styles.customerValue, { color: colors.textPrimary }]}>
                                    {paymentData.clientPhoneNumber}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Cancel Button */}
                <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.border }]}
                    onPress={handleCancel}
                >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                        {t("common.cancel", { defaultValue: "Cancel" })}
                    </Text>
                </TouchableOpacity>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
    },
    closeButton: {
        padding: 4,
    },
    amountContainer: {
        alignItems: "center",
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    amount: {
        fontSize: 32,
        fontWeight: "700",
    },
    centerContent: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: "center",
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
        gap: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    qrContainer: {
        alignItems: "center",
    },
    qrCodeBox: {
        width: 220,
        height: 220,
        borderWidth: 2,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        overflow: "hidden",
    },
    qrCodeImage: {
        width: 200,
        height: 200,
    },
    qrCodeText: {
        fontSize: 12,
        marginTop: 8,
    },
    instructions: {
        fontSize: 14,
        textAlign: "center",
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 8,
        gap: 8,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 16,
        fontWeight: "500",
    },
    customerInfo: {
        alignItems: "center",
        marginBottom: 24,
    },
    customerLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    customerValue: {
        fontSize: 16,
        fontWeight: "600",
    },
    cancelButton: {
        paddingVertical: 16,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        marginTop: "auto",
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "500",
    },
});
