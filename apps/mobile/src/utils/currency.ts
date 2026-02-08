import { useTranslation } from "react-i18next";

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

export const useCurrencyFormatter = () => {
  const { t } = useTranslation();

  const formatPriceWithTranslation = (
    price: number | undefined | null,
    currency: string = "UZS"
  ) => {
    // Handle undefined, null, or NaN values
    if (price === undefined || price === null || isNaN(price)) {
      price = 0;
    }

    const currencyKey = `currency.${currency}`;
    const symbol = t(currencyKey, { defaultValue: currency });
    return `${price.toLocaleString()} ${symbol}`;
  };

  return {
    formatPrice: formatPriceWithTranslation,
  };
};
