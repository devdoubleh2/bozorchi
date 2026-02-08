import {
  PrismaClient,
  Prisma,
  TransactionType,
} from "../generated/tenant/client";

export type PrismaClientOrTransaction = PrismaClient | Prisma.TransactionClient;

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface SellerPerformance {
  sellerId: string;
  sellerName: string;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  totalItemsSold: number;
  transactionCount: number;
}

export interface SellerReportResponse {
  sellers: SellerPerformance[];
  summary: {
    totalSellers: number;
    totalRevenue: number;
    totalProfit: number;
    totalTransactions: number;
    avgRevenuePerSeller: number;
  };
}

export interface ProductPerformance {
  productVariationId: string;
  productName: string;
  variationName: string;
  barcode: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  avgSellingPrice: number;
  transactionCount: number;
}

export interface ProductReportResponse {
  products: ProductPerformance[];
  summary: {
    totalProducts: number;
    totalRevenue: number;
    totalProfit: number;
    totalItemsSold: number;
    avgProfitMargin: number;
  };
}

/**
 * Get seller performance report aggregated by user_id (sold_by)
 */
export async function getSellerPerformance(
  storeId: string,
  dateRange: DateRange,
  prisma: PrismaClientOrTransaction,
  userNameMap?: Map<string, string>
): Promise<SellerReportResponse> {
  const { startDate, endDate } = dateRange;

  // Build date filter
  const dateFilter: Prisma.TransactionWhereInput = {};
  if (startDate || endDate) {
    dateFilter.transaction_date = {};
    if (startDate) {
      dateFilter.transaction_date.gte = startDate;
    }
    if (endDate) {
      dateFilter.transaction_date.lte = endDate;
    }
  }

  // Get all sale transactions grouped by user_id
  const transactions = await prisma.transaction.findMany({
    where: {
      store_id: storeId,
      transaction_type: {
        in: [
          TransactionType.export,
          TransactionType.exchange,
          TransactionType.debt,
        ],
      },
      user_id: { not: null },
      ...dateFilter,
    },
    select: {
      id: true,
      user_id: true,
      total_amount: true,
      delivery_cost: true,
      selling_price: true,
      quantity: true,
      group_id: true,
    },
  });

  // Aggregate by seller
  const sellerMap = new Map<
    string,
    {
      totalRevenue: Prisma.Decimal;
      totalCost: Prisma.Decimal;
      totalItemsSold: number;
      groupIds: Set<string>;
    }
  >();

  for (const tx of transactions) {
    const sellerId = tx.user_id!;
    const existing = sellerMap.get(sellerId) || {
      totalRevenue: new Prisma.Decimal(0),
      totalCost: new Prisma.Decimal(0),
      totalItemsSold: 0,
      groupIds: new Set<string>(),
    };

    existing.totalRevenue = existing.totalRevenue.add(tx.total_amount);
    existing.totalCost = existing.totalCost.add(
      tx.delivery_cost.mul(tx.quantity)
    );
    existing.totalItemsSold += tx.quantity;
    if (tx.group_id) {
      existing.groupIds.add(tx.group_id);
    }

    sellerMap.set(sellerId, existing);
  }

  // Build seller performance array
  const sellers: SellerPerformance[] = [];
  let totalRevenue = new Prisma.Decimal(0);
  let totalProfit = new Prisma.Decimal(0);
  let totalTransactions = 0;

  for (const [sellerId, data] of sellerMap) {
    const profit = data.totalRevenue.sub(data.totalCost);
    const transactionCount = data.groupIds.size || 1;
    const avgOrderValue =
      transactionCount > 0
        ? data.totalRevenue.div(transactionCount).toNumber()
        : 0;

    sellers.push({
      sellerId,
      sellerName: userNameMap?.get(sellerId) || `User ${sellerId.slice(-6)}`,
      totalSales: transactionCount,
      totalRevenue: data.totalRevenue.toNumber(),
      totalProfit: profit.toNumber(),
      avgOrderValue,
      totalItemsSold: data.totalItemsSold,
      transactionCount,
    });

    totalRevenue = totalRevenue.add(data.totalRevenue);
    totalProfit = totalProfit.add(profit);
    totalTransactions += transactionCount;
  }

  // Sort by revenue descending
  sellers.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    sellers,
    summary: {
      totalSellers: sellers.length,
      totalRevenue: totalRevenue.toNumber(),
      totalProfit: totalProfit.toNumber(),
      totalTransactions,
      avgRevenuePerSeller:
        sellers.length > 0 ? totalRevenue.div(sellers.length).toNumber() : 0,
    },
  };
}

/**
 * Get product performance report aggregated by product_variation_id
 */
export async function getProductPerformance(
  storeId: string,
  dateRange: DateRange,
  prisma: PrismaClientOrTransaction,
  sortBy: "revenue" | "quantity" | "profit" = "revenue",
  limit?: number
): Promise<ProductReportResponse> {
  const { startDate, endDate } = dateRange;

  // Build date filter
  const dateFilter: Prisma.TransactionWhereInput = {};
  if (startDate || endDate) {
    dateFilter.transaction_date = {};
    if (startDate) {
      dateFilter.transaction_date.gte = startDate;
    }
    if (endDate) {
      dateFilter.transaction_date.lte = endDate;
    }
  }

  // Get all sale transactions with product details
  const transactions = await prisma.transaction.findMany({
    where: {
      store_id: storeId,
      transaction_type: {
        in: [
          TransactionType.export,
          TransactionType.exchange,
          TransactionType.debt,
        ],
      },
      product_variation_id: { not: null },
      ...dateFilter,
    },
    include: {
      product_variation: {
        select: {
          id: true,
          name: true,
          barcode: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Aggregate by product variation
  const productMap = new Map<
    string,
    {
      variationName: string;
      productName: string;
      barcode: string;
      totalRevenue: Prisma.Decimal;
      totalCost: Prisma.Decimal;
      totalQuantity: number;
      transactionCount: number;
      sellingPrices: number[];
    }
  >();

  for (const tx of transactions) {
    const pvId = tx.product_variation_id!;
    const existing = productMap.get(pvId) || {
      variationName: tx.product_variation?.name || "Unknown",
      productName: tx.product_variation?.product?.name || "Unknown",
      barcode: tx.product_variation?.barcode || "",
      totalRevenue: new Prisma.Decimal(0),
      totalCost: new Prisma.Decimal(0),
      totalQuantity: 0,
      transactionCount: 0,
      sellingPrices: [],
    };

    existing.totalRevenue = existing.totalRevenue.add(tx.total_amount);
    // Use unit_price as fallback since delivery_cost doesn't exist on Transaction
    const costPrice = tx.unit_price || new Prisma.Decimal(0);
    existing.totalCost = existing.totalCost.add(
      costPrice.mul(tx.quantity)
    );
    existing.totalQuantity += tx.quantity;
    existing.transactionCount += 1;
    existing.sellingPrices.push(tx.selling_price.toNumber());

    productMap.set(pvId, existing);
  }

  // Build product performance array
  const products: ProductPerformance[] = [];
  let totalRevenue = new Prisma.Decimal(0);
  let totalProfit = new Prisma.Decimal(0);
  let totalItemsSold = 0;
  let totalMarginSum = 0;

  for (const [pvId, data] of productMap) {
    const profit = data.totalRevenue.sub(data.totalCost);
    const profitMargin =
      data.totalRevenue.toNumber() > 0
        ? (profit.toNumber() / data.totalRevenue.toNumber()) * 100
        : 0;
    const avgSellingPrice =
      data.sellingPrices.length > 0
        ? data.sellingPrices.reduce((a, b) => a + b, 0) /
        data.sellingPrices.length
        : 0;

    products.push({
      productVariationId: pvId,
      productName: data.productName,
      variationName: data.variationName,
      barcode: data.barcode,
      totalQuantitySold: data.totalQuantity,
      totalRevenue: data.totalRevenue.toNumber(),
      totalProfit: profit.toNumber(),
      profitMargin,
      avgSellingPrice,
      transactionCount: data.transactionCount,
    });

    totalRevenue = totalRevenue.add(data.totalRevenue);
    totalProfit = totalProfit.add(profit);
    totalItemsSold += data.totalQuantity;
    totalMarginSum += profitMargin;
  }

  // Sort by specified field
  switch (sortBy) {
    case "quantity":
      products.sort((a, b) => b.totalQuantitySold - a.totalQuantitySold);
      break;
    case "profit":
      products.sort((a, b) => b.totalProfit - a.totalProfit);
      break;
    case "revenue":
    default:
      products.sort((a, b) => b.totalRevenue - a.totalRevenue);
      break;
  }

  // Apply limit if specified
  const limitedProducts = limit ? products.slice(0, limit) : products;

  return {
    products: limitedProducts,
    summary: {
      totalProducts: products.length,
      totalRevenue: totalRevenue.toNumber(),
      totalProfit: totalProfit.toNumber(),
      totalItemsSold,
      avgProfitMargin:
        products.length > 0 ? totalMarginSum / products.length : 0,
    },
  };
}
