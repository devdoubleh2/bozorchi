import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useTranslation } from "react-i18next";
import { useHaptics } from "../src/hooks/useHaptics";
import {
  Shirt,
  Footprints,
  Package,
  Hammer,
  Sparkles,
  Wallet,
  Laptop,
  Sofa,
  ArrowRight,
  CheckCircle,
} from "lucide-react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
// import { Category } from "@sp/types"; // Removed

import { useTheme } from "../context/ThemeContext";
import React from "react";

type Props = NativeStackScreenProps<RootStackParamList, "StoreTypeSelection">;

const { width } = Dimensions.get("window");

interface StoreType {
  id: string;
  name: string;
  nameUz: string;
  nameRu: string;
  icon: typeof Shirt;
  color: string;
  unit_id?: string;
}

let storeTypes: StoreType[] = [
  {
    id: "clothing",
    name: "Clothing Store",
    nameUz: "Kiyim do'koni",
    nameRu: "Магазин одежды",
    icon: Shirt,
    color: "#007AFF",
  },
  {
    id: "shoes",
    name: "Shoe Store",
    nameUz: "Oyoq kiyim do'koni",
    nameRu: "Магазин обуви",
    icon: Footprints,
    color: "#34C759",
  },
  {
    id: "stationery",
    name: "Stationery Store",
    nameUz: "Kanselyariya do'koni",
    nameRu: "Канцелярский магазин",
    icon: Package,
    color: "#FF9500",
  },
  {
    id: "construction",
    name: "Construction Store",
    nameUz: "Qurilish do'koni",
    nameRu: "Строительный магазин",
    icon: Hammer,
    color: "#FF3B30",
  },
  {
    id: "cosmetics",
    name: "Cosmetics Store",
    nameUz: "Kosmetika do'koni",
    nameRu: "Магазин косметики",
    icon: Sparkles,
    color: "#AF52DE",
  },
  {
    id: "accessories",
    name: "Accessories Store",
    nameUz: "Aksessuarlar do'koni",
    nameRu: "Магазин аксессуаров",
    icon: Wallet,
    color: "#FFCC02",
  },
  {
    id: "electronics",
    name: "Electronics Store",
    nameUz: "Elektronika do'koni",
    nameRu: "Магазин электроники",
    icon: Laptop,
    color: "#5AC8FA",
  },
  {
    id: "home_goods",
    name: "Home Goods Store",
    nameUz: "Uy-ro'zg'or buyumlari",
    nameRu: "Товары для дома",
    icon: Sofa,
    color: "#FF6B6B",
  },
];

export default function StoreTypeSelectionScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { triggerHaptic } = useHaptics();
  const { colors, isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<string>("");

  const handleTypeSelect = (typeId: string) => {
    triggerHaptic("impactLight");
    setSelectedType(typeId);
  };

  const handleContinue = () => {
    if (!selectedType) {
      return;
    }

    triggerHaptic("impactMedium");
    // Navigate to store setup with selected type
    navigation.navigate("StoreSetup", { storeType: selectedType });
  };

  const getStoreName = (storeType: StoreType) => {
    switch (i18n.language) {
      case "uz":
        return storeType.nameUz;
      case "ru":
        return storeType.nameRu;
      default:
        return storeType.name;
    }
  };

  const {
    data: storeData,
    error,
    isLoading: isQueryLoading,
  } = useQuery({
    queryKey: ["storeTypes"],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: { id: string; name: string }[] }>("/api/categories/all");

        console.log("Fetched store types:", JSON.stringify(res.data, null, 2));

        return res.data.map((apiItem) => {
          const localMeta = storeTypes.find(
            (local) => local.name === apiItem.name
          );

          return {
            id: apiItem.id,
            name: apiItem.name,
            nameRu: localMeta?.nameRu,
            nameUz: localMeta?.nameUz,
            icon: localMeta?.icon || Shirt,
            color: localMeta?.color || "#007AFF",
          } as StoreType;
        });
      } catch (err) {
        console.error("Error fetching store types:", err);
        throw err; // rethrow so React Query handles it
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (
        error?.message?.includes("TOKEN_INVALID") ||
        error?.message?.includes("Invalid or expired token")
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const renderStoreType = (storeType: StoreType) => {
    const IconComponent = storeType.icon;
    const isSelected = selectedType === storeType.id;

    return (
      <TouchableOpacity
        key={storeType.id}
        style={[
          styles.storeTypeCard,
          { backgroundColor: colors.surface },
          isSelected && styles.selectedCard,
          { borderColor: isSelected ? storeType.color : colors.border },
        ]}
        onPress={() => handleTypeSelect(storeType.id!)}
        testID={`store-type-card-${storeType.id}`}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isSelected
                ? storeType.color
                : colors.surfaceSecondary,
            },
          ]}
        >
          <IconComponent
            size={32}
            color={isSelected ? colors.textInverse : storeType.color}
          />
        </View>
        <Text
          style={[
            styles.storeTypeName,
            { color: colors.textPrimary },
            isSelected && { color: storeType.color },
          ]}
        >
          {getStoreName(storeType)}
        </Text>
        {isSelected && (
          <View
            style={[styles.checkIcon, { backgroundColor: storeType.color }]}
          >
            <CheckCircle size={16} color={colors.textInverse} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="store-type-selection-screen"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t("storeTypeSelection.title")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("storeTypeSelection.subtitle")}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.storeTypesGrid}>
          {isQueryLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                {t("common.loading")}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error.message?.includes("TOKEN_INVALID") ||
                  error.message?.includes("Invalid or expired token")
                  ? t("errors.sessionExpired")
                  : t("errors.failedToLoadStoreTypes")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  // Force refetch by reloading the screen
                  navigation.replace("StoreTypeSelection");
                }}
              >
                <Text
                  style={[
                    styles.retryButtonText,
                    { color: colors.textInverse },
                  ]}
                >
                  {t("common.retry")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            storeData && storeData.map(renderStoreType)
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedType
                ? colors.primary
                : colors.interactiveDisabled,
            },
            !selectedType && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedType}
          testID="store-type-continue-button"
        >
          <Text
            style={[styles.continueButtonText, { color: colors.textInverse }]}
          >
            {t("storeTypeSelection.continue")}
          </Text>
          <ArrowRight size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  storeTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  storeTypeCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    position: "relative",
  },
  selectedCard: {},
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  storeTypeName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  checkIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {},
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
