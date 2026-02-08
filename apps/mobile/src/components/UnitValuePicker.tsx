import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Hash, ChevronDown } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
} from "./DropdownMenuPrimitives";
import i18n from "../../lib/i18n";

type UnitValueTranslation = {
  id: string;
  locale: string;
  title: string;
  symbol?: string;
};

type UnitValue = {
  id: string;
  code: string;
  translations: UnitValueTranslation[];
};

type UnitWithTranslations = {
  id: string;
  code: string;
  translations: Array<{
    id: string;
    locale: string;
    title: string;
  }>;
  values: UnitValue[];
};

type UnitValuePickerProps = {
  unit?: UnitWithTranslations;
  selectedValue?: string;
  onValueSelect: (value: string) => void;
  error?: string;
};

const getUnitValueTitle = (unitValue: UnitValue, locale: string): string => {
  const trans =
    unitValue.translations?.find((t) => t.locale === locale) ||
    unitValue.translations?.[0];
  return trans ? trans.symbol || trans.title : unitValue.code;
};

export default function UnitValuePicker({
  unit,
  selectedValue,
  onValueSelect,
  error,
}: UnitValuePickerProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const currentLocale = i18n.language;

  const handleValueSelect = useCallback(
    (value: string) => {
      onValueSelect(value);
    },
    [onValueSelect]
  );

  const unitValues = unit?.values || [];
  const selectedUnitValue = unitValues.find((uv) => uv.code === selectedValue);

  if (!unit || unitValues.length === 0) {
    return (
      <View
        style={[
          styles.pickerButton,
          isDark && styles.pickerButtonDark,
          styles.disabledButton,
        ]}
      >
        <View style={styles.pickerContent}>
          <Hash size={16} color={isDark ? "#666" : "#999"} />
          <Text style={[styles.pickerText, styles.disabledText]}>
            {t("products.noUnitValues")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DropdownMenuRoot>
        <DropdownMenuTrigger>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              isDark && styles.pickerButtonDark,
              error && styles.inputError,
            ]}
            aria-role="button"
          >
            <View style={styles.pickerContent}>
              <Hash size={16} color={isDark ? "#ffffff" : "#2D9CDB"} />
              <Text
                style={[styles.pickerText, isDark && styles.pickerTextDark]}
              >
                {selectedUnitValue
                  ? getUnitValueTitle(selectedUnitValue, currentLocale)
                  : t("products.selectValue")}
              </Text>
            </View>
            <ChevronDown size={16} color={isDark ? "#ffffff" : "#2D9CDB"} />
          </TouchableOpacity>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          {unitValues.map((unitValue) => (
            <DropdownMenuItem
              key={unitValue.id}
              onSelect={() => handleValueSelect(unitValue.code)}
            >
              <DropdownMenuItemTitle>
                {getUnitValueTitle(unitValue, currentLocale)}
              </DropdownMenuItemTitle>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuRoot>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  pickerButton: {
    height: 52,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  pickerButtonDark: {
    backgroundColor: "#1e1e1e",
    borderColor: "#333333",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 8,
  },
  pickerTextDark: {
    color: "#ffffff",
  },
  disabledText: {
    color: "#999",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorContainer: {
    marginTop: 4,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
  },
  checkmark: {
    color: "#4fc3f7",
    fontSize: 16,
    fontWeight: "bold",
  },
});
