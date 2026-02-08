import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import translation files
import ruTranslation from "../locales/ru/translation.json";
import uzTranslation from "../locales/uz/translation.json";

const LANGUAGE_DETECTOR = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem("user-language");
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // Fallback to device locale
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || "ru";
      const supportedLanguages = ["ru", "uz"];

      if (supportedLanguages.includes(deviceLanguage)) {
        callback(deviceLanguage);
      } else {
        // Default to Russian if device language is not supported
        callback("ru");
      }
    } catch (error) {
      console.error("Error detecting language:", error);
      callback("ru"); // Default fallback
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem("user-language", lng);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    fallbackLng: "ru",
    debug: __DEV__,

    resources: {
      ru: {
        translation: ruTranslation,
      },
      uz: {
        translation: uzTranslation,
      },
    },

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    returnObjects: true, // Allow accessing translation objects

    react: {
      useSuspense: false,
    },
  });

export default i18n;
