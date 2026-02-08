import { StyleSheet, TextStyle, ViewStyle } from "react-native";
import { ColorPalette } from "@/context/ThemeContext";

// Spacing system (4px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

// Typography scale
export const typography = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 16,
  lg: 17,
  xl: 18,
  xxl: 20,
  xxxl: 24,
} as const;

// Font weights
export const fontWeight = {
  normal: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
} as const;

// Common card styles
export const createCardStyles = (colors: ColorPalette, isDark: boolean) => ({
  card: {
    backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? colors.border : colors.borderSecondary,
  } as ViewStyle,
});

// Common button styles
export const createButtonStyles = (colors: ColorPalette, isDark: boolean) => ({
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  } as ViewStyle,
  buttonSecondary: {
    backgroundColor: isDark
      ? colors.surfaceSecondary
      : colors.backgroundSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  } as ViewStyle,
  buttonDanger: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  } as ViewStyle,
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.base,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
  buttonTextSecondary: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: fontWeight.semibold,
  } as TextStyle,
});

// Common input styles
export const createInputStyles = (colors: ColorPalette, isDark: boolean) => ({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: isDark ? colors.border : colors.borderSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.base,
    color: colors.textPrimary,
    backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
  } as ViewStyle,
  inputError: {
    borderColor: colors.error,
  } as ViewStyle,
  inputLabel: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  } as TextStyle,
});

// Common section header styles
export const createSectionStyles = (colors: ColorPalette, isDark: boolean) => ({
  sectionHeader: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
  } as TextStyle,
});

// Common list item styles
export const createListItemStyles = (
  colors: ColorPalette,
  isDark: boolean
) => ({
  listItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? colors.border : colors.borderSecondary,
    backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
  } as ViewStyle,
  listItemText: {
    fontSize: typography.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  } as TextStyle,
  listItemSubtext: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  } as TextStyle,
});

// Common container styles
export const createContainerStyles = (
  colors: ColorPalette,
  isDark: boolean
) => ({
  container: {
    flex: 1,
    backgroundColor: isDark ? colors.background : colors.backgroundTertiary,
  } as ViewStyle,
  scrollContent: {
    padding: spacing.lg,
  } as ViewStyle,
});

// Status colors (consistent stock indicators)
export const statusColors = {
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
} as const;
