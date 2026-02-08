import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type ParsedApiError = Error & { details?: string[] };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (
  price: number | undefined | null,
  currency: string = "UZS"
) => {
  // Handle undefined, null, or NaN values
  if (price === undefined || price === null || isNaN(price)) {
    price = 0;
  }

  const currencySymbols: { [key: string]: string } = {
    UZS: "so'm",
    USD: "$",
    EUR: "€",
    RUB: "₽",
  };

  const symbol = currencySymbols[currency] || currency;
  return `${price.toLocaleString()} ${symbol}`;
};

export const formatCurrency = formatPrice;

export function formatRelativeTime(value: string | number | Date) {
  const date = new Date(value);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });

  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(seconds) < 60) {
    return rtf.format(seconds, "second");
  }
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }
  if (Math.abs(hours) < 24) {
    return rtf.format(hours, "hour");
  }
  return rtf.format(days, "day");
}

export const parseApiError = (error: unknown): ParsedApiError => {
  const fallbackError =
    error instanceof Error ? error : new Error("Unexpected error");

  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        message?: string;
        details?: unknown;
      };
      if (typeof parsed === "object" && parsed) {
        const baseMessage =
          parsed.error || parsed.message || fallbackError.message;
        const details: string[] = Array.isArray(parsed.details)
          ? parsed.details.map((detail) => String(detail))
          : parsed.details
            ? [String(parsed.details)]
            : [];
        const parsedError = new Error(String(baseMessage)) as ParsedApiError;
        if (details.length) {
          parsedError.details = details;
        }
        return parsedError;
      }
    } catch {
      /* ignore json parsing failure */
    }
    return fallbackError as ParsedApiError;
  }

  return fallbackError as ParsedApiError;
};




