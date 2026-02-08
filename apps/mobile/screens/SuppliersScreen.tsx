import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Package,
  Phone,
  Mail,
} from "lucide-react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthContext } from "../context/AuthContext";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

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
  _count?: {
    supplier_orders: number;
    supplier_payments: number;
  };
}

export default function SuppliersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const createSheetRef = useRef<BottomSheetModal>(null);
  const editSheetRef = useRef<BottomSheetModal>(null);

  // Fetch suppliers
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);

      const query = params.toString();
      const path = query ? `/api/suppliers?${query}` : "/api/suppliers";

      const response = await api.get<{ suppliers: Supplier[] }>(path);
      return response.suppliers as Supplier[];
    },
    enabled: !!user,
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (data: typeof supplierForm) => {
      return await api.post("/api/suppliers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      createSheetRef.current?.dismiss();
      resetForm();
      Alert.alert(t("common.success"), t("supplier.createSuccess"));
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: typeof supplierForm;
    }) => {
      return await api.put(`/api/suppliers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      editSheetRef.current?.dismiss();
      setSelectedSupplier(null);
      resetForm();
      Alert.alert(t("common.success"), t("supplier.updateSuccess"));
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      Alert.alert(t("common.success"), t("supplier.deleteSuccess"));
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

  const handleCreateSupplier = useCallback(() => {
    if (!supplierForm.name.trim()) {
      Alert.alert(t("common.error"), t("supplier.nameRequired"));
      return;
    }
    createSupplierMutation.mutate(supplierForm);
  }, [supplierForm, t]);

  const handleUpdateSupplier = useCallback(() => {
    if (!selectedSupplier || !supplierForm.name.trim()) {
      Alert.alert(t("common.error"), t("supplier.nameRequired"));
      return;
    }
    updateSupplierMutation.mutate({
      id: selectedSupplier.id,
      data: supplierForm,
    });
  }, [selectedSupplier, supplierForm, t]);

  const handleDeleteSupplier = useCallback(
    (supplier: Supplier) => {
      Alert.alert(
        t("supplier.deleteTitle"),
        t("supplier.deleteConfirm", { name: supplier.name }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: () => deleteSupplierMutation.mutate(supplier.id),
          },
        ]
      );
    },
    [t]
  );

  const handleEditSupplier = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contact: supplier.contact || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    editSheetRef.current?.present();
  }, []);

  const handleViewDetails = useCallback(
    (supplier: Supplier) => {
      navigation.navigate("SupplierDetails", { supplierId: supplier.id });
    },
    [navigation]
  );

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

  const renderSupplierItem = useCallback(
    ({ item }: { item: Supplier }) => {
      return (
        <Swipeable
          renderRightActions={() => (
            <View style={styles.swipeActions}>
              <TouchableOpacity
                style={[
                  styles.swipeButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => handleEditSupplier(item)}
              >
                <Edit size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.swipeButton, { backgroundColor: colors.error }]}
                onPress={() => handleDeleteSupplier(item)}
              >
                <Trash2 size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        >
          <TouchableOpacity
            style={[
              styles.supplierCard,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => handleViewDetails(item)}
            activeOpacity={0.7}
          >
            <View style={styles.supplierHeader}>
              <View
                style={[
                  styles.supplierIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Package size={24} color={colors.primary} />
              </View>
              <View style={styles.supplierInfo}>
                <Text
                  style={[styles.supplierName, { color: colors.textPrimary }]}
                >
                  {item.name}
                </Text>
                {item.contact && (
                  <Text
                    style={[
                      styles.supplierContact,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.contact}
                  </Text>
                )}
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </View>

            {(item.phone || item.email) && (
              <View style={styles.supplierDetails}>
                {item.phone && (
                  <View style={styles.detailRow}>
                    <Phone size={14} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.detailText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.phone}
                    </Text>
                  </View>
                )}
                {item.email && (
                  <View style={styles.detailRow}>
                    <Mail size={14} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.detailText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.email}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {item._count && (
              <View
                style={[
                  styles.supplierStats,
                  { borderTopColor: colors.border },
                ]}
              >
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: colors.textPrimary }]}
                  >
                    {item._count.supplier_orders}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("supplier.orders")}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: colors.textPrimary }]}
                  >
                    {item._count.supplier_payments}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t("supplier.payments")}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Swipeable>
      );
    },
    [colors, t, handleEditSupplier, handleDeleteSupplier, handleViewDetails]
  );

  const renderSupplierForm = (isEdit: boolean) => (
    <BottomSheetScrollView style={styles.sheetContent}>
      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
        {isEdit ? t("supplier.editSupplier") : t("supplier.addSupplier")}
      </Text>

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

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={isEdit ? handleUpdateSupplier : handleCreateSupplier}
        disabled={
          createSupplierMutation.isPending || updateSupplierMutation.isPending
        }
      >
        {createSupplierMutation.isPending ||
        updateSupplierMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEdit ? t("common.save") : t("common.create")}
          </Text>
        )}
      </TouchableOpacity>
    </BottomSheetScrollView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        testID="suppliers-screen"
      >
        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : suppliers && suppliers.length > 0 ? (
          <FlatList
            data={suppliers}
            renderItem={renderSupplierItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Package size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery
                ? t("supplier.noResults")
                : t("supplier.noSuppliers")}
            </Text>
          </View>
        )}

        {/* Create Supplier Bottom Sheet */}
        <BottomSheetModal
          ref={createSheetRef}
          index={0}
          snapPoints={["90%"]}
          onDismiss={() => {
            resetForm();
          }}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
        >
          {renderSupplierForm(false)}
        </BottomSheetModal>

        {/* Edit Supplier Bottom Sheet */}
        <BottomSheetModal
          ref={editSheetRef}
          index={0}
          snapPoints={["90%"]}
          onDismiss={() => {
            setSelectedSupplier(null);
            resetForm();
          }}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
        >
          {renderSupplierForm(true)}
        </BottomSheetModal>

        {/* FAB Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            resetForm();
            createSheetRef.current?.present();
          }}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    
    paddingBottom: 100,
  },
  supplierCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  supplierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  supplierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  supplierContact: {
    fontSize: 14,
  },
  supplierDetails: {
    marginTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  supplierStats: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  swipeActions: {
    flexDirection: "row",
  },
  swipeButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
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
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    position: "absolute",
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
