import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Keyboard,
} from "react-native";
import { Plus, Package } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import {
  BottomSheetBackdropProps,
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useAuthContext } from "@/context/AuthContext";

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  store_id: string;
  created_at: string;
  updated_at: string;
}

type SupplierTagSelectorProps = {
  suppliers?: Supplier[];
  selectedSupplierId?: string;
  onSupplierSelect: (supplierId: string) => void;
  error?: string;
};

export default function SupplierTagSelector({
  suppliers,
  selectedSupplierId,
  onSupplierSelect,
  error,
}: SupplierTagSelectorProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthContext((state) => state.user);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const addSupplierBottomSheetRef = useRef<BottomSheetModal>(null);
  const addSupplierSnapPoints = useMemo(() => ["90%"], []);

  const createSupplierMutation = useMutation({
    mutationFn: async (data: typeof supplierForm) => {
      const res = await api.post<{ supplier: Supplier }>("/api/suppliers", data);
      return res.supplier;
    },
    onSuccess: (supplier: Supplier) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onSupplierSelect(supplier.id);
      resetForm();
      addSupplierBottomSheetRef.current?.close();
      Alert.alert(t("common.success"), t("supplier.createSuccess"));
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      return api.delete(`/api/suppliers/${supplierId}`);
    },
    onSuccess: (data, supplierId) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      if (selectedSupplierId === supplierId) {
        onSupplierSelect("");
      }
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const resetForm = () => {
    setSupplierForm({
      name: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
  };

  const handleOpenAddSupplier = useCallback(() => {
    addSupplierBottomSheetRef.current?.present();
  }, []);

  const handleCreateSupplier = useCallback(() => {
    if (!supplierForm.name.trim()) {
      Alert.alert(t("common.error"), t("supplier.nameRequired"));
      return;
    }
    createSupplierMutation.mutate(supplierForm);
  }, [supplierForm, createSupplierMutation, t]);

  const handleCloseModal = useCallback(() => {
    Keyboard.dismiss();
    addSupplierBottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.tagsContainer}>
        {suppliers &&
          suppliers.map((supplier) => {
            return (
              <TouchableOpacity
                key={supplier.id}
                style={[
                  styles.tag,
                  { borderColor: colors.border },
                  selectedSupplierId === supplier.id && {
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + "20",
                  },
                ]}
                onPress={() => onSupplierSelect(supplier.id)}
                onLongPress={() => {
                  Alert.alert(
                    supplier.name,
                    t("supplier.deleteSupplierConfirm", "Are you sure you want to delete this supplier?"),
                    [
                      { text: t("common.cancel"), style: "cancel" },
                      {
                        text: t("common.delete"),
                        style: "destructive",
                        onPress: () => deleteSupplierMutation.mutate(supplier.id),
                      },
                    ]
                  );
                }}
                delayLongPress={500}
              >
                <Package size={12} color={colors.primary} />
                <Text
                  style={[
                    styles.tagText,
                    { color: colors.textSecondary },
                    selectedSupplierId === supplier.id && {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {supplier.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        <TouchableOpacity
          style={[styles.tag, styles.addTag, { borderColor: colors.primary }]}
          onPress={handleOpenAddSupplier}
        >
          <Plus size={14} color={colors.primary} />
          <Text style={[styles.tagText, { color: colors.primary }]}>
            {t("supplier.addSupplier")}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}

      <BottomSheetModal
        ref={addSupplierBottomSheetRef}
        index={0}
        snapPoints={addSupplierSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
        onDismiss={() => {
          Keyboard.dismiss();
          resetForm();
        }}
      >
        <BottomSheetScrollView style={[styles.bottomSheet]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t("supplier.addSupplier")}
            </Text>
          </View>

          <View style={styles.createForm}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t("supplier.name")} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                value={supplierForm.name}
                onChangeText={(text) =>
                  setSupplierForm({ ...supplierForm, name: text })
                }
                placeholder={t("supplier.namePlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t("supplier.contact")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                value={supplierForm.contact}
                onChangeText={(text) =>
                  setSupplierForm({ ...supplierForm, contact: text })
                }
                placeholder={t("supplier.contactPlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t("supplier.phone")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                value={supplierForm.phone}
                onChangeText={(text) =>
                  setSupplierForm({ ...supplierForm, phone: text })
                }
                placeholder={t("supplier.phonePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t("supplier.email")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                value={supplierForm.email}
                onChangeText={(text) =>
                  setSupplierForm({ ...supplierForm, email: text })
                }
                placeholder={t("supplier.emailPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t("supplier.address")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                value={supplierForm.address}
                onChangeText={(text) =>
                  setSupplierForm({ ...supplierForm, address: text })
                }
                placeholder={t("supplier.addressPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t("supplier.notes")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                value={supplierForm.notes}
                onChangeText={(text) =>
                  setSupplierForm({ ...supplierForm, notes: text })
                }
                placeholder={t("supplier.notesPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCloseModal}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  { backgroundColor: colors.primary },
                  createSupplierMutation.isPending &&
                    styles.createButtonDisabled,
                ]}
                onPress={handleCreateSupplier}
                disabled={createSupplierMutation.isPending}
              >
                {createSupplierMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>
                    {t("common.create")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  addTag: {
    borderStyle: "dashed",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  errorContainer: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
  },
  bottomSheet: {
    padding: 24,
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  createForm: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
