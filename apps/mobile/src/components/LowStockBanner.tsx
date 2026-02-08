import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertTriangle, ChevronRight } from "lucide-react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../types/navigation";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

interface LowStockBannerProps {
  count: number;
}

export default function LowStockBanner({ count }: LowStockBannerProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  if (count === 0) return null;

  return (
    <TouchableOpacity
      style={[styles.banner, isDark && styles.bannerDark]}
      onPress={() => navigation.navigate("Restock" as never)}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={24} color="#F59E0B" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            {t("lowStock.alertTitle")}
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            {count} {count === 1 ? t("lowStock.item") : t("lowStock.items")}{" "}
            {t("lowStock.runningLow")}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  bannerDark: {
    backgroundColor: "#422006",
    borderLeftColor: "#F59E0B",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  titleDark: {
    color: "#FCD34D",
  },
  subtitle: {
    fontSize: 14,
    color: "#78350F",
  },
  subtitleDark: {
    color: "#FDE68A",
  },
});
