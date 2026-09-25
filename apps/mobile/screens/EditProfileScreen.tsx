import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { log } from "@/debugging/log";

const { width } = Dimensions.get("window");

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user, setUser, storeData } = useAuthContext(
    useShallow((state) => ({
      user: state.user,
      setUser: state.setUser,
      storeData: state.userStore,
    }))
  );
  const [formData, setFormData] = useState({
    email: user?.email || "",
    storeName: storeData?.store?.name || "",
    currency: storeData?.store?.currency || "USD",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    storeName?: string;
  }>({});
  const [successAnimation] = useState(new Animated.Value(0));

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      return await api.put<{
        message: string;
        user: typeof user;
      }>("/api/auth/profile", data);
    },
    onSuccess: (response) => {
      log.info("EditProfileScreen", "Profile response", response);
      if (response.user) {
        setUser(response.user);
      }
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage =
        err.response?.data?.error || t("profile.updateFailed");
      Alert.alert(t("common.error"), errorMessage);
    },
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (data: { name: string; currency: string }) => {
      return await api.put("/api/stores", data);
    },
    onSuccess: (response) => {
      log.info("EditProfileScreen", "Store response", response);
      // Invalidate store-related queries
      queryClient.invalidateQueries({ queryKey: ["store"] });
      queryClient.invalidateQueries({ queryKey: ["store", user?.id] });
    },
    onError: (error) => {
      console.error("Store update error:", error);
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage =
        err.response?.data?.error || t("profile.updateFailed");
      Alert.alert(t("common.error"), errorMessage);
    },
  });

  const isLoading =
    updateProfileMutation.isPending || updateStoreMutation.isPending;

  // Generate avatar initials from email
  const avatarInitials = useMemo(() => {
    if (!user?.email) return "?";
    const parts = user.email.split("@")[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email[0].toUpperCase();
  }, [user?.email]);

  // Format member since date
  const memberSince = useMemo(() => {
    if (!user?.created_at) return "";
    const date = new Date(user.created_at);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [user?.created_at]);

  // Validate email
  const validateEmail = useCallback(
    (email: string): boolean => {
      if (!email.trim()) {
        setErrors({ email: t("auth.emailRequired") });
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrors({ email: t("auth.invalidEmail") });
        return false;
      }

      setErrors({});
      return true;
    },
    [t]
  );

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear error for this field
      if (errors[field as keyof typeof errors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleStoreInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear error for this field
      if (errors[field as keyof typeof errors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const showSuccessAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [successAnimation]);

  const handleSave = useCallback(async () => {
    // Validate email
    if (!validateEmail(formData.email)) {
      return;
    }

    // Validate store name if owner
    if (
      storeData?.store &&
      storeData?.role === "owner" &&
      formData.storeName.trim().length === 0
    ) {
      setErrors((prev) => ({
        ...prev,
        storeName: t("profile.storeNameRequired"),
      }));
      return;
    }

    // Check if anything changed
    const emailChanged = formData.email !== user?.email;
    const storeNameChanged =
      storeData?.store &&
      storeData?.role === "owner" &&
      formData.storeName !== storeData.store.name;
    const storeCurrencyChanged =
      storeData?.store &&
      storeData?.role === "owner" &&
      formData.currency !== storeData.store.currency;

    if (!emailChanged && !storeNameChanged && !storeCurrencyChanged) {
      Alert.alert(t("common.info"), t("profile.noChanges"));
      return;
    }

    try {
      // Update user profile if email changed
      if (emailChanged) {
        await updateProfileMutation.mutateAsync({
          email: formData.email,
        });
      }

      // Update store if store data changed and user is owner
      if (
        storeData?.store &&
        storeData?.role === "owner" &&
        (storeNameChanged || storeCurrencyChanged)
      ) {
        await updateStoreMutation.mutateAsync({
          name: formData.storeName,
          currency: formData.currency,
        });
      }

      showSuccessAnimation();
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      // Error handling is done in mutation onError callbacks
      console.error("Save error:", error);
    }
  }, [
    formData,
    storeData,
    user,
    t,
    navigation,
    validateEmail,
    showSuccessAnimation,
    updateProfileMutation,
    updateStoreMutation,
  ]);

  const getRoleDisplay = useCallback(
    (role?: string) => {
      if (role === "owner") return t("profile.roleOwner", { defaultValue: "Owner" });
      if (role === "cashier") return t("profile.roleCashier", { defaultValue: "Cashier" });
      return role || t("common.notSpecified");
    },
    [t]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID="edit-profile-screen"
    >
      {/* Success Banner */}
      <Animated.View
        style={[
          styles.successBanner,
          {
            opacity: successAnimation,
            transform: [
              {
                translateY: successAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.successText}>✓ {t("profile.profileUpdated")}</Text>
      </Animated.View>

      {/* Avatar Section */}
      <View
        style={[
          styles.avatarSection,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { borderColor: colors.background }]}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <View style={[styles.avatarBadge, { borderColor: colors.surface }]}>
            <Text style={styles.avatarBadgeText}>
              {getRoleDisplay(storeData?.role).charAt(0)}
            </Text>
          </View>
        </View>
        <Text style={[styles.avatarEmail, { color: colors.textPrimary }]}>
          {user?.email}
        </Text>
        <Text style={[styles.avatarRole, { color: colors.textSecondary }]}>
          {getRoleDisplay(storeData?.role)}
        </Text>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("profile.accountInfo")}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t("profile.memberSince")}
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {memberSince}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.noBorder]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t("profile.accountStatus")}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{t("profile.active")}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Store Information - Editable for Owner */}
      {storeData?.store && storeData?.role === "owner" && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.editStoreInfo")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t("settings.storeName")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                  errors.storeName && styles.inputError,
                ]}
                value={formData.storeName}
                onChangeText={(value) =>
                  handleStoreInputChange("storeName", value)
                }
                placeholder={t("settings.storeName")}
                placeholderTextColor={colors.textSecondary}
                editable={!isLoading}
              />
              {errors.storeName && (
                <Text style={styles.errorText}>{errors.storeName}</Text>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t("settings.currency")}
              </Text>
              <View style={styles.currencySelector}>
                {["USD", "UZS", "RUB", "EUR"].map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currencyButton,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                      },
                      formData.currency === curr && [
                        styles.currencyButtonActive,
                        {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => handleStoreInputChange("currency", curr)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.currencyButtonText,
                        { color: colors.textSecondary },
                        formData.currency === curr &&
                          styles.currencyButtonTextActive,
                      ]}
                    >
                      {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.infoRow, styles.noBorder]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t("profile.yourRole")}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {getRoleDisplay(storeData?.role)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Store Information - Read-only for Users */}
      {storeData?.store && storeData?.role !== "owner" && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.storeInfo")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View
              style={[styles.infoRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t("settings.storeName")}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {storeData.store.name}
              </Text>
            </View>
            <View
              style={[styles.infoRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t("settings.currency")}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {storeData.store.currency || "USD"}
              </Text>
            </View>
            <View style={[styles.infoRow, styles.noBorder]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t("profile.yourRole")}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {getRoleDisplay(storeData?.role)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Edit Personal Information */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t("profile.editPersonalInfo")}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("auth.email")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
                errors.email && styles.inputError,
              ]}
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              placeholder={t("auth.email")}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>
          <View
            style={[
              styles.inputHint,
              {
                backgroundColor: colors.backgroundSecondary,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              {t("profile.emailChangeWarning")}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            { backgroundColor: colors.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>{t("common.save")}</Text>
              <Text style={styles.buttonSubtext}>
                {t("profile.saveChanges")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            { borderColor: colors.border },
          ]}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.cancelButtonText, { color: colors.textSecondary }]}
          >
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 0,
  },
  successBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    padding: 16,
    zIndex: 1000,
    alignItems: "center",
  },
  successText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
  avatarText: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#fff",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  avatarBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  avatarEmail: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  avatarRole: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    maxWidth: width * 0.5,
    textAlign: "right",
  },
  statusBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 2,
  },
  inputError: {
    borderColor: "#ff3b30",
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  inputHint: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {},
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  buttonSubtext: {
    color: "#B3D7FF",
    fontSize: 12,
    marginTop: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
  currencySelector: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  currencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 70,
    alignItems: "center",
  },
  currencyButtonActive: {},
  currencyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  currencyButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
