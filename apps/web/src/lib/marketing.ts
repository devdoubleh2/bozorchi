import type { SupportedLanguage } from "@/lib/i18n";

export const LOCALE_SEGMENTS: SupportedLanguage[] = ["en", "ru", "uz"];

export const localizedPath = (
  path: string,
  language: SupportedLanguage | "en"
): string => {
  if (language === "en") return path;
  if (path === "/") return `/${language}`;
  return `/${language}${path}`;
};

export const detectLocaleFromPath = (
  pathname: string
): SupportedLanguage | "en" => {
  const firstSegment = pathname.replace(/^\/+/, "").split("/")[0];
  if (firstSegment === "ru" || firstSegment === "uz") return firstSegment;
  return "en";
};
