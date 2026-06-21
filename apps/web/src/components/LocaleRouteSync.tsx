import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "@/lib/i18n";
import { detectLocaleFromPath } from "@/lib/marketing";

export default function LocaleRouteSync() {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const routeLanguage = detectLocaleFromPath(location.pathname);
    const targetLanguage: SupportedLanguage =
      routeLanguage === "en" ? "en" : routeLanguage;

    if (i18n.resolvedLanguage !== targetLanguage && i18n.language !== targetLanguage) {
      void i18n.changeLanguage(targetLanguage);
    }
  }, [i18n, location.pathname]);

  return null;
}
