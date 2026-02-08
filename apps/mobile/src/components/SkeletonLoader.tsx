import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark
            ? colors.borderSecondary
            : colors.backgroundSecondary,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonProductCard: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <SkeletonLoader
        width={44}
        height={44}
        borderRadius={8}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <SkeletonLoader width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="40%" height={12} />
      </View>
      <SkeletonLoader width={20} height={20} borderRadius={10} />
    </View>
  );
};

export const SkeletonStatCard: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.statHeader}>
        <SkeletonLoader width="60%" height={14} />
        <SkeletonLoader width={32} height={32} borderRadius={8} />
      </View>
      <SkeletonLoader width="70%" height={20} />
    </View>
  );
};

export const SkeletonChartCard: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: isDark ? colors.surfaceSecondary : colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <SkeletonLoader width="40%" height={18} style={{ marginBottom: 16 }} />
      <SkeletonLoader width="100%" height={200} borderRadius={12} />
      <View style={styles.legendContainer}>
        <SkeletonLoader width={80} height={12} />
        <SkeletonLoader width={80} height={12} />
        <SkeletonLoader width={80} height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productImage: {
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    justifyContent: "space-between",
    minHeight: 92,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chartCard: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 16,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
  },
});
