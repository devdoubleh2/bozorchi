import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react-native";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  isDark: boolean;
  color: string;
}

const ReportCard = ({
  title,
  description,
  icon,
  onPress,
  isDark,
  color,
}: ReportCardProps) => (
  <TouchableOpacity
    style={[styles.reportCard, isDark && styles.reportCardDark]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.iconContainer,
        { backgroundColor: isDark ? `${color}20` : `${color}15` },
      ]}
    >
      {icon}
    </View>
    <View style={styles.reportCardContent}>
      <Text
        style={[styles.reportCardTitle, isDark && styles.reportCardTitleDark]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.reportCardDescription,
          isDark && styles.reportCardDescriptionDark,
        ]}
      >
        {description}
      </Text>
    </View>
    <View style={styles.arrowContainer}>
      <Text style={[styles.arrow, isDark && styles.arrowDark]}>→</Text>
    </View>
  </TouchableOpacity>
);

export default function ReportsScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const reports = [
    {
      id: "sales",
      title: t("reports.sales.title"),
      description: t("reports.sales.description"),
      icon: <TrendingUp size={28} color="#0A84FF" />,
      color: "#0A84FF",
    },
    {
      id: "inventory",
      title: t("reports.inventory.title"),
      description: t("reports.inventory.description"),
      icon: <Package size={28} color="#30D158" />,
      color: "#30D158",
    },
    {
      id: "customers",
      title: t("reports.customers.title"),
      description: t("reports.customers.description"),
      icon: <Users size={28} color="#FF9F0A" />,
      color: "#FF9F0A",
    },
    {
      id: "financial",
      title: t("reports.financial.title"),
      description: t("reports.financial.description"),
      icon: <DollarSign size={28} color="#FF3B30" />,
      color: "#FF3B30",
    },
    {
      id: "products",
      title: t("reports.products.title"),
      description: t("reports.products.description"),
      icon: <BarChart3 size={28} color="#5856D6" />,
      color: "#5856D6",
    },
  ];

  const handleReportPress = (reportId: string) => {
    // @ts-expect-error - Navigation types not fully configured
    navigation.navigate("ReportDetail", { reportType: reportId });
  };

  return (
    <View
      style={[styles.container, isDark && styles.containerDark]}
      testID="reports-screen"
    >
      <StatusBar
        backgroundColor={isDark ? "#121212" : "#ffffff"}
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <FileSpreadsheet
            size={40}
            color={isDark ? "#fff" : "#000"}
            style={styles.headerIcon}
          />
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            {t("reports.title")}
          </Text>
          <Text
            style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}
          >
            {t("reports.subtitle")}
          </Text>
        </View>

        <View style={styles.reportsContainer}>
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              title={report.title}
              description={report.description}
              icon={report.icon}
              onPress={() => handleReportPress(report.id)}
              isDark={isDark}
              color={report.color}
            />
          ))}
        </View>

        <View style={styles.infoSection}>
          <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
            <Text style={[styles.infoTitle, isDark && styles.infoTitleDark]}>
              {t("reports.exportInfo.title")}
            </Text>
            <Text
              style={[
                styles.infoDescription,
                isDark && styles.infoDescriptionDark,
              ]}
            >
              {t("reports.exportInfo.description")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  headerTitleDark: {
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  headerSubtitleDark: {
    color: "#A9A9A9",
  },
  reportsContainer: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reportCardDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2C2C2E",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  reportCardContent: {
    flex: 1,
  },
  reportCardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  reportCardTitleDark: {
    color: "#FFFFFF",
  },
  reportCardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  reportCardDescriptionDark: {
    color: "#A9A9A9",
  },
  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: 20,
    color: "#6B7280",
  },
  arrowDark: {
    color: "#A9A9A9",
  },
  infoSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  infoCardDark: {
    backgroundColor: "#1E3A5F",
    borderColor: "#2C5282",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 8,
  },
  infoTitleDark: {
    color: "#93C5FD",
  },
  infoDescription: {
    fontSize: 14,
    color: "#3B82F6",
    lineHeight: 20,
  },
  infoDescriptionDark: {
    color: "#BFDBFE",
  },
});
