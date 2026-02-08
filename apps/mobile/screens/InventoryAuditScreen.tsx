import React, { useState, useCallback, useRef, useEffect } from "react";
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
  CheckCircle,
  XCircle,
  Scan,
  Edit,
  AlertTriangle,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthContext } from "../context/AuthContext";
import { Camera, CameraView } from "expo-camera";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { log } from "@/debugging/log";
import { Swipeable } from "react-native-gesture-handler";

interface AuditItem {
  id: string;
  expected_quantity: number;
  actual_quantity: number;
  difference: number;
  notes: string | null;
  product_variation: {
    id: string;
    name: string;
    barcode: string;
    product: {
      name: string;
    };
    unit: {
      name: string;
    };
  };
}

interface Audit {
  id: string;
  audit_date: string;
  status: "in_progress" | "completed" | "cancelled";
  notes: string | null;
  user: {
    email: string;
  };
  audit_items?: AuditItem[];
  totalDiscrepancies?: number;
  itemsWithDiscrepancies?: number;
}

export default function InventoryAuditScreen() {
  const [activeAudit, setActiveAudit] = useState<Audit | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [editingItem, setEditingItem] = useState<AuditItem | null>(null);
  const [manualQuantity, setManualQuantity] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);
  const queryClient = useQueryClient();

  const editSheetRef = useRef<BottomSheetModal>(null);

  // Fetch audit history
  const { data: audits, isLoading } = useQuery({
    queryKey: ["audits"],
    queryFn: async () => {
      const response = await api.get<{ data: { audits: Audit[] } }>(
        "/api/audit/history"
      );
      return response.data.audits;
    },
    enabled: !!user && !activeAudit,
  });

  // Fetch active audit details
  const { data: auditDetails, refetch: refetchAudit } = useQuery({
    queryKey: ["audit", activeAudit?.id],
    queryFn: async () => {
      if (!activeAudit) return null;
      const response = await api.get<{ data: { audit: Audit } }>(
        `/api/audit/${activeAudit.id}`
      );
      return response.data.audit;
    },
    enabled: !!activeAudit,
  });

  const resumeExistingAudit = useCallback(
    async (auditId: string) => {
      if (activeAudit?.id === auditId) {
        Alert.alert(t("audit.auditInProgressTitle"), t("audit.auditResumed"));
        return;
      }

      try {
        const response = await api.get<{ data: { audit: Audit } }>(
          `/api/audit/${auditId}`
        );
        setActiveAudit(response.data.audit);
        Alert.alert(t("audit.auditInProgressTitle"), t("audit.auditResumed"));
      } catch (fetchError) {
        log.error(
          "InventoryAuditScreen",
          "Fetch active audit error",
          fetchError as Error
        );
        Alert.alert(t("common.error"), t("audit.auditResumeFailed"));
      }
    },
    [activeAudit?.id, t]
  );

  // Start audit mutation
  const startAuditMutation = useMutation({
    mutationFn: async () => {
      return await api.post<{ data: { audit: Audit } }>("/api/audit/start", {});
    },
    onSuccess: (response) => {
      setActiveAudit(response.data.audit);
      Alert.alert(t("common.success"), t("audit.auditStarted"));
    },
    onError: (error: Error) => {
      log.error("InventoryAuditScreen", "Start audit error", error);
      let parsedError: { error?: string; auditId?: string } | null = null;

      try {
        parsedError = JSON.parse(error.message);
      } catch {
        // Ignore JSON parse errors and fall back to default messaging
      }

      if (parsedError?.auditId) {
        void resumeExistingAudit(parsedError.auditId);
        return;
      }

      if (parsedError?.error) {
        Alert.alert(t("common.error"), parsedError.error);
        return;
      }

      Alert.alert(t("common.error"), t("audit.auditStartFailed"));
    },
  });

  // Scan item mutation
  const scanItemMutation = useMutation({
    mutationFn: async (barcode: string) => {
      if (!activeAudit) throw new Error("No active audit");
      return await api.post(`/api/audit/${activeAudit.id}/scan`, { barcode });
    },
    onSuccess: () => {
      refetchAudit();
    },
    onError: (error: Error) => {
      log.error("InventoryAuditScreen", "Scan item error", error);
    },
  });

  // Update audit item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({
      productVariationId,
      actualQuantity,
    }: {
      productVariationId: string;
      actualQuantity: number;
    }) => {
      if (!activeAudit) throw new Error("No active audit");
      return await api.put(`/api/audit/${activeAudit.id}/item`, {
        productVariationId,
        actualQuantity,
      });
    },
    onSuccess: () => {
      refetchAudit();
      editSheetRef.current?.dismiss();
      setEditingItem(null);
      setManualQuantity("");
      Alert.alert(t("common.success"), t("audit.itemUpdated"));
    },
    onError: (error: Error) => {
      log.error("InventoryAuditScreen", "Update item error", error);
    },
  });

  // Complete audit mutation
  const completeAuditMutation = useMutation({
    mutationFn: async () => {
      if (!activeAudit) throw new Error("No active audit");
      return await api.post(`/api/audit/${activeAudit.id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setActiveAudit(null);
      Alert.alert(t("common.success"), t("audit.auditCompleted"));
    },
    onError: (error: Error) => {
      log.error("InventoryAuditScreen", "Complete audit error", error);
    },
  });

  // Cancel audit mutation
  const cancelAuditMutation = useMutation({
    mutationFn: async () => {
      if (!activeAudit) throw new Error("No active audit");
      return await api.put(`/api/audit/${activeAudit.id}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      setActiveAudit(null);
      Alert.alert(t("common.success"), t("audit.auditCancelled"));
    },
    onError: (error: Error) => {
      log.error("InventoryAuditScreen", "Cancel audit error", error);
    },
  });

  useEffect(() => {
    if (!activeAudit?.id && audits) {
      const existingAudit = audits.find(
        (auditItem) => auditItem.status === "in_progress"
      );

      if (existingAudit) {
        setActiveAudit(existingAudit);
      }
    }
  }, [activeAudit?.id, audits]);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
    if (status === "granted") {
      setShowScanner(true);
    }
  };

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      scanItemMutation.mutate(data);
      setShowScanner(false);
    },
    [scanItemMutation]
  );

  const handleStartAudit = () => {
    Alert.alert(t("audit.startAuditTitle"), t("audit.startAuditConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        onPress: () => startAuditMutation.mutate(),
      },
    ]);
  };

  const handleCompleteAudit = () => {
    Alert.alert(
      t("audit.completeAuditTitle"),
      t("audit.completeAuditConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          onPress: () => completeAuditMutation.mutate(),
        },
      ]
    );
  };

  const handleCancelAudit = () => {
    Alert.alert(t("audit.cancelAuditTitle"), t("audit.cancelAuditConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        style: "destructive",
        onPress: () => cancelAuditMutation.mutate(),
      },
    ]);
  };

  const handleEditItem = (item: AuditItem) => {
    setEditingItem(item);
    setManualQuantity(item.actual_quantity.toString());
    editSheetRef.current?.present();
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    const quantity = parseInt(manualQuantity);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert(t("common.error"), t("audit.invalidQuantity"));
      return;
    }
    updateItemMutation.mutate({
      productVariationId: editingItem.product_variation.id,
      actualQuantity: quantity,
    });
  };

  const renderAuditItem = useCallback(
    ({ item }: { item: AuditItem }) => {
      const hasDiscrepancy = item.difference !== 0;
      const renderRightActions = () => (
        <View style={styles.auditActionsContainer}>
          <TouchableOpacity
            style={[
              styles.auditActionButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => handleEditItem(item)}
          >
            <Edit size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      );

      return (
        <Swipeable renderRightActions={renderRightActions}>
          <TouchableOpacity
            style={[
              styles.auditItemCard,
              {
                backgroundColor: colors.surface,
                borderLeftWidth: 4,
                borderLeftColor: hasDiscrepancy ? colors.error : colors.success,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => handleEditItem(item)}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text
                  style={[styles.productName, { color: colors.textPrimary }]}
                >
                  {item.product_variation.product.name}
                </Text>
                <Text
                  style={[styles.variationName, { color: colors.textSecondary }]}
                >
                  {item.product_variation.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleEditItem(item)}>
                <Edit size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.quantityRow,
                { borderTopColor: colors.border },
              ]}
            >
              <View style={styles.quantityItem}>
                <Text
                  style={[styles.quantityLabel, { color: colors.textSecondary }]}
                >
                  {t("audit.expected")}
                </Text>
                <Text
                  style={[styles.quantityValue, { color: colors.textPrimary }]}
                >
                  {item.expected_quantity}
                </Text>
              </View>

              <View style={styles.quantityItem}>
                <Text
                  style={[styles.quantityLabel, { color: colors.textSecondary }]}
                >
                  {t("audit.actual")}
                </Text>
                <Text
                  style={[styles.quantityValue, { color: colors.textPrimary }]}
                >
                  {item.actual_quantity}
                </Text>
              </View>

              <View style={styles.quantityItem}>
                <Text
                  style={[styles.quantityLabel, { color: colors.textSecondary }]}
                >
                  {t("audit.difference")}
                </Text>
                <Text
                  style={[
                    styles.quantityValue,
                    {
                      color: hasDiscrepancy
                        ? item.difference > 0
                          ? colors.success
                          : colors.error
                        : colors.textPrimary,
                    },
                  ]}
                >
                  {item.difference > 0 && "+"}
                  {item.difference}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      );
    },
    [colors, t, handleEditItem]
  );

  const renderHistoryItem = useCallback(
    ({ item }: { item: Audit }) => {
      const statusColor =
        item.status === "completed"
          ? colors.success
          : item.status === "cancelled"
          ? colors.error
          : colors.warning;

      return (
        <TouchableOpacity
          style={[
            styles.historyCard,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() => setActiveAudit(item)}
          activeOpacity={0.7}
        >
          <View style={styles.historyHeader}>
            <Text style={[styles.historyDate, { color: colors.textPrimary }]}>
              {new Date(item.audit_date).toLocaleDateString()}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {t(`audit.status.${item.status}`)}
              </Text>
            </View>
          </View>

          <View style={styles.historyStats}>
            <Text style={[styles.historyStat, { color: colors.textSecondary }]}>
              {item.audit_items?.length || 0} {t("audit.itemsScanned")}
            </Text>
            {item.itemsWithDiscrepancies !== undefined && (
              <Text style={[styles.historyStat, { color: colors.error }]}>
                {item.itemsWithDiscrepancies} {t("audit.discrepancies")}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [colors, t]
  );

  // Active audit view
  if (activeAudit || auditDetails) {
    const currentAudit = auditDetails || activeAudit;
    if (!currentAudit) return null;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {currentAudit.audit_items?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t("audit.itemsScanned")}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {currentAudit.itemsWithDiscrepancies || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t("audit.discrepancies")}
              </Text>
            </View>
          </View>
        </View>

        {/* Scan Button */}
        {currentAudit.status === "in_progress" && (
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: colors.primary }]}
            onPress={requestCameraPermission}
          >
            <Scan size={24} color="#fff" />
            <Text style={styles.scanButtonText}>{t("audit.scanBarcode")}</Text>
          </TouchableOpacity>
        )}

        {/* Items List */}
        <FlatList
          data={currentAudit.audit_items || []}
          renderItem={renderAuditItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Scan size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("audit.noItemsScanned")}
              </Text>
            </View>
          }
        />

        {/* Action Buttons */}
        {currentAudit.status === "in_progress" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleCancelAudit}
              disabled={cancelAuditMutation.isPending}
            >
              {cancelAuditMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <XCircle size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {t("audit.cancelAudit")}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.completeButton,
                { backgroundColor: colors.success },
              ]}
              onPress={handleCompleteAudit}
              disabled={completeAuditMutation.isPending}
            >
              {completeAuditMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {t("audit.completeAudit")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Scanner Modal */}
        {showScanner && hasPermission && (
          <View style={styles.scannerOverlay}>
            <CameraView
              style={styles.scanner}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "code128"],
              }}
            />
            <TouchableOpacity
              style={[
                styles.closeScannerButton,
                { backgroundColor: colors.error },
              ]}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.closeScannerText}>{t("common.close")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Item Bottom Sheet */}
        <BottomSheetModal
          ref={editSheetRef}
          index={0}
          snapPoints={["50%"]}
          onDismiss={() => {
            setEditingItem(null);
            setManualQuantity("");
          }}
          backdropComponent={(props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              pressBehavior="close"
            />
          )}
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
        >
          <BottomSheetScrollView style={styles.sheetContent}>
            {editingItem && (
              <>
                <Text
                  style={[styles.sheetTitle, { color: colors.textPrimary }]}
                >
                  {t("audit.updateQuantity")}
                </Text>

                <Text
                  style={[
                    styles.editProductName,
                    { color: colors.textPrimary },
                  ]}
                >
                  {editingItem.product_variation.product.name}
                </Text>
                <Text
                  style={[
                    styles.editVariationName,
                    { color: colors.textSecondary },
                  ]}
                >
                  {editingItem.product_variation.name}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>
                    {t("audit.expected")}: {editingItem.expected_quantity}{" "}
                    {editingItem.product_variation.unit.name}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>
                    {t("audit.actualQuantity")} *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={manualQuantity}
                    onChangeText={setManualQuantity}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleUpdateItem}
                  disabled={updateItemMutation.isPending}
                >
                  {updateItemMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {t("common.save")}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </View>
    );
  }

  // History list view
  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="inventory-audit-screen"
    >
      {/* History List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : audits && audits.length > 0 ? (
        <FlatList
          data={audits}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <AlertTriangle size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("audit.noAudits")}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {t("audit.startFirstAudit")}
          </Text>
        </View>
      )}

      {/* FAB Button */}
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: colors.primary }]}
        onPress={handleStartAudit}
        disabled={startAuditMutation.isPending}
      >
        {startAuditMutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Plus size={28} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  auditItemCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  auditActionsContainer: {
    flexDirection: "row",
  },
  auditActionButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  variationName: {
    fontSize: 14,
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  quantityItem: {
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  historyCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  historyStats: {
    flexDirection: "row",
    gap: 16,
  },
  historyStat: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButton: {
    flex: 2,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
  },
  scannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  scanner: {
    flex: 1,
  },
  closeScannerButton: {
    padding: 16,
    alignItems: "center",
  },
  closeScannerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  editProductName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  editVariationName: {
    fontSize: 14,
    marginBottom: 20,
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
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fabButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
