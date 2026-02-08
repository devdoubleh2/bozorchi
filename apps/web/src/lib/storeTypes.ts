import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  type LucideIcon,
  Shirt,
  Footprints,
  Package,
  Hammer,
  Sparkles,
  Wallet,
  Laptop,
  Sofa,
} from "lucide-react";

export const STORE_TYPE_ORDER = [
  "clothing",
  "shoes",
  "stationery",
  "construction",
  "cosmetics",
  "accessories",
  "electronics",
  "home_goods",
] as const;

export type StoreTypeId = (typeof STORE_TYPE_ORDER)[number];

interface StoreTypeMeta {
  defaultName: string;
  translationKey: `storeTypeSelection.types.${StoreTypeId}`;
  icon: LucideIcon;
  accent: string;
}

const STORE_TYPE_DEFINITIONS: Record<StoreTypeId, StoreTypeMeta> = {
  clothing: {
    defaultName: "Clothing Store",
    translationKey: "storeTypeSelection.types.clothing",
    icon: Shirt,
    accent: "#007AFF",
  },
  shoes: {
    defaultName: "Shoe Store",
    translationKey: "storeTypeSelection.types.shoes",
    icon: Footprints,
    accent: "#34C759",
  },
  stationery: {
    defaultName: "Stationery Store",
    translationKey: "storeTypeSelection.types.stationery",
    icon: Package,
    accent: "#FF9500",
  },
  construction: {
    defaultName: "Construction Store",
    translationKey: "storeTypeSelection.types.construction",
    icon: Hammer,
    accent: "#FF3B30",
  },
  cosmetics: {
    defaultName: "Cosmetics Store",
    translationKey: "storeTypeSelection.types.cosmetics",
    icon: Sparkles,
    accent: "#AF52DE",
  },
  accessories: {
    defaultName: "Accessories Store",
    translationKey: "storeTypeSelection.types.accessories",
    icon: Wallet,
    accent: "#FFCC02",
  },
  electronics: {
    defaultName: "Electronics Store",
    translationKey: "storeTypeSelection.types.electronics",
    icon: Laptop,
    accent: "#5AC8FA",
  },
  home_goods: {
    defaultName: "Home Goods Store",
    translationKey: "storeTypeSelection.types.home_goods",
    icon: Sofa,
    accent: "#FF6B6B",
  },
};

export const useStoreTypeOptions = () => {
  const { t } = useTranslation();

  return useMemo(
    () =>
      STORE_TYPE_ORDER.map((id) => {
        const meta = STORE_TYPE_DEFINITIONS[id];
        return {
          id,
          name: t(`${meta.translationKey}.name`),
          description: t(`${meta.translationKey}.description`),
          defaultName: meta.defaultName,
          icon: meta.icon,
          accent: meta.accent,
        };
      }),
    [t]
  );
};

export const findStoreTypeByName = (name: string) => {
  return STORE_TYPE_ORDER.find(
    (id) => STORE_TYPE_DEFINITIONS[id].defaultName === name
  );
};

export const getStoreTypeMeta = (id: StoreTypeId) => STORE_TYPE_DEFINITIONS[id];
