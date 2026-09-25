import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useAuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useShallow } from "zustand/shallow";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  User,
  Lock,
  Trash2,
  LogOut,
  Sun,
  Moon,
  Smartphone,
  Package,
  ClipboardCheck,
  ChevronRight,
  UserCheck,
} from "lucide-react-native";
import StoreSwitcher from "../src/components/StoreSwitcher";

export default function SettingsScreen() {
  const { signOut, storeData, isLoading } = useAuthContext(
    useShallow((state) => ({
      signOut: state.signOut,
      user: state.user,
      storeData: state.userStore,
      isLoading: state.isLoading,
    }))
  );
  const { isDark, colors, themePreference, setTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  if (isLoading || !storeData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleCustomersPress = useCallback(() => {
    navigation.navigate("Customers" as never);
  }, [navigation]);

  const handleStaffPress = useCallback(() => {
    navigation.navigate("Staff" as never);
  }, [navigation]);

  const staffSubtitle = useMemo(() => {
    if (storeData?.role === "owner") {
      return t("staff.manageTeam");
    }
    if (!storeData?.approved) {
      return t("staff.statusPending");
    }
    return t("staff.statusApproved");
  }, [storeData?.role, storeData?.approved, t]);

  const staffSubtitleColor =
    storeData?.role === "owner" || storeData?.approved
      ? colors.textSecondary
      : colors.warning;

  const handleDeleteAccount = useCallback(async () => {
    Alert.alert(
      t("settings.deleteAccount"),
      t("settings.deleteAccountConfirmation"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/api/users/me");
              await AsyncStorage.clear();
              signOut();
            } catch (error) {
              console.error("Error deleting account:", error);
              const err = error as { response?: { data?: { error?: string } } };
              Alert.alert(
                t("common.error"),
                err.response?.data?.error || t("errors.generic")
              );
            }
          },
        },
      ]
    );
  }, [t, signOut]);

  const handleSignOut = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut]);

  const handleEditProfile = useCallback(() => {
    navigation.navigate("EditProfile" as never);
  }, [navigation]);

  const handleChangePassword = useCallback(() => {
    navigation.navigate("ChangePassword" as never);
  }, [navigation]);

  const handleLanguageChange = useCallback(
    (languageCode: string) => {
      Alert.alert(t("settings.language"), "Выберите язык / Tilni tanlang", [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          onPress: () => changeLanguage(languageCode),
        },
      ]);
    },
    [t, changeLanguage]
  );

  const renderLanguageSelector = () => {
    return (
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {t("settings.language")}
        </Text>
        <View style={styles.languageButtons}>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                currentLanguage === lang.code && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  { color: colors.textPrimary },
                  currentLanguage === lang.code && {
                    color: colors.textInverse,
                  },
                ]}
              >
                {lang.nativeName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      testID="settings-screen"
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t("settings.storeInfo")}
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("settings.storeName")}
            </Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {storeData.store.name || t("common.notSpecified")}
            </Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("settings.currency")}
            </Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {storeData.store.currency || "USD"}
            </Text>
          </View>

        </View>
      </View>

      {/* Store Switcher */}
      <StoreSwitcher />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t("settings.title")}
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("settings.theme")}
            </Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                  themePreference === "system" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setTheme("system")}
                testID="settings-theme-system"
              >
                <Smartphone
                  size={16}
                  color={
                    themePreference === "system"
                      ? colors.textInverse
                      : colors.textPrimary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                  themePreference === "light" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setTheme("light")}
                testID="settings-theme-light"
              >
                <Sun
                  size={16}
                  color={
                    themePreference === "light"
                      ? colors.textInverse
                      : colors.textPrimary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                  themePreference === "dark" && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setTheme("dark")}
                testID="settings-theme-dark"
              >
                <Moon
                  size={16}
                  color={
                    themePreference === "dark"
                      ? colors.textInverse
                      : colors.textPrimary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {renderLanguageSelector()}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t("settings.inventoryTools")}
        </Text>
        <View
          style={[
            styles.toolsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.toolButton, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate("Suppliers" as never)}
          >
            <View style={styles.toolButtonContent}>
              <Package size={24} color={colors.textPrimary} />
              <Text
                style={[styles.toolButtonText, { color: colors.textPrimary }]}
              >
                {t("supplier.title")}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate("InventoryAudit" as never)}
          >
            <View style={styles.toolButtonContent}>
              <ClipboardCheck size={24} color={colors.textPrimary} />
              <Text
                style={[styles.toolButtonText, { color: colors.textPrimary }]}
              >
                {t("audit.title")}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate("WriteOff" as never)}
          >
            <View style={styles.toolButtonContent}>
              <Trash2 size={24} color={colors.textPrimary} />
              <Text
                style={[styles.toolButtonText, { color: colors.textPrimary }]}
              >
                {t("writeOff.title")}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t("settings.account")}
        </Text>
        <View
          style={[
            styles.accountCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.accountButton, { borderBottomColor: colors.border }]}
            onPress={handleCustomersPress}
          >
            <View style={styles.accountButtonContent}>
              <Users size={24} color={colors.textPrimary} />
              <Text
                style={[
                  styles.accountButtonText,
                  { color: colors.textPrimary },
                ]}
              >
                {t("customers.title")}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountButton, { borderBottomColor: colors.border }]}
            onPress={handleStaffPress}
          >
            <View style={styles.accountButtonContent}>
              <UserCheck size={24} color={colors.textPrimary} />
              <View style={styles.accountButtonTextGroup}>
                <Text
                  style={[
                    styles.accountButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t("settings.staff")}
                </Text>
                <Text
                  style={[
                    styles.accountButtonSubtitle,
                    { color: staffSubtitleColor },
                  ]}
                >
                  {staffSubtitle}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountButton, { borderBottomColor: colors.border }]}
            onPress={handleEditProfile}
          >
            <View style={styles.accountButtonContent}>
              <User size={24} color={colors.textPrimary} />
              <Text
                style={[
                  styles.accountButtonText,
                  { color: colors.textPrimary },
                ]}
              >
                {t("settings.editProfile")}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountButton, { borderBottomColor: colors.border }]}
            onPress={handleChangePassword}
          >
            <View style={styles.accountButtonContent}>
              <Lock size={24} color={colors.textPrimary} />
              <Text
                style={[
                  styles.accountButtonText,
                  { color: colors.textPrimary },
                ]}
              >
                {t("settings.changePassword")}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountButton, { borderBottomColor: colors.border }]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.accountButtonContent}>
              <Trash2 size={24} color={colors.error} />
              <Text style={[styles.accountButtonText, { color: colors.error }]}>
                {t("settings.deleteAccount")}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountButton]}
            onPress={handleSignOut}
            testID="settings-signout-button"
          >
            <View style={styles.accountButtonContent}>
              <LogOut size={24} color={colors.error} />
              <Text style={[styles.accountButtonText, { color: colors.error }]}>
                {t("settings.signOut")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    paddingLeft: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  toolsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  toolButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  toolButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toolButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  accountCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  accountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  accountButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  accountButtonTextGroup: {
    gap: 2,
  },
  accountButtonSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  languageButtons: {
    flexDirection: "row",
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  themeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  themeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomColor: "#222",
  },
  subscriptionInfo: {
    marginLeft: 16,
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: "#999",
  },
  subscriptionActive: {
    color: "#4CAF50",
  },
  subscriptionActiveButton: {
    backgroundColor: "#333",
  },
  subscriptionActiveButtonText: {
    color: "#fff",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#999",
  },
  buttonWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonContentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 20,
  },
  badge: {
    backgroundColor: "#ff3b30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
