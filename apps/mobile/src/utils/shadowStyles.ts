import { ViewStyle, TextStyle } from 'react-native';

/**
 * Shadow styles work natively on iOS and Android
 * This function is kept for API compatibility but returns styles as-is
 */
export const createShadowStyle = (
  style: ViewStyle | TextStyle
): ViewStyle | TextStyle => {
  // Shadow styles work natively, no conversion needed
  return style;
};

/**
 * StyleSheet.create alternative that automatically converts shadow styles
 * Native platforms handle shadows natively, so this just returns styles as-is
 */
export const createWebCompatibleStyleSheet = <T extends Record<string, ViewStyle | TextStyle>>(
  styles: T
): T => {
  // Native styles work without conversion
  return styles;
};
