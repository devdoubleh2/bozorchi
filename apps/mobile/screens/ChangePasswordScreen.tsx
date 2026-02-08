import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.currentPassword.trim()) {
      Alert.alert(t("common.error"), t("profile.currentPasswordRequired"));
      return;
    }

    if (!formData.newPassword.trim()) {
      Alert.alert(t("common.error"), t("profile.newPasswordRequired"));
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);
    try {
      await api.put("/api/auth/password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      Alert.alert(t("common.success"), t("profile.passwordChanged"));
      navigation.goBack();
    } catch (error) {
      console.error("Password change error:", error);
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage =
        err?.response?.data?.error || t("profile.passwordChangeFailed");
      Alert.alert(t("common.error"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, t, navigation]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      testID="change-password-screen"
    >
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("profile.currentPassword")}
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
              value={formData.currentPassword}
              onChangeText={(value) =>
                handleInputChange("currentPassword", value)
              }
              placeholder={t("profile.currentPassword")}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("profile.newPassword")}
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
              value={formData.newPassword}
              onChangeText={(value) => handleInputChange("newPassword", value)}
              placeholder={t("profile.newPassword")}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("profile.confirmPassword")}
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
              value={formData.confirmPassword}
              onChangeText={(value) =>
                handleInputChange("confirmPassword", value)
              }
              placeholder={t("profile.confirmPassword")}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t("common.save")}</Text>
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
        >
          <Text
            style={[styles.cancelButtonText, { color: colors.textSecondary }]}
          >
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {},
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
