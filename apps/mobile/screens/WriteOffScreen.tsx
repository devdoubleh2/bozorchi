import React, {
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
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
  Keyboard,
  Modal,
} from "react-native";
import {
  Trash2,
  Plus,
  Calendar,
  Package,
  AlertTriangle,
  BarChart3,
  Scan,
  X,
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
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

const Tab = createMaterialTopTabNavigator();

interface WriteOff {
  id: string;
  quantity: number;
  reason: "theft" | "damage" | "expiry" | "defect" | "other";
  notes: string | null;
  write_off_date: string;
  product_variation: {
    id: string;
    name: string;
    barcode: string;
    selling_price: number;
    product: {
      name: string;
    };
    unit: {
      name: string;
    };
  };
  user: {
    email: string;
  };
}

interface WriteOffSummary {
  totalWriteOffs: number;
  totalQuantity: number;
  totalValue: number;
  summaryByReason: Record<
    string,
    {
      count: number;
      totalQuantity: number;
      totalValue: number;
    }
  >;
}

// List Tab Component
function WriteOffListTab() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);

  const { data: writeOffs, isLoading } = useQuery({
    queryKey: ["writeOffs"],
    queryFn: async () => {
      const response = await api.get<{ writeOffs: WriteOff[] }>(
        "/api/write-offs"
      );
      return response.writeOffs as WriteOff[];
    },
    enabled: !!user,
  });

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "theft":
        return "#ef4444";
      case "damage":
        return "#f59e0b";
      case "expiry":
        return "#8b5cf6";
      case "defect":
        return "#ec4899";
      default:
        return "#6b7280";
    }
  };

  const renderWriteOffItem = useCallback(
    ({ item }: { item: WriteOff }) => {
      const value = item.quantity * item.product_variation.selling_price;
      return (
        <View
          style={[styles.writeOffCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.writeOffHeader}>
            <View
              style={[
                styles.reasonBadge,
                { backgroundColor: getReasonColor(item.reason) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.reasonText,
                  { color: getReasonColor(item.reason) },
                ]}
              >
                {t(`writeOff.reason.${item.reason}`) as string}
              </Text>
            </View>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date(item.write_off_date).toLocaleDateString()}
            </Text>
          </View>

          <Text style={[styles.productName, { color: colors.textPrimary }]}>
            {item.product_variation.product.name}
          </Text>
          <Text style={[styles.variationName, { color: colors.textSecondary }]}>
            {item.product_variation.name}
          </Text>

          <View style={styles.writeOffDetails}>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                {t("writeOff.quantity")}:
              </Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {item.quantity} {item.product_variation.unit.name}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                {t("writeOff.value")}:
              </Text>
              <Text style={[styles.detailValue, { color: colors.error }]}>
                {value.toLocaleString()} {t("common.currency")}
              </Text>
            </View>
          </View>

          {item.notes && (
            <Text style={[styles.notes, { color: colors.textSecondary }]}>
              {item.notes}
            </Text>
          )}

          <Text style={[styles.userText, { color: colors.textSecondary }]}>
            {t("writeOff.recordedBy")}: {item.user.email}
          </Text>
        </View>
      );
    },
    [colors, t]
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!writeOffs || writeOffs.length === 0) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: colors.background }]}
      >
        <Trash2 size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t("writeOff.noWriteOffs")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={writeOffs}
        renderItem={renderWriteOffItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={{ backgroundColor: colors.background }}
      />
    </View>
  );
}

// Stats Tab Component
function WriteOffStatsTab() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);

  const { data: summary } = useQuery({
    queryKey: ["writeOffSummary"],
    queryFn: async () => {
      const response = await api.get<WriteOffSummary>(
        "/api/write-offs/summary"
      );
      return response as WriteOffSummary;
    },
    enabled: !!user,
  });

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "theft":
        return "#ef4444";
      case "damage":
        return "#f59e0b";
      case "expiry":
        return "#8b5cf6";
      case "defect":
        return "#ec4899";
      default:
        return "#6b7280";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[styles.statsContainer, { backgroundColor: colors.background }]}
      >
        {summary && (
          <>
            <View
              style={[styles.statsCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>
                {t("writeOff.overview")}
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: colors.textPrimary }]}
                  >
                    {summary.totalWriteOffs}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t("writeOff.totalWriteOffs")}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statValue, { color: colors.textPrimary }]}
                  >
                    {summary.totalQuantity}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t("writeOff.totalQuantity")}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.error }]}>
                    {summary.totalValue.toLocaleString()}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t("writeOff.totalValue")}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.statsCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>
                {t("writeOff.byReason")}
              </Text>
              {Object.entries(summary.summaryByReason).map(([reason, data]) => (
                <View
                  key={reason}
                  style={[
                    styles.reasonRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.reasonDot,
                      { backgroundColor: getReasonColor(reason) },
                    ]}
                  />
                  <View style={styles.reasonInfo}>
                    <Text
                      style={[styles.reasonName, { color: colors.textPrimary }]}
                    >
                      {t(`writeOff.reason.${reason}`) as string}
                    </Text>
                    <Text
                      style={[
                        styles.reasonStats,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {data.count} {t("writeOff.items")} • {data.totalQuantity}{" "}
                      {t("common.units")}
                    </Text>
                  </View>
                  <Text style={[styles.reasonValue, { color: colors.error }]}>
                    {data.totalValue.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

export default function WriteOffScreen() {
  const [writeOffForm, setWriteOffForm] = useState({
    productVariationId: "",
    barcode: "",
    quantity: "",
    reason: "damage" as "theft" | "damage" | "expiry" | "defect" | "other",
    notes: "",
  });
  const [showScanner, setShowScanner] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [foundProduct, setFoundProduct] = useState<{
    productName: string;
    variationName: string;
    unitName: string;
  } | null>(null);

  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const createSheetRef = useRef<BottomSheetModal>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Create write-off mutation
  const createWriteOffMutation = useMutation({
    mutationFn: async (data: typeof writeOffForm) => {
      return await api.post("/api/write-offs", {
        productVariationId: data.productVariationId,
        quantity: parseInt(data.quantity),
        reason: data.reason,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["writeOffs"] });
      queryClient.invalidateQueries({ queryKey: ["writeOffSummary"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      createSheetRef.current?.dismiss();
      resetForm();
      Alert.alert(t("common.success"), t("writeOff.createSuccess"));
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  // Fetch product by barcode
  const searchByBarcodeMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await api.get<{
        inventory: {
          product_variation_id: string;
          product_variation: {
            barcode: string;
            name: string;
            product: { name: string };
            unit: { name: string };
          };
        }[];
      }>(`/api/inventory?search=${barcode}`);
      return response.inventory;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const item = data[0];
        setWriteOffForm((prev) => ({
          ...prev,
          productVariationId: item.product_variation_id,
          barcode: item.product_variation.barcode,
        }));
        setFoundProduct({
          productName: item.product_variation.product.name,
          variationName: item.product_variation.name,
          unitName: item.product_variation.unit.name,
        });
        setShowScanner(false);
      } else {
        Alert.alert(t("common.error"), t("writeOff.productNotFound"));
      }
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const resetForm = () => {
    setWriteOffForm({
      productVariationId: "",
      barcode: "",
      quantity: "",
      reason: "damage",
      notes: "",
    });
    setFoundProduct(null);
  };

  const handleCreateWriteOff = useCallback(() => {
    if (!writeOffForm.productVariationId) {
      Alert.alert(t("common.error"), t("writeOff.productRequired"));
      return;
    }
    if (!writeOffForm.quantity || parseInt(writeOffForm.quantity) <= 0) {
      Alert.alert(t("common.error"), t("writeOff.quantityRequired"));
      return;
    }
    createWriteOffMutation.mutate(writeOffForm);
  }, [writeOffForm, t]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      searchByBarcodeMutation.mutate(data);
    },
    [searchByBarcodeMutation]
  );

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
    if (status === "granted") {
      setShowScanner(true);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="write-off-screen"
    >
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "600",
            textTransform: "none",
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
            height: 3,
          },
        }}
      >
        <Tab.Screen
          name="WriteOffList"
          component={WriteOffListTab}
          options={{ tabBarLabel: t("writeOff.list") }}
        />
        <Tab.Screen
          name="WriteOffStats"
          component={WriteOffStatsTab}
          options={{ tabBarLabel: t("writeOff.statistics") }}
        />
      </Tab.Navigator>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          resetForm();
          createSheetRef.current?.present();
        }}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Write-off Bottom Sheet */}
      <BottomSheetModal
        ref={createSheetRef}
        index={0}
        snapPoints={keyboardHeight > 0 ? ["90%"] : ["80%"]}
        onDismiss={() => {
          resetForm();
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
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
            {t("writeOff.recordWriteOff")}
          </Text>

          {showScanner && hasPermission ? (
            <View style={styles.scannerContainer}>
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
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t("writeOff.product")} *
                </Text>
                <View style={styles.barcodeRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.barcodeInput,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={writeOffForm.barcode}
                    onChangeText={(text) => {
                      setWriteOffForm({ ...writeOffForm, barcode: text });
                      if (text.length >= 8) {
                        searchByBarcodeMutation.mutate(text);
                      }
                    }}
                    placeholder={t("writeOff.scanOrEnter")}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity
                    style={[
                      styles.scanButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={requestCameraPermission}
                  >
                    <Scan size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t("writeOff.quantity")} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={writeOffForm.quantity}
                  onChangeText={(text) =>
                    setWriteOffForm({ ...writeOffForm, quantity: text })
                  }
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t("writeOff.reasonLabel")} *
                </Text>
                <View
                  style={[
                    styles.pickerContainer,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Picker
                    selectedValue={writeOffForm.reason}
                    onValueChange={(value) =>
                      setWriteOffForm((prev) => ({ ...prev, reason: value }))
                    }
                    style={{ color: colors.textPrimary }}
                    dropdownIconColor={colors.textPrimary}
                    mode="dropdown"
                  >
                    <Picker.Item
                      label={t("writeOff.reason.theft")}
                      value="theft"
                      color={colors.textPrimary}
                    />
                    <Picker.Item
                      label={t("writeOff.reason.damage")}
                      value="damage"
                      color={colors.textPrimary}
                    />
                    <Picker.Item
                      label={t("writeOff.reason.expiry")}
                      value="expiry"
                      color={colors.textPrimary}
                    />
                    <Picker.Item
                      label={t("writeOff.reason.defect")}
                      value="defect"
                      color={colors.textPrimary}
                    />
                    <Picker.Item
                      label={t("writeOff.reason.other")}
                      value="other"
                      color={colors.textPrimary}
                    />
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t("writeOff.notes")}
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
                  value={writeOffForm.notes}
                  onChangeText={(text) =>
                    setWriteOffForm({ ...writeOffForm, notes: text })
                  }
                  placeholder={t("writeOff.notesPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleCreateWriteOff}
                disabled={createWriteOffMutation.isPending}
              >
                {createWriteOffMutation.isPending ? (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  writeOffCard: {
    padding: 16,
    borderRadius: 12,
  },
  writeOffHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reasonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  variationName: {
    fontSize: 14,
    marginBottom: 12,
  },
  writeOffDetails: {
    gap: 8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  notes: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
  },
  userText: {
    fontSize: 12,
    marginTop: 8,
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
  statsContainer: {
    padding: 16,
    gap: 16,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  reasonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reasonInfo: {
    flex: 1,
  },
  reasonName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  reasonStats: {
    fontSize: 12,
  },
  reasonValue: {
    fontSize: 14,
    fontWeight: "600",
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
  barcodeRow: {
    flexDirection: "row",
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: "hidden",
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
  scannerContainer: {
    height: 400,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
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
  fab: {
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
