import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useRoute, useNavigation } from "@react-navigation/native";
import { X, Check, History } from "lucide-react-native";
import { format } from "date-fns";

interface EditHistory {
  id: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changeReason: string;
  changedAt: string;
  user: {
    email: string;
  };
}

export default function TransactionEditScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const route = useRoute();
  const { transactionId } = route.params as { transactionId: string };

  const [quantity, setQuantity] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const { data: transaction, isLoading } = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      const res = await api.get<{
        transaction: {
          id: string;
          quantity: number;
          productVariationId: string;
          productName: string;
          variationName: string;
        };
      }>(`/api/transactions/${transactionId}`);
      return res.transaction;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["transactionHistory", transactionId],
    queryFn: async () => {
      const res = await api.get<{ history: EditHistory[] }>(
        `/api/transactions/${transactionId}/history`
      );
      return res;
    },
  });

  useEffect(() => {
    if (transaction) {
      setQuantity(transaction.quantity.toString());
    }
  }, [transaction]);

  const editMutation = useMutation({
    mutationFn: async (data: { quantity: number; changeReason: string }) => {
      return api.put(`/api/transactions/${transactionId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["transaction", transactionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactionHistory", transactionId],
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      Alert.alert(t("common.success"), t("transactionEdit.editSuccess"));
      navigation.goBack();
    },
    onError: (error) => {
      console.error("Edit transaction error:", error);
      Alert.alert(t("common.error"), t("errors.generic"));
    },
  });

  const handleSave = () => {
    const newQuantity = parseInt(quantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      Alert.alert(t("common.error"), t("reservation.quantityRequired"));
      return;
    }

    if (!changeReason.trim()) {
      Alert.alert(t("common.error"), t("transactionEdit.reasonRequired"));
      return;
    }

    if (newQuantity === transaction?.quantity) {
      Alert.alert(t("common.error"), "No changes to save");
      return;
    }

    editMutation.mutate({
      quantity: newQuantity,
      changeReason: changeReason.trim(),
    });
  };

  const renderHistoryItem = ({ item }: { item: EditHistory }) => (
    <View
      style={[
        styles.historyCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.historyHeader}>
        <Text style={[styles.historyField, { color: colors.textPrimary }]}>
          {t(`transactionEdit.${item.fieldChanged}`)}
        </Text>
        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
          {format(new Date(item.changedAt), "dd.MM.yyyy HH:mm")}
        </Text>
      </View>
      <View style={styles.historyValues}>
        <View style={styles.historyValueRow}>
          <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>
            {t("transactionEdit.oldValue")}:
          </Text>
          <Text style={[styles.historyValue, { color: colors.error }]}>
            {item.oldValue}
          </Text>
        </View>
        <View style={styles.historyValueRow}>
          <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>
            {t("transactionEdit.newValue")}:
          </Text>
          <Text style={[styles.historyValue, { color: colors.success }]}>
            {item.newValue}
          </Text>
        </View>
      </View>
      {item.changeReason && (
        <Text style={[styles.historyReason, { color: colors.textSecondary }]}>
          {item.changeReason}
        </Text>
      )}
      <Text style={[styles.historyUser, { color: colors.textSecondary }]}>
        {t("transactionEdit.editedBy")}: {item.user.email}
      </Text>
    </View>
  );

  if (isLoading || !transaction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="transaction-edit-screen"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t("reservation.product")}
          </Text>
          <Text style={[styles.productText, { color: colors.textPrimary }]}>
            {transaction.productName} - {transaction.variationName}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t("reservation.quantity")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder={t("reservation.quantity")}
            placeholderTextColor={colors.textSecondary}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t("transactionEdit.changeReason")} *
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder={t("transactionEdit.changeReason")}
            placeholderTextColor={colors.textSecondary}
            value={changeReason}
            onChangeText={setChangeReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {historyData && historyData.history.length > 0 && (
          <TouchableOpacity
            style={[
              styles.historyButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setHistoryModalVisible(true)}
          >
            <History size={20} color={colors.textPrimary} />
            <Text
              style={[styles.historyButtonText, { color: colors.textPrimary }]}
            >
              {t("transactionEdit.viewHistory")} ({historyData.history.length})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={editMutation.isPending}
        >
          {editMutation.isPending ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Check size={20} color={colors.textInverse} />
              <Text
                style={[styles.saveButtonText, { color: colors.textInverse }]}
              >
                {t("common.save")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t("transactionEdit.editHistory")}
              </Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={historyData?.history || []}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.historyList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    {t("transactionEdit.noHistory")}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  productText: {
    fontSize: 16,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  historyList: {
    padding: 16,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyField: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 12,
  },
  historyValues: {
    marginBottom: 8,
  },
  historyValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  historyLabel: {
    fontSize: 14,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyReason: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: "italic",
  },
  historyUser: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
  },
});
