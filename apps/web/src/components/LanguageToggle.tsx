import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const normaliseLanguage = (lng: string | undefined): SupportedLanguage => {
  const candidate = lng?.split("-")[0] ?? "ru";
  return SUPPORTED_LANGUAGES.includes(candidate as SupportedLanguage)
    ? (candidate as SupportedLanguage)
    : "ru";
};

interface LanguageToggleProps {
  className?: string;
  labelVariant?: "inline" | "stacked";
}

export default function LanguageToggle({
  className,
  labelVariant = "inline",
}: LanguageToggleProps) {
  const { i18n, t } = useTranslation();

  const currentLanguage = useMemo(
    () => normaliseLanguage(i18n.resolvedLanguage ?? i18n.language),
    [i18n.resolvedLanguage, i18n.language]
  );

  return (
    <label
      className={cn(
        "flex gap-2 text-sm text-muted-foreground",
        labelVariant === "stacked" ? "flex-col" : "items-center",
        className
      )}
    >
      <span className="font-medium">
        {t("settings.language", { defaultValue: "Language" })}
      </span>
      <select
        value={currentLanguage}
        onChange={(event) => {
          const next = event.target.value as SupportedLanguage;
          if (next !== currentLanguage) {
            void i18n.changeLanguage(next);
          }
        }}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {t(`languages.${language}`, {
              defaultValue: language.toUpperCase(),
            })}
          </option>
        ))}
      </select>
    </label>
  );
}
