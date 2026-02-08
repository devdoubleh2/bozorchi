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
import { Plus, Hash } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Unit } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import {
  BottomSheetBackdropProps,
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useAuthContext } from "@/context/AuthContext";
import { log } from "@/debugging/log";

type UnitTagSelectorProps = {
  units?: Unit[];
  selectedUnitValue?: string;
  onUnitValueSelect: (unitValue: string) => void;
  error?: string;
};

export default function UnitTagSelector({
  units,
  selectedUnitValue,
  onUnitValueSelect,
  error,
}: UnitTagSelectorProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newUnitValueTitle, setNewUnitValueTitle] = useState("");
  const storeData = useAuthContext((state) => state.userStore);
  const isLoading = useAuthContext((state) => state.isLoading);
  const addUnitValueBottomSheetRef = useRef<BottomSheetModal>(null);
  const addUnitValueSnapPoints = useMemo(() => ["75%", "90%"], []);

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (!storeData) {
    log.debug("Store", "store is not found", storeData);
    return <ActivityIndicator />;
  }

  const createUnitMutation = useMutation({
    mutationFn: async (data: { name: string; category_id: string }) => {
      if (!units) {
        throw new Error("No unit selected");
      }
      const res = await api.post<{ unit: Unit }>("/api/units", {
        name: data.name,
        category_id: data.category_id,
      });
      return res.unit;
    },
    onSuccess: (unit: Unit) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      onUnitValueSelect(unit.id);
      setNewUnitValueTitle("");
      addUnitValueBottomSheetRef.current?.close();
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: string) => {
      return api.delete(`/api/units/${unitId}`);
    },
    onSuccess: (data, unitId) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      if (selectedUnitValue === unitId) {
        onUnitValueSelect("");
      }
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const handleOpenAddUnitValue = useCallback(() => {
    addUnitValueBottomSheetRef.current?.present();
  }, []);

  const handleCreateUnitValue = useCallback(() => {
    if (!newUnitValueTitle.trim()) {
      Alert.alert(t("common.error"), t("units.unitValueTitleRequired"));
      return;
    }
    createUnitMutation.mutate({
      name: newUnitValueTitle,
      category_id: storeData.store.category_id ?? "",
    });
  }, [newUnitValueTitle, createUnitMutation, t]);

  const handleCloseModal = useCallback(() => {
    Keyboard.dismiss();
    addUnitValueBottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      >
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        />
      </BottomSheetBackdrop>
    ),
    [isDark]
  );

  return (
    <View style={styles.container}>
      <View style={styles.tagsContainer}>
        {units &&
          units.map((unit) => {
            return (
              <TouchableOpacity
                key={unit.id}
                style={[
                  styles.tag,
                  isDark && styles.tagDark,
                  selectedUnitValue === unit.id && styles.tagSelected,
                ]}
                onPress={() => onUnitValueSelect(unit.id)}
                onLongPress={() => {
                  Alert.alert(
                    unit.name,
                    t("units.deleteUnitConfirm", "Are you sure you want to delete this unit?"),
                    [
                      { text: t("common.cancel"), style: "cancel" },
                      {
                        text: t("common.delete"),
                        style: "destructive",
                        onPress: () => deleteUnitMutation.mutate(unit.id),
                      },
                    ]
                  );
                }}
                delayLongPress={500}
              >
                <Hash size={12} color="#4fc3f7" />
                <Text
                  style={[
                    styles.tagText,
                    isDark && styles.tagTextDark,
                    selectedUnitValue === unit.id && styles.tagTextSelected,
                  ]}
                >
                  {unit.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        <TouchableOpacity
          style={[styles.tag, isDark && styles.tagDark, styles.addTag]}
          onPress={handleOpenAddUnitValue}
        >
          <Plus size={14} color="#4fc3f7" />
          <Text style={[styles.tagText, styles.addTagText]}>
            {t("units.addUnitValue")}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <BottomSheetModal
        ref={addUnitValueBottomSheetRef}
        index={0}
        snapPoints={addUnitValueSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: isDark ? "#1e293b" : "#fff" }}
        handleIndicatorStyle={{ backgroundColor: isDark ? "#888" : "#ccc" }}
        onDismiss={() => Keyboard.dismiss()}
      >
        <BottomSheetView
          style={[styles.bottomSheet, isDark && styles.bottomSheetDark]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {t("units.createUnitValue")}
            </Text>
          </View>

          <View style={styles.createForm}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder={t("units.enterUnitValueTitle")}
              placeholderTextColor={isDark ? "#888" : "#999"}
              value={newUnitValueTitle}
              onChangeText={setNewUnitValueTitle}
              onFocus={() => addUnitValueBottomSheetRef.current?.snapToIndex(1)}
              onBlur={() => addUnitValueBottomSheetRef.current?.snapToIndex(0)}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, isDark && styles.cancelButtonDark]}
                onPress={handleCloseModal}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    isDark && styles.cancelButtonTextDark,
                  ]}
                >
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  createUnitMutation.isPending && styles.createButtonDisabled,
                ]}
                onPress={handleCreateUnitValue}
                disabled={createUnitMutation.isPending}
              >
                {createUnitMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>
                    {t("common.create")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetView>
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
    borderColor: "#e2e8f0",
    backgroundColor: "transparent",
  },
  tagDark: {
    borderColor: "#333",
    backgroundColor: "#2a2a2a",
  },
  tagSelected: {
    borderColor: "#4fc3f7",
    backgroundColor: "rgba(79, 195, 247, 0.1)",
  },
  disabledTag: {
    opacity: 0.5,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginLeft: 6,
  },
  tagTextDark: {
    color: "#e0e0e0",
  },
  tagTextSelected: {
    color: "#4fc3f7",
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
  addTag: {
    borderColor: "#4fc3f7",
    borderStyle: "dashed",
  },
  addTagText: {
    color: "#4fc3f7",
    marginLeft: 4,
  },
  errorContainer: {
    marginTop: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
  },
  bottomSheet: {
    padding: 20,
    flex: 1,
  },
  bottomSheetDark: {
    backgroundColor: "#1e293b",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  modalTitleDark: {
    color: "#ffffff",
  },
  closeButton: {
    padding: 4,
  },
  createForm: {
    flex: 1,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "transparent",
    marginBottom: 20,
  },
  inputDark: {
    backgroundColor: "#2a2a2a",
    borderColor: "#333333",
    color: "#ffffff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "transparent",
  },
  cancelButtonDark: {
    borderColor: "#333333",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonTextDark: {
    color: "#ccc",
  },
  createButton: {
    flex: 1,
    backgroundColor: "#4fc3f7",
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
