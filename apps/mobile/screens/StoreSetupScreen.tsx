import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useTranslation } from "react-i18next";
import { useHaptics } from "../src/hooks/useHaptics";
import {
  Store,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle,
  Search,
} from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { api } from "../lib/api";
import { useAuthContext } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../context/ThemeContext";

type Props = NativeStackScreenProps<RootStackParamList, "StoreSetup">;

type Role = "owner" | "seller" | "";

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  currency: string;
}

type StoreInfoField = keyof StoreInfo;

type FieldKey = StoreInfoField | "role" | "storeId";

interface StoreOption {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export default function StoreSetupScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { triggerHaptic } = useHaptics();
  const { colors, isDark } = useTheme();
  const [role, setRole] = useState<Role>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const user = useAuthContext((state) => state.user);
  const fetchUserStore = useAuthContext((state) => state.getStore);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: "",
    address: "",
    phone: "",
    currency: "UZS",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [currentStep, setCurrentStep] = useState(0);

  // Get store type from route params
  const { storeType } = route.params || {};

  // Store search mutation
  const storeSearchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await api.get<{ stores: StoreOption[] }>(
        `/api/stores/search?q=${encodeURIComponent(searchQuery)}`
      );
      return response;
    },
    onSuccess: (data) => {
      // Handle successful search
      console.log("Store search results:", data);
    },
    onError: (error) => {
      console.error("Store search error:", error);
      Alert.alert(t("common.error"), t("storeSetup.error.searchFailed"));
    },
  });

  const queryClient = useQueryClient();

  // Seller store assignment mutation
  const assignStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      if (!user?.id) {
        throw new Error("User not found");
      }
      const response = await api.post<{ message: string; approved?: boolean }>(
        "/api/users/assign-store",
        {
          storeId,
          role: "cashier",
        }
      );
      return response;
    },
    onSuccess: () => {
      fetchUserStore().catch((error) =>
        console.error("Failed to refresh user store:", error)
      );
      queryClient.invalidateQueries({ queryKey: ["store"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      triggerHaptic("notificationSuccess");
      Alert.alert(
        t("storeSetup.success.title"),
        t("storeSetup.success.pendingApproval"),
        [
          {
            text: t("common.ok"),
            onPress: () => navigation.replace("MainApp"),
          },
        ]
      );
    },
    onError: (error) => {
      console.error("Store assignment error:", error);
      triggerHaptic("notificationError");
      Alert.alert(t("common.error"), t("storeSetup.error.assignmentFailed"), [
        { text: t("common.ok") },
      ]);
    },
  });

  // Debounced store search effect
  useEffect(() => {
    if (storeSearchQuery.trim().length > 2) {
      const debounceTimer = setTimeout(() => {
        storeSearchMutation.mutate(storeSearchQuery.trim());
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [storeSearchQuery]);

  const baseOwnerSteps = [
    {
      title: t("storeSetup.basicInfo.title"),
      description: t("storeSetup.basicInfo.description"),
      fields: ["name", "address"] as StoreInfoField[],
    },
    {
      title: t("storeSetup.contactInfo.title"),
      description: t("storeSetup.contactInfo.description"),
      fields: ["phone"] as StoreInfoField[],
    },
    {
      title: t("storeSetup.currency.title"),
      description: t("storeSetup.currency.description"),
      fields: ["currency"] as StoreInfoField[],
    },
  ];

  const baseSellerSteps = [
    {
      title: t("storeSetup.selectStore.title"),
      description: t("storeSetup.selectStore.description"),
      fields: ["storeId"] as unknown as FieldKey[],
    },
  ];

  const steps = [
    {
      title: t("storeSetup.role.title"),
      description: t("storeSetup.role.description"),
      fields: ["role"] as unknown as FieldKey[],
    },
    ...(role === "owner"
      ? baseOwnerSteps
      : role === "seller"
      ? baseSellerSteps
      : []),
  ];

  const currencies = [
    { code: "UZS", name: t("currency.UZS"), symbol: "so'm" },
    { code: "USD", name: t("currency.USD"), symbol: "$" },
    { code: "EUR", name: t("currency.EUR"), symbol: "€" },
    { code: "RUB", name: t("currency.RUB"), symbol: "₽" },
  ];

  // Accepts formats like: +998901234567, 998901234567, 0901234567 or spaced/dashed variants
  const uzPhoneRegex =
    /^(\+?998|8|)\s?-?\(?\d{2}\)?\s?-?\d{3}\s?-?\d{2}\s?-?\d{2}$/;

  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    const newErrors: Partial<Record<FieldKey, string>> = { ...errors };

    (step.fields as FieldKey[]).forEach((field) => {
      delete newErrors[field];
      if (field === "role") {
        if (!role) {
          newErrors.role = t("storeSetup.errors.roleRequired");
        }
        return;
      }
      if (field === "storeId") {
        if (!selectedStoreId) {
          newErrors.storeId = t("storeSetup.errors.storeRequired");
        }
        return;
      }

      const value = (storeInfo[field as StoreInfoField] || "").trim();
      if (field === "name" && !value) {
        newErrors.name = t("storeSetup.errors.nameRequired");
      }
      if (field === "address" && !value) {
        newErrors.address = t("storeSetup.errors.addressRequired");
      }
      if (field === "phone") {
        if (!value) {
          newErrors.phone = t("storeSetup.errors.phoneRequired");
        } else if (!uzPhoneRegex.test(value.replace(/[\s-]/g, ""))) {
          newErrors.phone = t("storeSetup.errors.phoneInvalid");
        }
      }
      if (field === "currency" && !value) {
        newErrors.currency = t("storeSetup.errors.currencyRequired");
      }
    });

    setErrors(newErrors);
    return (step.fields as FieldKey[]).every((f) => !newErrors[f]);
  };

  const handleNext = () => {
    triggerHaptic("selection");
    const isValid = validateStep(currentStep);
    if (!isValid) {
      triggerHaptic("notificationError");
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    triggerHaptic("selection");
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const isValid = validateStep(currentStep);
    if (!isValid) {
      triggerHaptic("notificationError");
      return;
    }

    try {
      if (role === "owner") {
        // Create store with type
        if (!user?.id) {
          return null;
        }

        console.log("storeType", storeType);

        const storeData = {
          name: storeInfo.name,
          currency: storeInfo.currency,
          category_id: storeType!,
          address: storeInfo.address,
          phone: storeInfo.phone,
          userId: user.id,
          role: "owner",
        };

        await api.post("/api/stores/create", storeData);

        // Invalidate store queries
        queryClient.invalidateQueries({ queryKey: ["store"] });
        queryClient.invalidateQueries({ queryKey: ["stores"] });

        triggerHaptic("notificationSuccess");

        Alert.alert(
          t("storeSetup.success.title"),
          t("storeSetup.success.message"),
          [
            {
              text: t("common.ok"),
              onPress: () => navigation.replace("MainApp"),
            },
          ]
        );
      } else if (role === "seller") {
        // Seller flow - assign to selected store
        assignStoreMutation.mutate(selectedStoreId);
      }
    } catch (error) {
      console.error("Store creation error:", error);
      triggerHaptic("notificationError");
      Alert.alert(t("common.error"), t("storeSetup.error.createFailed"), [
        { text: t("common.ok") },
      ]);
    }
  };

  const updateStoreInfo = (field: keyof StoreInfo, value: string) => {
    setStoreInfo((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleStoreSelect = (store: StoreOption) => {
    setSelectedStore(store);
    setSelectedStoreId(store.id);
    setStoreSearchQuery(store.name);
    setShowStoreDropdown(false);
    setErrors((prev) => ({ ...prev, storeId: undefined }));
  };

  const isCurrentStepValid = () => {
    const step = steps[currentStep];
    return (step.fields as FieldKey[]).every((f) => {
      if (f === "role") {
        return Boolean(role);
      }
      if (f === "storeId") {
        return Boolean(selectedStoreId);
      }

      const raw = storeInfo[f as StoreInfoField] || "";
      const value = raw.trim();
      if (f === "phone") {
        if (!value) {
          return false;
        }
        return uzPhoneRegex.test(value.replace(/[\s-]/g, ""));
      }
      return Boolean(value);
    });
  };

  const renderFieldError = (field: FieldKey) => {
    const message = errors[field];
    if (!message) {
      return null;
    }
    return (
      <Text style={[styles.errorText, { color: colors.error }]}>{message}</Text>
    );
  };

  const renderStoreSearchResults = () => {
    const stores = storeSearchMutation.data?.stores || [];

    if (!showStoreDropdown || stores.length === 0) {
      return null;
    }

    return (
      <View
        style={[
          styles.storeDropdown,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {stores.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.storeOption, { borderBottomColor: colors.border }]}
            onPress={() => handleStoreSelect(item)}
          >
            <View style={styles.storeOptionContent}>
              <Text
                style={[styles.storeOptionName, { color: colors.textPrimary }]}
              >
                {item.name}
              </Text>
              {item.address && (
                <Text
                  style={[
                    styles.storeOptionAddress,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.address}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    const currentStepData = steps[currentStep];

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
          {currentStepData.title}
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {currentStepData.description}
        </Text>

        {(currentStepData.fields as FieldKey[]).map((field) => {
          if (field === "role") {
            return (
              <View key={field} style={styles.inputGroup}>
                <View
                  style={[
                    styles.pickerContainer,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Picker
                    selectedValue={role}
                    onValueChange={(val: Role, _index: number) => {
                      setRole(val as Role);
                      setErrors((prev) => ({ ...prev, role: undefined }));
                      setCurrentStep(0);
                    }}
                    dropdownIconColor={colors.textSecondary}
                    style={{
                      color: colors.textPrimary,
                      height: Platform.OS === "ios" ? 200 : 50,
                      borderRadius: 8,
                    }}
                    itemStyle={{
                      color: colors.textPrimary,
                    }}
                    testID="store-setup-role-picker"
                  >
                    <Picker.Item label={t("storeSetup.role.title")} value="" />
                    <Picker.Item
                      label={t("storeSetup.role.owner")}
                      value="owner"
                    />
                    <Picker.Item
                      label={t("storeSetup.role.seller")}
                      value="seller"
                    />
                  </Picker>
                </View>
                {renderFieldError("role")}
              </View>
            );
          }

          if (field === "storeId") {
            return (
              <View key={field} style={styles.inputGroup}>
                <View style={styles.storeSearchContainer}>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Search
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder={t("storeSetup.searchStore")}
                      value={storeSearchQuery}
                      onChangeText={(text) => {
                        setStoreSearchQuery(text);
                        setShowStoreDropdown(text.length > 2);
                        if (text !== selectedStore?.name) {
                          setSelectedStoreId("");
                          setSelectedStore(null);
                        }
                      }}
                      onFocus={() => {
                        if (storeSearchQuery.length > 2) {
                          setShowStoreDropdown(true);
                        }
                      }}
                      placeholderTextColor={colors.textTertiary}
                    />
                    {storeSearchMutation.isPending && (
                      <ActivityIndicator size="small" color="#007AFF" />
                    )}
                  </View>
                  {renderStoreSearchResults()}
                </View>
                {selectedStore && (
                  <View
                    style={[
                      styles.selectedStoreInfo,
                      {
                        backgroundColor: colors.primary + "20",
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectedStoreName,
                        { color: colors.primary },
                      ]}
                    >
                      {selectedStore.name}
                    </Text>
                    {selectedStore.address && (
                      <Text
                        style={[
                          styles.selectedStoreAddress,
                          { color: colors.textSecondary },
                        ]}
                      >
                        📍 {selectedStore.address}
                      </Text>
                    )}
                    {selectedStore.phone && (
                      <Text
                        style={[
                          styles.selectedStorePhone,
                          { color: colors.textSecondary },
                        ]}
                      >
                        📞 {selectedStore.phone}
                      </Text>
                    )}
                  </View>
                )}
                {renderFieldError("storeId")}
              </View>
            );
          }

          if (field === "name") {
            return (
              <View key={field} style={styles.inputGroup}>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Store
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder={t("storeSetup.storeName")}
                    value={storeInfo.name}
                    onChangeText={(text) => updateStoreInfo("name", text)}
                    placeholderTextColor={colors.textTertiary}
                    testID="store-setup-name-input"
                  />
                </View>
                {renderFieldError("name")}
              </View>
            );
          }

          if (field === "address") {
            return (
              <View key={field} style={styles.inputGroup}>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MapPin
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder={t("storeSetup.address")}
                    value={storeInfo.address}
                    onChangeText={(text) => updateStoreInfo("address", text)}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    testID="store-setup-address-input"
                  />
                </View>
                {renderFieldError("address")}
              </View>
            );
          }

          if (field === "phone") {
            return (
              <View key={field} style={styles.inputGroup}>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Phone
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder={t("storeSetup.phone")}
                    value={storeInfo.phone}
                    onChangeText={(text) => updateStoreInfo("phone", text)}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    testID="store-setup-phone-input"
                  />
                </View>
                {renderFieldError("phone")}
              </View>
            );
          }

          if (field === "currency") {
            return (
              <View key={field} style={styles.inputGroup}>
                <View style={styles.currencyContainer}>
                  {currencies.map((currency) => (
                    <TouchableOpacity
                      key={currency.code}
                      style={[
                        [
                          styles.currencyOption,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ],
                        storeInfo.currency === currency.code && [
                          styles.currencyOptionSelected,
                          {
                            backgroundColor: colors.primary + "20",
                            borderColor: colors.primary,
                          },
                        ],
                      ]}
                      onPress={() => updateStoreInfo("currency", currency.code)}
                      testID={`store-setup-currency-${currency.code}`}
                    >
                      <Text
                        style={[
                          [
                            styles.currencyCode,
                            { color: colors.textSecondary },
                          ],
                          storeInfo.currency === currency.code && [
                            styles.currencyCodeSelected,
                            { color: colors.primary },
                          ],
                        ]}
                      >
                        {currency.code}
                      </Text>
                      <Text
                        style={[
                          [
                            styles.currencyName,
                            { color: colors.textSecondary },
                          ],
                          storeInfo.currency === currency.code && [
                            styles.currencyNameSelected,
                            { color: colors.primary },
                          ],
                        ]}
                      >
                        {currency.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {renderFieldError("currency")}
              </View>
            );
          }

          return null;
        })}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="store-setup-screen"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.borderSecondary },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentStep + 1} / {steps.length}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.backButton, { borderColor: colors.border }]}
                testID="store-setup-back-button"
              >
                <Text
                  style={[
                    styles.backButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("common.back")}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              style={[
                [styles.nextButton, { backgroundColor: colors.primary }],
                (!isCurrentStepValid() || assignStoreMutation.isPending) && {
                  opacity: 0.6,
                },
              ]}
              disabled={!isCurrentStepValid() || assignStoreMutation.isPending}
              testID="store-setup-next-button"
            >
              {assignStoreMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.nextButtonText,
                      { color: colors.textInverse },
                    ]}
                  >
                    {currentStep === steps.length - 1
                      ? t("storeSetup.complete")
                      : t("common.next")}
                  </Text>
                  {currentStep === steps.length - 1 ? (
                    <CheckCircle size={20} color={colors.textInverse} />
                  ) : (
                    <ArrowRight size={20} color={colors.textInverse} />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 4,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  storeSearchContainer: {
    position: "relative",
    zIndex: 1000,
  },
  storeDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    zIndex: 1001,
  },
  storeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  storeOptionContent: {
    flex: 1,
  },
  storeOptionName: {
    fontSize: 16,
    fontWeight: "500",
  },
  storeOptionAddress: {
    fontSize: 14,
    marginTop: 2,
  },
  selectedStoreInfo: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  selectedStoreName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedStoreAddress: {
    fontSize: 14,
    marginBottom: 2,
  },
  selectedStorePhone: {
    fontSize: 14,
  },
  currencyContainer: {
    gap: 12,
  },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  currencyOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: "600",
  },
  currencyCodeSelected: {
    color: "#007AFF",
  },
  currencyName: {
    fontSize: 14,
  },
  currencyNameSelected: {
    color: "#007AFF",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 13,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
});
