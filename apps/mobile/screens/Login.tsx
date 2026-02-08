import React, { useState } from "react";
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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuthContext } from "../context/AuthContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useShallow } from "zustand/react/shallow";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { log } from "@/debugging/log";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export const Login = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    message?: string;
  }>({});
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const { signIn } = useAuthContext(
    useShallow((state) => ({
      signIn: state.signIn,
    }))
  );

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email) {
      newErrors.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("auth.invalidEmail");
    }

    if (!password) {
      newErrors.password = t("auth.passwordRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        log.error("LoginScreen", error.message, error);
        setErrors({ message: JSON.parse(error.message).error });
        Alert.alert(t("common.error"), JSON.parse(error.message).error);
        return;
      }


    } catch (error) {
      Alert.alert(t("common.error"), t("auth.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#fff" },
      ]}
      testID="login-screen"
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: isDark ? "#fff" : "#333" }]}>
                {t("auth.welcome")}
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9",
                      borderColor: errors.email
                        ? colors.error
                        : isDark
                          ? "#333"
                          : "#ddd",
                      color: isDark ? "#fff" : "#333",
                    },
                  ]}
                  placeholder={t("auth.email")}
                  placeholderTextColor={isDark ? "#666" : "#999"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  testID="login-email-input"
                />
                {errors.email && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.email}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9",
                      borderColor: errors.password
                        ? colors.error
                        : isDark
                          ? "#333"
                          : "#ddd",
                      color: isDark ? "#fff" : "#333",
                    },
                  ]}
                  placeholder={t("auth.password")}
                  placeholderTextColor={isDark ? "#666" : "#999"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="password"
                  autoComplete="password"
                  testID="login-password-input"
                />
                {errors.password && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.password}
                  </Text>
                )}
              </View>

              {errors.message && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.message}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="login-submit-button"
              >
                {loading ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text
                    style={[styles.buttonText, { color: colors.textInverse }]}
                  >
                    {t("auth.login")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate("Register")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="login-register-link"
                accessibilityLabel="login-register-link"
                accessibilityRole="button"
                accessible
              >
                <Text
                  style={[
                    styles.registerLinkText,
                    { color: colors.textSecondary },
                  ]}
                  testID="login-register-link-text"
                >
                  {t("auth.dontHaveAccount")}{" "}
                  <Text
                    style={[
                      styles.registerLinkTextBold,
                      { color: colors.primary },
                    ]}
                  >
                    {t("auth.register")}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // paddingBottom is set dynamically with safe area insets
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    minHeight: 600, // Ensure enough space for keyboard
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    // Shadow for better visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  registerLink: {
    marginTop: 24,
    alignItems: "center",
    padding: 8,
  },
  registerLinkText: {
    fontSize: 15,
  },
  registerLinkTextBold: {
    fontWeight: "600",
  },
});
