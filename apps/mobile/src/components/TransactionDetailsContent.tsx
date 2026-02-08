import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { TransactionType } from "@/types";

// This type should ideally be shared from a central types file
type TransactionListItem = {
  id: string;
  product_name: string;
  variation_name: string;
  category_name: string;
  image_url: string;
  quantity: number;
  unit_price: number; // Selling Price
  actual_price?: number;
  unit_name?: string;
  sku?: string;
  barcode?: string;
  total_amount: number;
  transaction_type: TransactionType;
  transaction_date: Date;
  customer_name: string | null;
  remarks: string | null;
  color: string;
};

interface Props {
  transaction: TransactionListItem | null;
}

export const TransactionDetailsBottomSheet = ({ transaction }: Props) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const formatPrice = (price: number) => {
    if (typeof price !== "number") {
      return "-";
    }
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionStatus = (type: TransactionType) => {
    switch (type) {
      case "export":
        return {
          color: "#27AE60",
          label: t("transactions.export"),
        };
      case "import":
        return {
          color: "#F2994A",
          label: t("transactions.import"),
        };
      case "return":
        return {
          color: "#EB5757",
          label: t("transactions.return"),
        };
      case "debt":
        return {
          color: "#A855F7",
          label: t("transactions.debt"),
        };
      default:
        return {
          color: isDark ? "#FFFFFF" : "#000000",
          label: t("transactions.transaction"),
        };
    }
  };

  if (!transaction) {
    return <View />;
  }

  const transactionStatus = getTransactionStatus(transaction.transaction_type);

  const DetailRow = ({
    label,
    value,
    valueColor,
    isLast,
  }: {
    label: string;
    value: string | number;
    valueColor?: string;
    isLast?: boolean;
  }) => (
    <View
      style={[
        styles.detailRow,
        {
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? "#38383A" : "#C6C6C8",
        },
      ]}
    >
      <Text
        style={[styles.label, isDark ? styles.labelDark : styles.labelLight]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          { color: valueColor || (isDark ? "#FFFFFF" : "#000000") },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <>
      <View style={styles.header}>
        {transaction.image_url ? (
          <Image
            source={{ uri: transaction.image_url }}
            style={styles.productImage}
          />
        ) : (
          <View
            style={[
              styles.productImage,
              styles.imagePlaceholder,
              isDark
                ? styles.imagePlaceholderDark
                : styles.imagePlaceholderLight,
            ]}
          >
            <Text style={isDark ? styles.textDark : styles.textLight}>
              No Image
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.productName,
            isDark ? styles.textDark : styles.textLight,
          ]}
        >
          {transaction.product_name}
        </Text>
        <Text
          style={[
            styles.variationName,
            isDark ? styles.labelDark : styles.labelLight,
          ]}
        >
          {transaction.variation_name}
        </Text>
      </View>

      <View style={styles.section}>
        <View
          style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
        >
          <DetailRow
            label={t("transactions.category")}
            value={transaction.category_name}
            isLast={!transaction.unit_name}
          />
          {transaction.unit_name && (
            <DetailRow
              label={t("transactions.unit")}
              value={transaction.unit_name}
              isLast
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View
          style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
        >
          <DetailRow
            label={t("transactions.sellingPrice")}
            value={formatPrice(transaction.unit_price)}
            isLast={!transaction.actual_price}
          />
          {transaction.actual_price && (
            <DetailRow
              label={t("transactions.actualPrice")}
              value={formatPrice(transaction.actual_price)}
              isLast
            />
          )}
        </View>
      </View>

      {(transaction.sku || transaction.barcode) && (
        <View style={styles.section}>
          <View
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            {transaction.sku && (
              <DetailRow
                label={t("transactions.sku")}
                value={transaction.sku}
                isLast={!transaction.barcode}
              />
            )}
            {transaction.barcode && (
              <DetailRow
                label={t("transactions.barcode")}
                value={transaction.barcode}
                isLast
              />
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View
          style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
        >
          <DetailRow
            label={t("transactions.status")}
            value={transactionStatus.label}
            valueColor={transactionStatus.color}
          />
          <DetailRow
            label={t("transactions.quantity")}
            value={transaction.quantity}
          />
          <DetailRow
            label={t("transactions.totalAmount")}
            value={formatPrice(transaction.total_amount)}
          />
          <DetailRow
            label={t("transactions.date")}
            value={formatDate(transaction.transaction_date)}
            isLast={!transaction.customer_name && !transaction.remarks}
          />
          {transaction.customer_name && (
            <DetailRow
              label={t("transactions.customer")}
              value={transaction.customer_name}
              isLast={!transaction.remarks}
            />
          )}
          {transaction.remarks && (
            <DetailRow
              label={t("transactions.remarks")}
              value={transaction.remarks}
              isLast
            />
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 48,
  },

  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 16,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderLight: {
    backgroundColor: "#E5E5EA",
  },
  imagePlaceholderDark: {
    backgroundColor: "#1C1C1E",
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  variationName: {
    fontSize: 17,
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  cardLight: {
    backgroundColor: "#FFFFFF",
  },
  cardDark: {
    backgroundColor: "#1C1C1E",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 17,
  },
  value: {
    fontSize: 17,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  textDark: { color: "#FFFFFF" },
  textLight: { color: "#000000" },
  labelDark: { color: "#8E8E93" },
  labelLight: { color: "#000000" },
});
