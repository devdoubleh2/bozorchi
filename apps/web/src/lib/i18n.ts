import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ru from "@/locales/ru/translation.json";
import uz from "@/locales/uz/translation.json";
import en from "@/locales/en/translation.json";

export const SUPPORTED_LANGUAGES = ["en", "ru", "uz"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "sp-web-language";

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === "undefined") {
    return "ru";
  }

  const stored = window.localStorage.getItem(
    LANGUAGE_STORAGE_KEY
  ) as SupportedLanguage | null;
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }

  const navigatorLanguage = window.navigator.language?.split("-")[0];
  if (
    navigatorLanguage &&
    SUPPORTED_LANGUAGES.includes(navigatorLanguage as SupportedLanguage)
  ) {
    return navigatorLanguage as SupportedLanguage;
  }

  return "ru";
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    uz: { translation: uz },
  },
  lng: getInitialLanguage(),
  fallbackLng: "ru",
  interpolation: {
    escapeValue: false,
  },
  returnObjects: true,
  defaultNS: "translation",
  react: {
    useSuspense: false,
  },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window === "undefined") {
    return;
  }

  if (SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage)) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  }
});

export default i18n;
