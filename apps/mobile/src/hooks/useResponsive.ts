import { useWindowDimensions } from "react-native";
import { useMemo } from "react";

export type ScreenSize = "mobile" | "tablet" | "desktop" | "largeDesktop";

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const screenSize: ScreenSize = useMemo(() => {
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    if (width < 1440) return "desktop";
    return "largeDesktop";
  }, [width]);

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";
  const isDesktop = screenSize === "desktop" || screenSize === "largeDesktop";
  const isLargeDesktop = screenSize === "largeDesktop";

  const maxContentWidth = useMemo(() => {
    switch (screenSize) {
      case "mobile":
        return width - 32; // 16px padding on each side
      case "tablet":
        return 720;
      case "desktop":
        return 1200;
      case "largeDesktop":
        return 1400;
    }
  }, [screenSize, width]);

  const columns = useMemo(() => {
    switch (screenSize) {
      case "mobile":
        return 1;
      case "tablet":
        return 2;
      case "desktop":
        return 3;
      case "largeDesktop":
        return 4;
    }
  }, [screenSize]);

  const padding = useMemo(() => {
    switch (screenSize) {
      case "mobile":
        return 12;
      case "tablet":
        return 16;
      case "desktop":
      case "largeDesktop":
        return 24;
    }
  }, [screenSize]);

  const fontSize = useMemo(() => {
    const scale = isMobile ? 0.9 : isTablet ? 1 : 1.1;
    return {
      xs: Math.round(11 * scale),
      sm: Math.round(13 * scale),
      base: Math.round(15 * scale),
      lg: Math.round(17 * scale),
      xl: Math.round(20 * scale),
      "2xl": Math.round(24 * scale),
      "3xl": Math.round(30 * scale),
    };
  }, [isMobile, isTablet]);

  return {
    width,
    height,
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    maxContentWidth,
    columns,
    padding,
    fontSize,
  };
};

