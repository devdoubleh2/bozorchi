import { StyleSheet } from 'react-native';
import { ColorPalette } from '../../context/ThemeContext';

export const createThemeStyles = (colors: ColorPalette) => {
  return StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Card styles
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },

    cardSecondary: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSecondary,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
    },

    // Text styles
    textPrimary: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
    },

    textSecondary: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '400',
    },

    textTertiary: {
      color: colors.textTertiary,
      fontSize: 12,
      fontWeight: '400',
    },

    textLarge: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '600',
    },

    textMedium: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '500',
    },

    textSmall: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '400',
    },

    // Button styles
    buttonPrimary: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    buttonSecondary: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    buttonTextPrimary: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },

    buttonTextSecondary: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },

    // Input styles
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textPrimary,
    },

    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },

    // Status styles
    statusSuccess: {
      backgroundColor: colors.successLight,
      borderColor: colors.success,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    statusWarning: {
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    statusError: {
      backgroundColor: colors.errorLight,
      borderColor: colors.error,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    statusInfo: {
      backgroundColor: colors.infoLight,
      borderColor: colors.info,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    // Chart styles
    chartContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },

    // List styles
    listItem: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.borderSecondary,
      borderBottomWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },

    listItemLast: {
      borderBottomWidth: 0,
    },

    // Section styles
    sectionHeader: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },

    // Navigation styles
    tabBar: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
    },

    tabBarItem: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },

    // Loading and error styles
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },

    errorText: {
      color: colors.error,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
    },

    // Utility styles
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    spaceBetween: {
      justifyContent: 'space-between',
    },

    spaceAround: {
      justifyContent: 'space-around',
    },

    // Spacing
    marginVertical: {
      marginVertical: 8,
    },

    marginHorizontal: {
      marginHorizontal: 16,
    },

    paddingVertical: {
      paddingVertical: 12,
    },

    paddingHorizontal: {
      paddingHorizontal: 16,
    },
  });
};
