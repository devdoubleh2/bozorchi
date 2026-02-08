import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native";

export type ActiveFilters = {
  stockStatus: string[];
  colors: string[];
  unitValues: string[];
  priceRange: { min: number; max: number } | null;
  productCategoryColors: string[];
  categoryNames: string[];
};

type FilterInventoryProps = {
  initialFilters: ActiveFilters;
  allColors: string[];
  allUnitValues: string[];
  allProductCategoryColors: string[];
  allCategoryNames: string[];
  priceRange: { min: number; max: number } | null;
  onApply: (filters: ActiveFilters) => void;
};

const FilterInventory = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useTheme();
  const colors = theme?.colors || {};
  const isDark = theme?.isDark ?? false;

  const fallbackColors = {
    background: isDark ? "#000" : "#fff",
    textPrimary: isDark ? "#fff" : "#000",
    textSecondary: isDark ? "#8e8e93" : "#6e6e73",
    textInverse: isDark ? "#000" : "#fff",
    primary: "#007AFF",
    surface: isDark ? "#1c1c1e" : "#f2f2f7",
    surfaceSecondary: isDark ? "#2c2c2e" : "#e5e5ea",
    border: isDark ? "#38383a" : "#c6c6c8",
  };

  const {
    initialFilters = {
      stockStatus: [],
      colors: [],
      unitValues: [],
      priceRange: null,
      productCategoryColors: [],
      categoryNames: [],
    },
    allColors = [],
    allUnitValues = [],
    allProductCategoryColors = [],
    allCategoryNames = [],
    priceRange = null,
    onApply = () => {},
  } = (route.params as FilterInventoryProps) || {};

  const [activeFilters, setActiveFilters] =
    useState<ActiveFilters>(initialFilters);
  const [currentPriceRange, setCurrentPriceRange] = useState(
    activeFilters.priceRange || priceRange
  );
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({
    [t("inventory.byColor")]: true,
    [t("inventory.byCategoryColor")]: true,
    [t("inventory.byCategory")]: true,
    [t("inventory.byUnit")]: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (type: keyof ActiveFilters, value: string) => {
    setActiveFilters((prev) => {
      const currentValues = prev[type] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [type]: newValues };
    });
  };

  const handleApply = () => {
    onApply({ ...activeFilters, priceRange: currentPriceRange });
    navigation.goBack();
  };

  const handleClearAll = () => {
    setActiveFilters({
      stockStatus: [],
      colors: [],
      unitValues: [],
      priceRange: null,
      productCategoryColors: [],
      categoryNames: [],
    });
    setCurrentPriceRange(priceRange);
  };

  const FilterOption = ({
    label,
    isActive,
    onPress,
    color,
  }: {
    label: string;
    isActive: boolean;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={styles.filterOption}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.filterOptionContent}>
        {color && (
          <View style={[styles.statusIndicator, { backgroundColor: color }]} />
        )}
        <Text
          style={[
            styles.filterLabel,
            { color: colors?.textPrimary ?? fallbackColors.textPrimary },
          ]}
        >
          {label}
        </Text>
      </View>
      <View
        style={[
          styles.checkContainer,
          isActive && {
            backgroundColor: colors?.primary ?? fallbackColors.primary,
          },
        ]}
      >
        {isActive && <Check size={16} color="#fff" strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );

  const ColorFilterOption = ({
    color,
    isActive,
    onPress,
  }: {
    color: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.colorOption}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.colorSwatch,
          { backgroundColor: color },
          isActive && styles.colorSwatchActive,
        ]}
      >
        {isActive && (
          <View style={styles.colorCheckmark}>
            <Check size={14} color="#fff" strokeWidth={3} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <TouchableOpacity
      style={styles.sectionHeaderContainer}
      onPress={() => toggleSection(title)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.sectionHeader,
          { color: colors?.textSecondary ?? fallbackColors.textSecondary },
        ]}
      >
        {title}
      </Text>
      <ChevronDown
        size={20}
        color={colors?.textSecondary ?? fallbackColors.textSecondary}
        style={{
          transform: [{ rotate: collapsedSections[title] ? "0deg" : "180deg" }],
        }}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        // { backgroundColor: colors?.background ?? fallbackColors.background },
      ]}
      testID="filter-inventory-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/*
         *
         * --- THIS IS THE FIX ---
         * Wrap all content inside the ScrollView in a single <View>.
         * This fixes the [RNScreens] warning by giving the
         * ScrollView only one direct child.
         *
         */}
        <View>
          <Text
            style={[
              styles.title,
              { color: colors?.textPrimary ?? fallbackColors.textPrimary },
            ]}
          >
            {t("inventory.filters")}
          </Text>

          <SectionHeader title={t("inventory.byStatus")} />
          {!collapsedSections[t("inventory.byStatus")] && (
            <View
              style={[
                styles.filterGroup,
                { backgroundColor: colors?.surface ?? fallbackColors.surface },
              ]}
            >
              <FilterOption
                label={t("inventory.inStock")}
                isActive={activeFilters.stockStatus.includes("good")}
                onPress={() => handleFilterChange("stockStatus", "good")}
                color="#34C759"
              />
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors?.border ?? fallbackColors.border },
                ]}
              />
              <FilterOption
                label={t("inventory.lowStock")}
                isActive={activeFilters.stockStatus.includes("low")}
                onPress={() => handleFilterChange("stockStatus", "low")}
                color="#FF9500"
              />
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors?.border ?? fallbackColors.border },
                ]}
              />
              <FilterOption
                label={t("inventory.outOfStock")}
                isActive={activeFilters.stockStatus.includes("out")}
                onPress={() => handleFilterChange("stockStatus", "out")}
                color="#FF3B30"
              />
            </View>
          )}

          {allColors.length > 0 && (
            <>
              <SectionHeader title={t("inventory.byColor")} />
              {!collapsedSections[t("inventory.byColor")] && (
                <View
                  style={[
                    styles.filterGroup,
                    styles.colorGrid,
                    {
                      backgroundColor:
                        colors?.surface ?? fallbackColors.surface,
                    },
                  ]}
                >
                  {allColors.map((color) => (
                    <ColorFilterOption
                      key={color}
                      color={color}
                      isActive={activeFilters.colors.includes(color)}
                      onPress={() => handleFilterChange("colors", color)}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {allProductCategoryColors.length > 0 && (
            <>
              <SectionHeader title={t("inventory.byCategoryColor")} />
              {!collapsedSections[t("inventory.byCategoryColor")] && (
                <View
                  style={[
                    styles.filterGroup,
                    styles.colorGrid,
                    {
                      backgroundColor:
                        colors?.surface ?? fallbackColors.surface,
                    },
                  ]}
                >
                  {allProductCategoryColors.map((color) => (
                    <ColorFilterOption
                      key={color}
                      color={color}
                      isActive={activeFilters.productCategoryColors.includes(
                        color
                      )}
                      onPress={() =>
                        handleFilterChange("productCategoryColors", color)
                      }
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {allCategoryNames.length > 0 && (
            <>
              <SectionHeader title={t("inventory.byCategory")} />
              {!collapsedSections[t("inventory.byCategory")] && (
                <View
                  style={[
                    styles.filterGroup,
                    {
                      backgroundColor:
                        colors?.surface ?? fallbackColors.surface,
                    },
                  ]}
                >
                  {allCategoryNames.map((category, index) => (
                    <React.Fragment key={category}>
                      <FilterOption
                        label={category}
                        isActive={activeFilters.categoryNames.includes(
                          category
                        )}
                        onPress={() =>
                          handleFilterChange("categoryNames", category)
                        }
                      />
                      {index < allCategoryNames.length - 1 && (
                        <View
                          style={[
                            styles.separator,
                            {
                              backgroundColor:
                                colors?.border ?? fallbackColors.border,
                            },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </>
          )}

          {allUnitValues.length > 0 && (
            <>
              <SectionHeader title={t("inventory.byUnit")} />
              {!collapsedSections[t("inventory.byUnit")] && (
                <View
                  style={[
                    styles.filterGroup,
                    {
                      backgroundColor:
                        colors?.surface ?? fallbackColors.surface,
                    },
                  ]}
                >
                  {allUnitValues.map((unit, index) => (
                    <React.Fragment key={unit}>
                      <FilterOption
                        label={unit}
                        isActive={activeFilters.unitValues.includes(unit)}
                        onPress={() => handleFilterChange("unitValues", unit)}
                      />
                      {index < allUnitValues.length - 1 && (
                        <View
                          style={[
                            styles.separator,
                            {
                              backgroundColor:
                                colors?.border ?? fallbackColors.border,
                            },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </>
          )}

          {priceRange && (
            <>
              <SectionHeader title={t("inventory.byPrice")} />
              {!collapsedSections[t("inventory.byPrice")] && (
                <View
                  style={[
                    styles.filterGroup,
                    styles.priceSlider,
                    {
                      backgroundColor:
                        colors?.surface ?? fallbackColors.surface,
                    },
                  ]}
                >
                  <Slider
                    minimumValue={priceRange.min}
                    maximumValue={priceRange.max}
                    step={1}
                    value={[
                      currentPriceRange?.min ?? priceRange.min,
                      currentPriceRange?.max ?? priceRange.max,
                    ]}
                    onValueChange={(value) => {
                      setCurrentPriceRange({ min: value[0], max: value[1] });
                    }}
                    minimumTrackTintColor={
                      colors?.primary ?? fallbackColors.primary
                    }
                    thumbTintColor={colors?.primary ?? fallbackColors.primary}
                  />
                  <View style={styles.priceRangeDisplay}>
                    <Text
                      style={[
                        styles.priceText,
                        {
                          color:
                            colors?.textPrimary ?? fallbackColors.textPrimary,
                        },
                      ]}
                    >
                      {currentPriceRange?.min ?? priceRange.min}
                    </Text>
                    <Text
                      style={[
                        styles.priceSeparator,
                        {
                          color:
                            colors?.textSecondary ??
                            fallbackColors.textSecondary,
                        },
                      ]}
                    >
                      —
                    </Text>
                    <Text
                      style={[
                        styles.priceText,
                        {
                          color:
                            colors?.textPrimary ?? fallbackColors.textPrimary,
                        },
                      ]}
                    >
                      {currentPriceRange?.max ?? priceRange.max}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
        {/* --- END OF FIX --- */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors?.border ?? fallbackColors.border,
              backgroundColor: isDark
                ? "rgba(28,28,30,0.95)"
                : "rgba(255,255,255,0.95)",
            },
          ]}
        >
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.clearButton,
                {
                  backgroundColor:
                    colors?.surfaceSecondary ?? fallbackColors.surfaceSecondary,
                },
              ]}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: colors?.textPrimary ?? fallbackColors.textPrimary },
                ]}
              >
                {t("common.clearAll")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.applyButton,
                { backgroundColor: colors?.primary ?? fallbackColors.primary },
              ]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.applyButtonText]}>
                {t("common.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 120,
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.37,
    marginBottom: 28,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: -0.08,
  },
  filterGroup: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  filterOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  filterLabel: {
    fontSize: 17,
    letterSpacing: -0.41,
  },
  checkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  colorOption: {
    padding: 2,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSwatchActive: {
    transform: [{ scale: 1.1 }],
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  priceSlider: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  priceRangeDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  priceText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.41,
  },
  priceSeparator: {
    fontSize: 17,
    fontWeight: "400",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    borderWidth: 1,
    borderColor: "darkblue",
  },
  applyButton: {
    borderWidth: 1,
    borderColor: "darkred",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.41,
  },
  applyButtonText: {
    color: "#fff",
  },
});

export default FilterInventory;
