export const formatCurrency = (
  value: number,
  currency = "UZS",
  locale: string = typeof navigator !== "undefined"
    ? navigator.language
    : "ru-RU"
) => {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (
  value: number,
  locale: string = typeof navigator !== "undefined"
    ? navigator.language
    : "ru-RU"
) => {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (
  date: string,
  locale: string = typeof navigator !== "undefined"
    ? navigator.language
    : "ru-RU"
) => {
  return new Date(date).toLocaleDateString(locale);
};

export const formatDateTime = (
  date: string,
  locale: string = typeof navigator !== "undefined"
    ? navigator.language
    : "ru-RU"
) => {
  return new Date(date).toLocaleString(locale);
};
