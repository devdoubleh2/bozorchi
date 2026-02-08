import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Plus, X } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { ProductCategory } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

type ProductCategorySelectorProps = {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string) => void;
  error?: string;
};

export default function ProductCategorySelector({
  selectedCategoryId,
  onCategorySelect,
  error,
}: ProductCategorySelectorProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#4fc3f7");

  // BottomSheet refs and snap points for add category form
  const addCategoryBottomSheetRef = useRef<BottomSheetModal>(null);
  const addCategorySnapPoints = useMemo(() => ["80%"], []);

  // Predefined colors for categories
  const categoryColors = [
    "#4fc3f7",
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#feca57",
    "#ff9ff3",
    "#a29bfe",
    "#fd79a8",
    "#e17055",
    "#81ecec",
    "#74b9ff",
  ];

  // Fetch product categories
  const { data: productCategories = [], isLoading } = useQuery<
    ProductCategory[]
  >({
    queryKey: ["productCategories"],
    queryFn: async () => {
      const res = await api.get<{ productCategories: ProductCategory[] }>(
        "/api/product-categories"
      );
      return res.productCategories;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create product category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await api.post<{ productCategory: ProductCategory }>(
        "/api/product-categories",
        data
      );
      return res.productCategory;
    },
    onSuccess: (category: ProductCategory) => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      onCategorySelect(category.id);
      setNewCategoryName("");
      setSelectedColor("#4fc3f7");
      addCategoryBottomSheetRef.current?.close();
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const handleOpenAddCategory = useCallback(() => {
    addCategoryBottomSheetRef.current?.present();
  }, []);

  const handleCreateCategory = useCallback(() => {
    if (!newCategoryName.trim()) {
      Alert.alert(t("common.error"), t("products.categoryNameRequired"));
      return;
    }
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      color: selectedColor,
    });
  }, [newCategoryName, selectedColor, createCategoryMutation, t]);

  return (
    <View style={styles.container}>
      {/* Add Category Button */}
      <TouchableOpacity
        style={[
          styles.addCategoryButton,
          isDark && styles.addCategoryButtonDark,
        ]}
        onPress={handleOpenAddCategory}
      >
        <Plus size={20} color={isDark ? "#fff" : "#4fc3f7"} />
        <Text
          style={[styles.addCategoryText, isDark && styles.addCategoryTextDark]}
        >
          {t("products.addCategory")}
        </Text>
      </TouchableOpacity>

      {/* Categories List */}
      <View style={styles.categoriesContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4fc3f7" />
            <Text
              style={[styles.loadingText, isDark && styles.loadingTextDark]}
            >
              {t("products.loadingCategories")}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.categoriesList}
          >
            {productCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategoryId === category.id &&
                  styles.selectedCategoryItem,
                  isDark && styles.categoryItemDark,
                ]}
                onPress={() => onCategorySelect(category.id)}
              >
                <View
                  style={[
                    styles.categoryColorDot,
                    { backgroundColor: category.color || "#4fc3f7" },
                  ]}
                />
                <Text
                  style={[
                    styles.categoryItemText,
                    isDark && styles.categoryItemTextDark,
                    selectedCategoryId === category.id &&
                    styles.selectedCategoryItemText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Add Category Bottom Sheet */}
      <BottomSheetModal
        ref={addCategoryBottomSheetRef}
        index={-1}
        snapPoints={addCategorySnapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: isDark ? "#1e293b" : "#fff" }}
        handleIndicatorStyle={{ backgroundColor: isDark ? "#888" : "#ccc" }}
      >
        <BottomSheetView
          style={[styles.bottomSheet, isDark && styles.bottomSheetDark]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {t("products.createCategory")}
            </Text>
            <TouchableOpacity
              onPress={() => {
                addCategoryBottomSheetRef.current?.close();
              }}
              style={styles.closeButton}
            >
              <X size={20} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>

          <View style={styles.createForm}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder={t("products.enterCategoryName")}
              placeholderTextColor={isDark ? "#888" : "#999"}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <Text style={[styles.colorLabel, isDark && styles.colorLabelDark]}>
              {t("products.selectCategoryColor")}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorPicker}
            >
              {categoryColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, isDark && styles.cancelButtonDark]}
                onPress={() => addCategoryBottomSheetRef.current?.close()}
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
                  createCategoryMutation.isPending &&
                  styles.createButtonDisabled,
                ]}
                onPress={handleCreateCategory}
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>
                    {t("products.create")}
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
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4fc3f7",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  addCategoryButtonDark: {
    borderColor: "#4fc3f7",
    backgroundColor: "rgba(79, 195, 247, 0.1)",
  },
  addCategoryText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#4fc3f7",
    fontWeight: "500",
  },
  addCategoryTextDark: {
    color: "#4fc3f7",
  },
  categoriesContainer: {
    minHeight: 100,
    maxHeight: 200,
  },
  categoriesList: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  loadingTextDark: {
    color: "#ccc",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryItemDark: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  selectedCategoryItem: {
    backgroundColor: "rgba(79, 195, 247, 0.1)",
    borderColor: "#4fc3f7",
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryItemText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  categoryItemTextDark: {
    color: "#ffffff",
  },
  selectedCategoryItemText: {
    color: "#4fc3f7",
    fontWeight: "600",
  },
  errorContainer: {
    marginTop: 4,
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
  colorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 12,
  },
  colorLabelDark: {
    color: "#e0e0e0",
  },
  colorPicker: {
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
