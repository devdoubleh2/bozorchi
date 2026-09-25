import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  Dimensions,
} from "react-native";
import {
  Store as StoreIcon,
  Check,
  ChevronDown,
  X,
} from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useAuthContext } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { Store } from "@/types";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StoreSwitcherCompactProps {
  size?: "small" | "medium";
}

export default function StoreSwitcherCompact({
  size = "medium",
}: StoreSwitcherCompactProps) {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const user = useAuthContext((state) => state.user);
  const userStore = useAuthContext((state) => state.userStore);
  const switchStore = useAuthContext((state) => state.switchStore);

  // Check if user is owner based on userStore role or organization ownership
  const isOwnerRole =
    userStore?.role === "owner" || !!user?.owned_organization;

  // Only fetch stores for owners
  const { data: storesResponse } = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.get<{ stores: Store[] }>("/api/stores"),
    enabled: !!isOwnerRole,
  });

  const stores = storesResponse?.stores || [];
  const activeStore = userStore?.store;

  // Animation values
  const scale = useSharedValue(1);
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const openModal = useCallback(() => {
    setModalVisible(true);
    modalScale.value = withSpring(1, { damping: 20, stiffness: 300 });
    modalOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const closeModal = useCallback(() => {
    modalScale.value = withTiming(0.9, { duration: 150 });
    modalOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(() => setModalVisible(false), 150);
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const handleStoreChange = async (storeId: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      closeModal();

      const { success, error } = await switchStore(storeId);

      if (!success) {
        Alert.alert(
          t("common.error"),
          error?.message ||
            t("common.errorSwitchingStore", {
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
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
        queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
      ]);
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

  const renderStoreItem = useCallback(
    ({ item }: { item: Store }) => {
      const isActive = activeStore?.id === item.id;

      return (
        <Pressable
          style={({ pressed }) => [
            styles.storeItem,
            {
              backgroundColor: isActive
                ? colors.primary + "15"
                : pressed
                  ? colors.border + "50"
                  : colors.surface,
              borderColor: isActive ? colors.primary : colors.border,
            },
            Platform.OS === "ios" && pressed && styles.storeItemPressed,
          ]}
          onPress={() => handleStoreChange(item.id)}
          disabled={isActive || isLoading}
          android_ripple={{
            color: colors.primary + "30",
            borderless: false,
          }}
        >
          <View style={styles.storeItemContent}>
            <View
              style={[
                styles.storeIconContainer,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.border + "80",
                },
              ]}
            >
              <StoreIcon
                size={18}
                color={isActive ? "#fff" : colors.textSecondary}
              />
            </View>
            <View style={styles.storeInfo}>
              <Text
                style={[
                  styles.storeName,
                  {
                    color: isActive ? colors.primary : colors.textPrimary,
                    fontWeight: isActive ? "600" : "500",
                  },
                ]}
                numberOfLines={1}
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
            {isActive && (
              <View
                style={[
                  styles.checkContainer,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Check size={14} color="#fff" strokeWidth={3} />
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [activeStore?.id, colors, isLoading]
  );

  // Cashier: show static badge
  if (!isOwnerRole) {
    return (
      <View
        style={[
          styles.compactContainer,
          size === "small" && styles.compactContainerSmall,
          { backgroundColor: colors.primary + "15" },
        ]}
      >
        <StoreIcon
          size={size === "small" ? 16 : 18}
          color={colors.primary}
        />
        <Text
          style={[
            styles.compactText,
            size === "small" && styles.compactTextSmall,
            { color: colors.primary },
          ]}
          numberOfLines={1}
        >
          {activeStore?.name?.slice(0, 12) || t("common.store")}
          {(activeStore?.name?.length || 0) > 12 ? "..." : ""}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Animated.View style={animatedButtonStyle}>
        <Pressable
          style={[
            styles.compactContainer,
            size === "small" && styles.compactContainerSmall,
            {
              backgroundColor: isDark
                ? colors.surface
                : colors.primary + "12",
              borderColor: isDark ? colors.border : colors.primary + "30",
              borderWidth: 1,
            },
          ]}
          onPress={openModal}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isLoading}
          android_ripple={{
            color: colors.primary + "30",
            borderless: false,
          }}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
          ) : (
            <StoreIcon
              size={size === "small" ? 16 : 18}
              color={colors.primary}
            />
          )}
          <Text
            style={[
              styles.compactText,
              size === "small" && styles.compactTextSmall,
              { color: colors.primary },
            ]}
            numberOfLines={1}
          >
            {activeStore?.name?.slice(0, 10) || t("common.store")}
            {(activeStore?.name?.length || 0) > 10 ? "..." : ""}
          </Text>
          <ChevronDown size={size === "small" ? 14 : 16} color={colors.primary} />
        </Pressable>
      </Animated.View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                marginTop: Platform.OS === "ios" ? insets.top + 60 : 80,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 20,
                  },
                  android: {
                    elevation: 12,
                  },
                }),
              },
              animatedModalStyle,
            ]}
          >
            <Pressable onPress={() => {}}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View
                    style={[
                      styles.modalIconContainer,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <StoreIcon size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text
                      style={[styles.modalTitle, { color: colors.textPrimary }]}
                    >
                      {t("storeSetup.selectStore.title", {
                        defaultValue: "Switch Store",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.modalSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("storeSetup.selectStore.subtitle", {
                        defaultValue: "Choose a store to manage",
                      })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={closeModal}
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.border + "50" },
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              <FlatList
                data={stores}
                keyExtractor={(item) => item.id}
                renderItem={renderStoreItem}
                contentContainerStyle={styles.storeList}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <StoreIcon size={40} color={colors.textSecondary} />
                    <Text
                      style={[styles.emptyText, { color: colors.textSecondary }]}
                    >
                      {t("storeSetup.noStoresAvailable", {
                        defaultValue: "No stores available",
                      })}
                    </Text>
                  </View>
                }
              />
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    maxWidth: 150,
  },
  compactContainerSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    maxWidth: 120,
  },
  compactText: {
    fontSize: 14,
    fontWeight: "600",
  },
  compactTextSmall: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    marginHorizontal: 16,
    borderRadius: 20,
    maxHeight: "60%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  storeList: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },
  storeItem: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  storeItemPressed: {
    opacity: 0.8,
  },
  storeItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
  },
  storeAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
  },
});
