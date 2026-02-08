import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { CreditCard, Banknote, Smartphone } from "lucide-react-native";
import { useHaptics } from "../hooks/useHaptics";
import { useTheme } from "../../context/ThemeContext";

export type PaymentMethod = "cash" | "card" | "dynamic_qr";

interface PaymentMethodSelectorProps {
  totalAmount: number;
  onPaymentMethodSelected: (method: PaymentMethod) => void;
  disabled?: boolean;
  isDark?: boolean;
  colors?: {
    background: string;
    surfaceSecondary: string;
    backgroundSecondary: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    primary: string;
    border: string;
    error: string;
    infoLight: string;
  };
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  totalAmount,
  onPaymentMethodSelected,
  disabled = false,
  isDark: propIsDark,
  colors: propColors,
}) => {
  const { t } = useTranslation();
  const { triggerHaptic } = useHaptics();

  // Use theme from props or fallback to hook
  let isDark = false;
  let colors = {
    background: "#ffffff",
    surfaceSecondary: "#f8f9fa",
    backgroundSecondary: "#f8f9fa",
    textPrimary: "#333333",
    textSecondary: "#666666",
    textTertiary: "#999999",
    textInverse: "#ffffff",
    primary: "#007AFF",
    border: "#e0e0e0",
    error: "#ff6b6b",
    infoLight: "#f0f8ff",
  };

  if (propIsDark !== undefined && propColors) {
    // Use props if provided
    isDark = propIsDark;
    colors = propColors;
  } else {
    // Try to use theme hook as fallback
    try {
      const theme = useTheme();
      isDark = theme.isDark;
      colors = theme.colors;
    } catch (error) {
      // Use default values if theme is not available
      console.warn("ThemeProvider not available, using default theme");
    }
  }

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );

  const handleMethodSelect = (method: PaymentMethod) => {
    if (disabled) return;

    triggerHaptic("selection");
    setSelectedMethod(method);
    onPaymentMethodSelected(method);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
        },
      ]}
    >
      <Text style={[styles.amount, { color: colors.primary }]}>
        {formatPrice(totalAmount)}
      </Text>

      <View style={styles.methodsContainer}>
        {/* Cash Payment */}
        <TouchableOpacity
          style={[
            styles.methodButton,
            {
              backgroundColor: isDark
                ? colors.backgroundSecondary
                : colors.backgroundSecondary,
              borderColor: colors.border,
            },
            selectedMethod === "cash" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            disabled && styles.disabledMethod,
          ]}
          onPress={() => handleMethodSelect("cash")}
          disabled={disabled}
        >
          <Banknote
            size={24}
            color={
              selectedMethod === "cash"
                ? colors.textInverse
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.methodText,
              {
                color:
                  selectedMethod === "cash"
                    ? colors.textInverse
                    : colors.textPrimary,
              },
            ]}
          >
            {t("payment.cash")}
          </Text>
        </TouchableOpacity>

        {/* Card Payment */}
        <TouchableOpacity
          style={[
            styles.methodButton,
            {
              backgroundColor: isDark
                ? colors.backgroundSecondary
                : colors.backgroundSecondary,
              borderColor: colors.border,
            },
            selectedMethod === "card" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            disabled && styles.disabledMethod,
          ]}
          onPress={() => handleMethodSelect("card")}
          disabled={disabled}
        >
          <CreditCard
            size={24}
            color={
              selectedMethod === "card"
                ? colors.textInverse
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.methodText,
              {
                color:
                  selectedMethod === "card"
                    ? colors.textInverse
                    : colors.textPrimary,
              },
            ]}
          >
            {t("payment.card")}
          </Text>
        </TouchableOpacity>

        {/* Dynamic QR */}
        <TouchableOpacity
          style={[
            styles.methodButton,
            {
              backgroundColor: isDark
                ? colors.backgroundSecondary
                : colors.backgroundSecondary,
              borderColor: colors.border,
            },
            selectedMethod === "dynamic_qr" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            disabled && styles.disabledMethod,
          ]}
          onPress={() => handleMethodSelect("dynamic_qr")}
          disabled={disabled}
        >
          <Smartphone
            size={24}
            color={
              selectedMethod === "dynamic_qr"
                ? colors.textInverse
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.methodText,
              {
                color:
                  selectedMethod === "dynamic_qr"
                    ? colors.textInverse
                    : colors.textPrimary,
              },
            ]}
          >
            {t("payment.dynamicQr", { defaultValue: "Dynamic QR" })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  methodsContainer: {
    gap: 12,
  },
  methodButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  disabledMethod: {
    opacity: 0.5,
  },
  methodText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  unavailableText: {
    fontSize: 12,
    marginLeft: "auto",
  },
});
