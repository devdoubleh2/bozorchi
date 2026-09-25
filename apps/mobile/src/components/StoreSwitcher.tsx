import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { Store as StoreIcon, Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useAuthContext } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { Store } from "@/types";

interface StoreOption {
    id: string;
    name: string;
    address?: string;
    phone?: string;
}

export default function StoreSwitcher() {
    const { t } = useTranslation();
    const { isDark, colors } = useTheme();
    const queryClient = useQueryClient();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const user = useAuthContext((state) => state.user);
    const userStore = useAuthContext((state) => state.userStore);
    const switchStore = useAuthContext((state) => state.switchStore);

    // Match the permission check in switchStore (AuthContext)
    const isOwner = !!user?.owned_organization;
    const isOwnerRole = !!user?.owned_organization;
    const canSwitchStores = isOwner || isOwnerRole;

    // Only fetch stores for users who can switch
    const { data: storesResponse } = useQuery({
        queryKey: ["stores"],
        queryFn: () => api.get<{ stores: Store[] }>("/api/stores"),
        enabled: canSwitchStores,
    });

    const stores = storesResponse?.stores || [];
    const activeStore = userStore?.store;

    const handleStoreChange = async (storeId: string) => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            setDropdownOpen(false);

            const { success, error } = await switchStore(storeId);

            if (!success) {
                Alert.alert(
                    t("common.error"),
                    error?.message || t("common.errorSwitchingStore", {
                        defaultValue: "Failed to switch store",
                    })
                );
                return;
            }

            // Invalidate store-dependent queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["pos-inventory"] }),
                queryClient.invalidateQueries({ queryKey: ["pos-customers"] }),
                queryClient.invalidateQueries({ queryKey: ["products"] }),
                queryClient.invalidateQueries({ queryKey: ["transactions"] }),
                queryClient.invalidateQueries({ queryKey: ["inventory"] }),
            ]);

            Alert.alert(
                t("common.success"),
                t("storeSetup.storeSwitched", {
                    defaultValue: "Store switched successfully",
                })
            );
        } catch (error) {
            Alert.alert(
                t("common.error"),
                t("common.errorSwitchingStore", {
                    defaultValue: "Failed to switch store",
                })
            );
        } finally {
            setIsLoading(false);
        }
    };

    const renderStoreItem = (item: Store) => {
        const isActive = activeStore?.id === item.id;

        return (
            <TouchableOpacity
                key={item.id}
                style={[
                    styles.dropdownItem,
                    {
                        backgroundColor: isActive
                            ? colors.primary + "15"
                            : "transparent",
                    },
                ]}
                onPress={() => handleStoreChange(item.id)}
                disabled={isActive || isLoading}
            >
                <View style={styles.dropdownItemContent}>
                    <View
                        style={[
                            styles.storeIconSmall,
                            {
                                backgroundColor: isActive ? colors.primary : colors.border,
                            },
                        ]}
                    >
                        <StoreIcon
                            size={16}
                            color={isActive ? colors.textInverse : colors.textSecondary}
                        />
                    </View>
                    <View style={styles.storeInfo}>
                        <Text
                            style={[
                                styles.dropdownItemText,
                                {
                                    color: isActive ? colors.primary : colors.textPrimary,
                                    fontWeight: isActive ? "600" : "400",
                                },
                            ]}
                        >
                            {item.name}
                        </Text>
                        {item.address && (
                            <Text
                                style={[styles.storeAddress, { color: colors.textSecondary }]}
                                numberOfLines={1}
                            >
                                {item.address}
                            </Text>
                        )}
                    </View>
                    {isActive && <Check size={18} color={colors.primary} />}
                </View>
            </TouchableOpacity>
        );
    };

    // For users who cannot switch stores, just show current store (non-interactive)
    if (!canSwitchStores) {
        return (
            <View
                style={[
                    styles.container,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
            >
                <View style={styles.storeItemContent}>
                    <View
                        style={[styles.storeIcon, { backgroundColor: colors.primary }]}
                    >
                        <StoreIcon size={20} color={colors.textInverse} />
                    </View>
                    <View style={styles.storeInfo}>
                        <Text style={[styles.storeName, { color: colors.textPrimary }]}>
                            {activeStore?.name || "Store"}
                        </Text>
                        <Text style={[styles.storeRole, { color: colors.textSecondary }]}>
                            {userStore?.role === "owner" ? "Owner" : "Cashier"}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={[
                    styles.container,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    dropdownOpen && styles.containerOpen,
                ]}
                onPress={() => setDropdownOpen(!dropdownOpen)}
                disabled={isLoading}
                activeOpacity={0.7}
            >
                <View style={styles.storeItemContent}>
                    <View
                        style={[styles.storeIcon, { backgroundColor: colors.primary }]}
                    >
                        <StoreIcon size={20} color={colors.textInverse} />
                    </View>
                    <View style={styles.storeInfo}>
                        <Text style={[styles.storeName, { color: colors.textPrimary }]}>
                            {activeStore?.name || t("storeSetup.selectStore.title")}
                        </Text>
                        <Text style={[styles.storeRole, { color: colors.textSecondary }]}>
                            {isOwner ? t("common.owner", { defaultValue: "Owner" }) : "Owner"}
                        </Text>
                    </View>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : dropdownOpen ? (
                        <ChevronUp size={20} color={colors.textSecondary} />
                    ) : (
                        <ChevronDown size={20} color={colors.textSecondary} />
                    )}
                </View>
            </TouchableOpacity>

            {dropdownOpen && (
                <View
                    style={[
                        styles.dropdown,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            shadowColor: isDark ? "#000" : "#666",
                        },
                    ]}
                >
                    <ScrollView
                        style={styles.dropdownScroll}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                    >
                        {stores.length > 0 ? (
                            stores.map((store) => renderStoreItem(store))
                        ) : (
                            <Text
                                style={[
                                    styles.emptyText,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                {t("storeSetup.noStoresAvailable", {
                                    defaultValue: "No stores available",
                                })}
                            </Text>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 16,
        marginVertical: 8,
        zIndex: 100,
    },
    container: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
    },
    containerOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    storeItemContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    storeIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    storeIconSmall: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    storeInfo: {
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: "500",
    },
    storeRole: {
        fontSize: 12,
        marginTop: 2,
    },
    storeAddress: {
        fontSize: 11,
        marginTop: 2,
    },
    dropdown: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dropdownItemContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    dropdownItemText: {
        fontSize: 14,
    },
    emptyText: {
        textAlign: "center",
        fontSize: 14,
        padding: 16,
    },
});
