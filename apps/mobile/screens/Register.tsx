import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type TextInput as TextInputType,
  Dimensions,
} from "react-native";
import { useAuthContext } from "../context/AuthContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useShallow } from "zustand/react/shallow";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { RegisterData } from "@/types";
import {
  Store,
  MapPin,
  Phone,
  Search,
  User,
  Mail,
  Lock,
} from "lucide-react-native";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

type RegistrationMode = "create" | "join";

interface StoreOption {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

// Constants
const ACTIVE_OPACITY = 0.7;
const DEBOUNCE_MS = 500;
const MIN_SEARCH_CHARS = 3;

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
const PHONE_REGEX = /^(\+?998|8|)\s?-?\(?\d{2}\)?\s?-?\d{3}\s?-?\d{2}\s?-?\d{2}$/;

export const Register = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const queryClient = useQueryClient();

  // Input refs for keyboard navigation
  const emailRef = useRef<TextInputType>(null);
  const passwordRef = useRef<TextInputType>(null);
  const confirmPasswordRef = useRef<TextInputType>(null);
  const orgNameRef = useRef<TextInputType>(null);
  const addressRef = useRef<TextInputType>(null);
  const phoneRef = useRef<TextInputType>(null);

  const [mode, setMode] = useState<RegistrationMode>("create");

  // User fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Store fields for "create" mode
  const [orgName, setOrgName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("UZS");

  // Store fields for "join" mode
  const [storeId, setStoreId] = useState("");
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    orgName?: string;
    address?: string;
    phone?: string;
    storeId?: string;
    message?: string;
  }>({});

  const { signUp, getStore } = useAuthContext(
    useShallow((state) => ({
      signUp: state.signUp,
      getStore: state.getStore,
    }))
  );

  const currencies = [
    { code: "UZS", name: t("currency.UZS"), symbol: "so'm" },
    { code: "USD", name: t("currency.USD"), symbol: "$" },
    { code: "EUR", name: t("currency.EUR"), symbol: "€" },
    { code: "RUB", name: t("currency.RUB"), symbol: "₽" },
  ];

  // Store search mutation for "join" mode
  const storeSearchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await api.get<{ stores: StoreOption[] }>(
        `/api/stores/search?q=${encodeURIComponent(searchQuery)}`
      );
      return response;
    },
    onError: (error) => {
      console.error("Store search error:", error);
    },
  });

  // Memoized search trigger to avoid stale closure issues
  const triggerSearch = useCallback((query: string) => {
    storeSearchMutation.mutate(query);
  }, []);

  // Debounced store search effect
  useEffect(() => {
    if (storeSearchQuery.trim().length >= MIN_SEARCH_CHARS) {
      const debounceTimer = setTimeout(() => {
        triggerSearch(storeSearchQuery.trim());
      }, DEBOUNCE_MS);
      return () => clearTimeout(debounceTimer);
    }
  }, [storeSearchQuery, triggerSearch]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name) {
      newErrors.name = t("auth.nameRequired");
    }

    if (!email) {
      newErrors.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("auth.invalidEmail");
    }

    if (!password) {
      newErrors.password = t("auth.passwordRequired");
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = t("auth.passwordMinLength");
    } else if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
      newErrors.password = t("auth.passwordComplexity");
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t("auth.confirmPasswordRequired");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("auth.passwordsDoNotMatch");
    }

    if (mode === "create") {
      if (!orgName) {
        newErrors.orgName = t("storeSetup.errors.nameRequired");
      }
      if (!address) {
        newErrors.address = t("storeSetup.errors.addressRequired");
      }
      if (!phone) {
        newErrors.phone = t("storeSetup.errors.phoneRequired");
      } else if (!PHONE_REGEX.test(phone.replace(/[\s-]/g, ""))) {
        newErrors.phone = t("storeSetup.errors.phoneInvalid");
      }
    } else {
      if (!storeId) {
        newErrors.storeId = t("storeSetup.errors.storeRequired");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const signUpData: RegisterData = {
        name,
        email,
        password,
        role: mode === "create" ? "owner" : "cashier",
        ...(mode === "create" ? {
          organization_name: orgName.trim(),
          store_name: orgName.trim(),
          address: address.trim(),
          phone: phone.replace(/\D/g, ""),
          currency,
        } : {
          store_id: storeId,
        })
      };

      const { error, user } = await signUp(signUpData);

      if (error) {
        console.error("[Register] Error", error);
        Alert.alert(t("common.error"), error.message);
        return;
      }

      // Navigate to main app
      navigation.replace("MainApp");
    } catch (error) {
      console.error("[Register] Error:", error);
      const errorMessage = error instanceof Error ? error.message : t("auth.unexpectedError");
      Alert.alert(t("common.error"), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (store: StoreOption) => {
    setSelectedStore(store);
    setStoreId(store.id);
    setStoreSearchQuery(store.name);
    setShowStoreDropdown(false);
    setErrors((prev) => ({ ...prev, storeId: undefined }));
  };

  const renderStoreSearchResults = () => {
    const stores = storeSearchMutation.data?.stores || [];

    if (!showStoreDropdown || stores.length === 0) {
      return null;
    }

    return (
      <View style={[styles.storeDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {stores.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.storeOption, { borderBottomColor: colors.border }]}
            onPress={() => handleStoreSelect(item)}
            activeOpacity={ACTIVE_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={item.address ? `${item.name}, ${item.address}` : item.name}
          >
            <View style={styles.storeOptionContent}>
              <Text style={[styles.storeOptionName, { color: colors.textPrimary }]}>{item.name}</Text>
              {item.address && (
                <Text style={[styles.storeOptionAddress, { color: colors.textSecondary }]}>{item.address}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="register-screen"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t("auth.register")}
        </Text>

        {/* Mode Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              mode === "create" && [styles.activeTab, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setMode("create")}
            activeOpacity={ACTIVE_OPACITY}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "create" }}
            accessibilityLabel={t("storeSetup.role.owner")}
          >
            <Text
              style={[
                styles.tabText,
                { color: mode === "create" ? colors.textInverse : colors.textSecondary },
              ]}
            >
              {t("storeSetup.role.owner")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              mode === "join" && [styles.activeTab, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setMode("join")}
            activeOpacity={ACTIVE_OPACITY}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "join" }}
            accessibilityLabel={t("storeSetup.role.seller")}
          >
            <Text
              style={[
                styles.tabText,
                { color: mode === "join" ? colors.textInverse : colors.textSecondary },
              ]}
            >
              {t("storeSetup.role.seller")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: errors.name ? colors.error : colors.border }]}>
              <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t("auth.name")}
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
                textContentType="name"
                accessibilityLabel={t("auth.name")}
                accessibilityHint={t("auth.nameRequired")}
                testID="register-name-input"
              />
            </View>
            {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: errors.email ? colors.error : colors.border }]}>
              <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                ref={emailRef}
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t("auth.email")}
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                textContentType="emailAddress"
                autoComplete="email"
                accessibilityLabel={t("auth.email")}
                testID="register-email-input"
              />
            </View>
            {errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: errors.password ? colors.error : colors.border }]}>
              <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t("auth.password")}
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
                textContentType="newPassword"
                autoComplete="new-password"
                accessibilityLabel={t("auth.password")}
                testID="register-password-input"
              />
            </View>
            {errors.password && <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: errors.confirmPassword ? colors.error : colors.border }]}>
              <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                ref={confirmPasswordRef}
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t("auth.confirmPassword")}
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType={mode === "create" ? "next" : "done"}
                onSubmitEditing={() => {
                  if (mode === "create") {
                    orgNameRef.current?.focus();
                  }
                }}
                blurOnSubmit={mode !== "create"}
                textContentType="newPassword"
                autoComplete="new-password"
                accessibilityLabel={t("auth.confirmPassword")}
                testID="register-confirm-password-input"
              />
            </View>
            {errors.confirmPassword && <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text>}
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Store Setup Section - Create Mode */}
        {mode === "create" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t("storeSetup.basicInfo.title")}
            </Text>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: errors.orgName ? colors.error : colors.border }]}>
                <Store size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={orgNameRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder={t("storeSetup.storeName")}
                  placeholderTextColor={colors.textTertiary}
                  value={orgName}
                  onChangeText={setOrgName}
                  returnKeyType="next"
                  onSubmitEditing={() => addressRef.current?.focus()}
                  blurOnSubmit={false}
                  textContentType="organizationName"
                  accessibilityLabel={t("storeSetup.storeName")}
                  testID="register-org-name-input"
                />
              </View>
              {errors.orgName && <Text style={[styles.errorText, { color: colors.error }]}>{errors.orgName}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: errors.address ? colors.error : colors.border }]}>
                <MapPin size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={addressRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder={t("storeSetup.address")}
                  placeholderTextColor={colors.textTertiary}
                  value={address}
                  onChangeText={setAddress}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  blurOnSubmit={false}
                  textContentType="fullStreetAddress"
                  autoComplete="street-address"
                  accessibilityLabel={t("storeSetup.address")}
                  testID="register-address-input"
                />
              </View>
              {errors.address && <Text style={[styles.errorText, { color: colors.error }]}>{errors.address}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: errors.phone ? colors.error : colors.border }]}>
                <Phone size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={phoneRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder={t("storeSetup.phone")}
                  placeholderTextColor={colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  accessibilityLabel={t("storeSetup.phone")}
                  testID="register-phone-input"
                />
              </View>
              {errors.phone && <Text style={[styles.errorText, { color: colors.error }]}>{errors.phone}</Text>}
            </View>

            {/* Currency Selection */}
            <Text style={[styles.labelText, { color: colors.textSecondary }]}>
              {t("storeSetup.currency.title")}
            </Text>
            <View style={styles.currencyContainer}>
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    currency === curr.code && [
                      styles.currencyOptionSelected,
                      { backgroundColor: colors.primary + "20", borderColor: colors.primary },
                    ],
                  ]}
                  onPress={() => setCurrency(curr.code)}
                  activeOpacity={ACTIVE_OPACITY}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: currency === curr.code }}
                  accessibilityLabel={`${curr.name} (${curr.symbol})`}
                  testID={`register-currency-${curr.code}`}
                >
                  <Text
                    style={[
                      styles.currencyCode,
                      { color: colors.textSecondary },
                      currency === curr.code && { color: colors.primary },
                    ]}
                  >
                    {curr.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Store Setup Section - Join Mode */}
        {mode === "join" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t("storeSetup.selectStore.title")}
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              {t("storeSetup.selectStore.description")}
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.storeSearchContainer}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: errors.storeId ? colors.error : colors.border }]}>
                  <Search size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder={t("storeSetup.searchStore")}
                    placeholderTextColor={colors.textTertiary}
                    value={storeSearchQuery}
                    onChangeText={(text) => {
                      setStoreSearchQuery(text);
                      setShowStoreDropdown(text.length >= MIN_SEARCH_CHARS);
                      if (text !== selectedStore?.name) {
                        setStoreId("");
                        setSelectedStore(null);
                      }
                    }}
                    onFocus={() => {
                      if (storeSearchQuery.length >= MIN_SEARCH_CHARS) {
                        setShowStoreDropdown(true);
                      }
                    }}
                    returnKeyType="done"
                    accessibilityLabel={t("storeSetup.searchStore")}
                    testID="register-store-search-input"
                  />
                  {storeSearchMutation.isPending && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                </View>
                {renderStoreSearchResults()}
              </View>
              {errors.storeId && <Text style={[styles.errorText, { color: colors.error }]}>{errors.storeId}</Text>}
            </View>

            {selectedStore && (
              <View style={[styles.selectedStoreInfo, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
                <Text style={[styles.selectedStoreName, { color: colors.primary }]}>
                  {selectedStore.name}
                </Text>
                {selectedStore.address && (
                  <Text style={[styles.selectedStoreAddress, { color: colors.textSecondary }]}>
                    📍 {selectedStore.address}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Error Message */}
        {errors.message && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + "10", borderColor: colors.error }]}>
            <Text style={[styles.errorMessage, { color: colors.error }]}>{errors.message}</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: loading ? colors.textTertiary : colors.primary },
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={ACTIVE_OPACITY}
          accessibilityRole="button"
          accessibilityLabel={t("auth.signUp")}
          accessibilityState={{ disabled: loading, busy: loading }}
          testID="register-submit-button"
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>
              {t("auth.signUp")}
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={ACTIVE_OPACITY}
          accessibilityRole="link"
          accessibilityLabel={`${t("auth.alreadyHaveAccount")} ${t("auth.signIn")}`}
          testID="register-login-link"
        >
          <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
            {t("auth.alreadyHaveAccount")}{" "}
            <Text style={[styles.loginLinkTextBold, { color: colors.primary }]}>
              {t("auth.signIn")}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  currencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  currencyOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: "center",
  },
  currencyOptionSelected: {},
  currencyCode: {
    fontSize: 14,
    fontWeight: "600",
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
  },
  selectedStoreAddress: {
    fontSize: 14,
    marginTop: 4,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 24,
    alignItems: "center",
  },
  loginLinkText: {
    fontSize: 14,
  },
  loginLinkTextBold: {
    fontWeight: "600",
  },
});
