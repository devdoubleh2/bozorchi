import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  CheckCircle,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthContext } from "../context/AuthContext";
import { Picker } from "@react-native-picker/picker";
import { log } from "@/debugging/log";

interface PriceChange {
  productVariationId: string;
  productName: string;
  variationName: string;
  currentPrice: number;
  currentSellingPrice: number;
  newPrice: number;
  newSellingPrice: number;
  difference: number;
  percentageChange: number;
}

export default function RepricingScreen() {
  const [strategy, setStrategy] = useState<
    "percentage" | "fixed" | "margin" | "currency"
  >("percentage");
  const [value, setValue] = useState("");
  const [applyTo, setApplyTo] = useState<"sellingPrice" | "price" | "both">(
    "sellingPrice"
  );
  const [previewResults, setPreviewResults] = useState<{
    priceChanges: PriceChange[];
    summary: {
      totalProducts: number;
      averageIncrease: number;
      averagePercentageChange: number;
      minIncrease: number;
      maxIncrease: number;
    };
  } | null>(null);

  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Preview repricing mutationw
  const previewMutation = useMutation({
    mutationFn: async () => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        throw new Error(t("repricing.invalidValue"));
      }

      const response = (await api.post("/api/repricing/preview", {
        strategy: {
          type: strategy,
          value: numValue,
          applyTo,
        },
        filters: {}, // Can add filters here
      })) as { data: typeof previewResults };
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewResults(data);
      log.info("RepricingScreen", "Preview generated", data);
    },
    onError: (error: Error) => {
      log.error("RepricingScreen", "Preview error", error);
    },
  });

  // Apply repricing mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!previewResults) {
        throw new Error(t("repricing.noPreview"));
      }

      const response = (await api.post("/api/repricing/apply", {
        priceChanges: previewResults.priceChanges,
        reason: `Bulk repricing: ${strategy} ${value}${
          strategy === "percentage" ? "%" : ""
        }`,
      })) as { data: { success: boolean } };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setPreviewResults(null);
      setValue("");
      log.info("RepricingScreen", "Applied successfully");
    },
    onError: (error: Error) => {
      log.error("RepricingScreen", "Apply error", error);
    },
  });

  const handlePreview = useCallback(() => {
    if (!value || parseFloat(value) === 0) {
      log.error("RepricingScreen", "Enter value");
      return;
    }
    previewMutation.mutate();
  }, [value, previewMutation, t]);

  const handleApply = useCallback(() => {
    if (!previewResults) {
      log.error("RepricingScreen", "Generate preview first");
      return;
    }

    Alert.alert(
      t("repricing.confirmTitle"),
      t("repricing.confirmMessage", {
        count: previewResults.priceChanges.length,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          onPress: () => applyMutation.mutate(),
        },
      ]
    );
  }, [previewResults, t, applyMutation]);

  const renderPriceChange = useCallback(
    ({ item }: { item: PriceChange }) => {
      const isIncrease = item.difference > 0;
      return (
        <View style={[styles.changeCard, { backgroundColor: colors.surface }]}>
          <View style={styles.changeHeader}>
            <View style={styles.changeInfo}>
              <Text style={[styles.productName, { color: colors.textPrimary }]}>
                {item.productName}
              </Text>
              <Text
                style={[styles.variationName, { color: colors.textSecondary }]}
              >
                {item.variationName}
              </Text>
            </View>
            {isIncrease ? (
              <TrendingUp size={20} color={colors.success} />
            ) : (
              <TrendingDown size={20} color={colors.error} />
            )}
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text
                style={[styles.priceLabel, { color: colors.textSecondary }]}
              >
                {t("repricing.current")}
              </Text>
              <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
                {item.currentSellingPrice.toLocaleString()}
              </Text>
            </View>

            <ArrowRightLeft size={16} color={colors.textSecondary} />

            <View style={styles.priceItem}>
              <Text
                style={[styles.priceLabel, { color: colors.textSecondary }]}
              >
                {t("repricing.new")}
              </Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {item.newSellingPrice.toLocaleString()}
              </Text>
            </View>

            <View style={styles.priceItem}>
              <Text
                style={[styles.priceLabel, { color: colors.textSecondary }]}
              >
                {t("repricing.change")}
              </Text>
              <Text
                style={[
                  styles.changeValue,
                  { color: isIncrease ? colors.success : colors.error },
                ]}
              >
                {isIncrease && "+"}
                {item.percentageChange.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [colors, t]
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="repricing-screen"
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Strategy Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("repricing.selectStrategy")}
          </Text>

          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Picker
              selectedValue={strategy}
              onValueChange={(value) => setStrategy(value)}
              style={{ color: isDark ? "#fff" : colors.textPrimary }}
            >
              <Picker.Item
                label={t("repricing.strategy.percentage")}
                value="percentage"
              />
              <Picker.Item
                label={t("repricing.strategy.fixed")}
                value="fixed"
              />
              <Picker.Item
                label={t("repricing.strategy.margin")}
                value="margin"
              />
              <Picker.Item
                label={t("repricing.strategy.currency")}
                value="currency"
              />
            </Picker>
          </View>

          <Text
            style={[
              styles.strategyDescription,
              { color: colors.textSecondary },
            ]}
          >
            {t(`repricing.strategyDescription.${strategy}`)}
          </Text>
        </View>

        {/* Value Input */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("repricing.value")}
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.valueInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                },
              ]}
              value={value}
              onChangeText={setValue}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>
              {strategy === "percentage" || strategy === "margin"
                ? "%"
                : t("common.currency")}
            </Text>
          </View>
        </View>

        {/* Apply To */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("repricing.applyToLabel")}
          </Text>

          <View style={styles.applyToButtons}>
            {["sellingPrice", "price", "both"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.applyToButton,
                  {
                    backgroundColor:
                      applyTo === option
                        ? colors.primary
                        : colors.backgroundSecondary,
                  },
                ]}
                onPress={() =>
                  setApplyTo(option as "sellingPrice" | "price" | "both")
                }
              >
                <Text
                  style={[
                    styles.applyToText,
                    {
                      color: applyTo === option ? "#fff" : colors.textPrimary,
                    },
                  ]}
                >
                  {t(`repricing.applyTo.${option}`) as string}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview Button */}
        <TouchableOpacity
          style={[styles.previewButton, { backgroundColor: colors.primary }]}
          onPress={handlePreview}
          disabled={previewMutation.isPending}
        >
          {previewMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <DollarSign size={20} color="#fff" />
              <Text style={styles.buttonText}>{t("repricing.preview")}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Preview Results */}
        {previewResults && (
          <>
            {/* Summary */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {t("repricing.summary")}
              </Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text
                    style={[styles.summaryValue, { color: colors.textPrimary }]}
                  >
                    {previewResults.summary.totalProducts}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("repricing.products")}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text
                    style={[styles.summaryValue, { color: colors.primary }]}
                  >
                    {previewResults.summary.averagePercentageChange.toFixed(1)}%
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("repricing.avgChange")}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text
                    style={[styles.summaryValue, { color: colors.success }]}
                  >
                    {previewResults.summary.averageIncrease.toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("repricing.avgIncrease")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Price Changes List */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {t("repricing.priceChanges")} (
                {previewResults.priceChanges.length})
              </Text>

              <FlatList
                data={previewResults.priceChanges.slice(0, 50)}
                renderItem={renderPriceChange}
                keyExtractor={(item) => item.productVariationId}
                scrollEnabled={false}
                contentContainerStyle={styles.changesList}
              />

              {previewResults.priceChanges.length > 50 && (
                <Text
                  style={[styles.moreItems, { color: colors.textSecondary }]}
                >
                  {t("repricing.andMore", {
                    count: previewResults.priceChanges.length - 50,
                  })}
                </Text>
              )}
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.success }]}
              onPress={handleApply}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#fff" />
                  <Text style={styles.buttonText}>
                    {t("repricing.applyChanges")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  strategyDescription: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueInput: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "600",
  },
  inputSuffix: {
    fontSize: 18,
    fontWeight: "600",
  },
  applyToButtons: {
    flexDirection: "row",
    gap: 8,
  },
  applyToButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  applyToText: {
    fontSize: 14,
    fontWeight: "600",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  changesList: {
    gap: 12,
  },
  changeCard: {
    padding: 16,
    borderRadius: 12,
  },
  changeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  changeInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  variationName: {
    fontSize: 14,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  priceItem: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  changeValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  moreItems: {
    fontSize: 14,
    textAlign: "center",
    padding: 12,
    fontStyle: "italic",
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
