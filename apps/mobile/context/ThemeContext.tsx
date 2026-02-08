import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, ColorSchemeName } from "react-native";

type ThemeType = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "@app_theme";

export interface ColorPalette {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceSecondary: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Border colors
  border: string;
  borderSecondary: string;
  borderTertiary: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Chart colors
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartQuaternary: string;
  chartQuinary: string;

  // Interactive colors
  interactive: string;
  interactivePressed: string;
  interactiveDisabled: string;
}

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: ColorPalette;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  themePreference: ThemeType;
}

const lightColors: ColorPalette = {
  // Primary colors - Green for commerce/POS branding
  primary: "#10B981",
  primaryLight: "#6EE7B7",
  primaryDark: "#059669",

  // Secondary colors
  secondary: "#8B5CF6",
  secondaryLight: "#C4B5FD",
  secondaryDark: "#7C3AED",

  // Background colors - Near-white with subtle warmth
  background: "#FAFAFA",
  backgroundSecondary: "#F5F5F5",
  backgroundTertiary: "#EFEFEF",
  surface: "#FFFFFF",
  surfaceSecondary: "#FAFAFA",

  // Text colors - Refined grays
  textPrimary: "#18181B",
  textSecondary: "#71717A",
  textTertiary: "#A1A1AA",
  textInverse: "#FFFFFF",

  // Border colors - Very subtle
  border: "#E4E4E7",
  borderSecondary: "#F4F4F5",
  borderTertiary: "#FAFAFA",

  // Status colors
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Chart colors - Vibrant but harmonious
  chartPrimary: "#10B981",
  chartSecondary: "#8B5CF6",
  chartTertiary: "#F59E0B",
  chartQuaternary: "#EC4899",
  chartQuinary: "#06B6D4",

  // Interactive colors
  interactive: "#10B981",
  interactivePressed: "#059669",
  interactiveDisabled: "#E4E4E7",
};

const darkColors: ColorPalette = {
  // Primary colors - Bright green for dark backgrounds
  primary: "#34D399",
  primaryLight: "#6EE7B7",
  primaryDark: "#10B981",

  // Secondary colors
  secondary: "#A78BFA",
  secondaryLight: "#C4B5FD",
  secondaryDark: "#8B5CF6",

  // Background colors - Soft dark grays (NOT pure black)
  background: "#18181B",
  backgroundSecondary: "#27272A",
  backgroundTertiary: "#3F3F46",
  surface: "#1F1F23",
  surfaceSecondary: "#27272A",

  // Text colors - Refined light grays
  textPrimary: "#FAFAFA",
  textSecondary: "#D4D4D8",
  textTertiary: "#A1A1AA",
  textInverse: "#18181B",

  // Border colors - Subtle dark borders
  border: "#3F3F46",
  borderSecondary: "#52525B",
  borderTertiary: "#71717A",

  // Status colors
  success: "#34D399",
  successLight: "#1A2E1A",
  warning: "#FBBF24",
  warningLight: "#2A2A1A",
  error: "#F87171",
  errorLight: "#2A1A1A",
  info: "#60A5FA",
  infoLight: "#1A2A2A",

  // Chart colors - Vibrant but harmonious
  chartPrimary: "#34D399",
  chartSecondary: "#A78BFA",
  chartTertiary: "#FBBF24",
  chartQuaternary: "#F472B6",
  chartQuinary: "#22D3EE",

  // Interactive colors
  interactive: "#34D399",
  interactivePressed: "#10B981",
  interactiveDisabled: "#3F3F46",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themePreference, setThemePreference] = useState<ThemeType>("system");
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system"
        ) {
          setThemePreference(savedTheme);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Determine the actual theme to use
  const actualTheme =
    themePreference === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;

  const colors = actualTheme === "dark" ? darkColors : lightColors;
  const isDark = actualTheme === "dark";

  const toggleTheme = React.useCallback(async () => {
    const newTheme = actualTheme === "dark" ? "light" : "dark";
    setThemePreference(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  }, [actualTheme]);

  const setTheme = React.useCallback(async (newTheme: ThemeType) => {
    setThemePreference(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: actualTheme,
        isDark,
        colors,
        toggleTheme,
        setTheme,
        themePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
