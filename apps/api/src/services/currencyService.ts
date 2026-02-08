import { Prisma } from '../generated/tenant/client';

/**
 * Type alias for database client operations
 */
export type PrismaClientOrTransaction = Prisma.TransactionClient | {
    $transaction: Function;
    currency: any;
};

interface ConversionResult {
    convertedAmount: Prisma.Decimal;
    exchangeRate: Prisma.Decimal;
    fromCurrency: string;
    toCurrency: string;
    conversionDate: Date;
}

/**
 * Get currency by code for a specific store
 */
export async function getCurrency(
    storeId: string,
    currencyCode: string,
    prismaClient: PrismaClientOrTransaction
) {
    const currency = await prismaClient.currency.findFirst({
        where: {
            store_id: storeId,
            code: currencyCode,
            is_active: true,
        },
    });

    if (!currency) {
        throw new Error(`Currency ${currencyCode} not found for store ${storeId}`);
    }

    return currency;
}

/**
 * Get base currency for a store
 * Returns a default UZS currency if no base currency is configured
 */
export async function getBaseCurrency(
    storeId: string,
    prismaClient: PrismaClientOrTransaction
) {
    const baseCurrency = await prismaClient.currency.findFirst({
        where: {
            store_id: storeId,
            is_base: true,
            is_active: true,
        },
    });

    // If no base currency configured, return a default UZS currency
    // This allows operations to proceed for stores that haven't set up currencies
    if (!baseCurrency) {
        return {
            id: 'default-uzs',
            code: 'UZS',
            symbol: 'UZS',
            name: 'Uzbek Som',
            rate: new Prisma.Decimal(1),
            is_base: true,
            is_active: true,
            store_id: storeId,
            created_at: new Date(),
            updated_at: new Date(),
        };
    }

    return baseCurrency;
}

/**
 * Get exchange rate between two currencies
 * Returns rate to multiply FROM currency to get TO currency
 * 
 * @example
 * // If 1 USD = 13000 UZS
 * getExchangeRate('store', 'USD', 'UZS') // Returns 13000
 * getExchangeRate('store', 'UZS', 'USD') // Returns 0.0000769
 */
export async function getExchangeRate(
    storeId: string,
    fromCurrency: string,
    toCurrency: string,
    prismaClient: PrismaClientOrTransaction,
    customRate?: Prisma.Decimal
): Promise<Prisma.Decimal> {
    // If currencies are the same, rate is 1
    if (fromCurrency === toCurrency) {
        return new Prisma.Decimal(1);
    }

    // If custom rate provided, use it
    if (customRate) {
        return customRate;
    }

    // Get base currency
    const baseCurrency = await getBaseCurrency(storeId, prismaClient);

    // Get from and to currencies
    const fromCurr = await getCurrency(storeId, fromCurrency, prismaClient);
    const toCurr = await getCurrency(storeId, toCurrency, prismaClient);

    // Calculate cross rate
    // Currency.rate is defined as: 1 BASE_CURRENCY = X CURRENCY
    // Example: If base is UZS and we have USD with rate 13000:
    //   1 UZS = 13000 USD (incorrect interpretation)
    // Actually it should be: 1 USD = 13000 UZS
    // So the rate field represents: 1 unit of THIS currency = X units of BASE currency

    let rate: Prisma.Decimal;

    if (fromCurrency === baseCurrency.code) {
        // Converting FROM base currency TO another currency
        // Example: UZS to USD, rate = 1/13000
        rate = new Prisma.Decimal(1).div(toCurr.rate);
    } else if (toCurrency === baseCurrency.code) {
        // Converting FROM another currency TO base currency
        // Example: USD to UZS, rate = 13000
        rate = fromCurr.rate;
    } else {
        // Converting between two non-base currencies
        // Example: USD to EUR
        // Convert USD -> UZS: multiply by 13000
        // Convert UZS -> EUR: divide by EUR rate
        rate = fromCurr.rate.div(toCurr.rate);
    }

    return rate;
}

/**
 * Convert amount from one currency to another
 * 
 * @example
 * // Convert 10 USD to UZS
 * await convertCurrency(
 *   new Prisma.Decimal(10),
 *   'USD',
 *   'UZS',
 *   storeId,
 *   prismaClient
 * )
 * // Returns { convertedAmount: 130000, exchangeRate: 13000, ... }
 */
export async function convertCurrency(
    amount: Prisma.Decimal,
    fromCurrency: string,
    toCurrency: string,
    storeId: string,
    prismaClient: PrismaClientOrTransaction,
    customRate?: Prisma.Decimal
): Promise<ConversionResult> {
    const exchangeRate = await getExchangeRate(
        storeId,
        fromCurrency,
        toCurrency,
        prismaClient,
        customRate
    );

    const convertedAmount = amount.times(exchangeRate);

    return {
        convertedAmount,
        exchangeRate,
        fromCurrency,
        toCurrency,
        conversionDate: new Date(),
    };
}
