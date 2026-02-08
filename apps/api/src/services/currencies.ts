import { PrismaClient } from "../generated/tenant/client";

export const getCurrencies = async (
  prisma: PrismaClient,
  storeId: string
) => {
  return prisma.currency.findMany({
    where: { store_id: storeId },
    orderBy: { is_base: "desc" }, // Base currency first
  });
};

export const createCurrency = async (
  prisma: PrismaClient,
  storeId: string,
  data: {
    code: string;
    symbol: string;
    name: string;
    rate: number;
    is_base?: boolean;
    is_active?: boolean;
  }
) => {
  // If setting as base, unset other base currencies
  if (data.is_base) {
    await prisma.currency.updateMany({
      where: { store_id: storeId, is_base: true },
      data: { is_base: false },
    });
  }

  return prisma.currency.create({
    data: {
      ...data,
      store_id: storeId,
    },
  });
};

export const updateCurrency = async (
  prisma: PrismaClient,
  storeId: string,
  id: string,
  data: {
    code?: string;
    symbol?: string;
    name?: string;
    rate?: number;
    is_base?: boolean;
    is_active?: boolean;
  }
) => {
  // If setting as base, unset other base currencies
  if (data.is_base) {
    await prisma.currency.updateMany({
      where: { store_id: storeId, is_base: true, id: { not: id } },
      data: { is_base: false },
    });
  }

  return prisma.currency.update({
    where: { id, store_id: storeId },
    data,
  });
};

export const deleteCurrency = async (
  prisma: PrismaClient,
  storeId: string,
  id: string
) => {
  return prisma.currency.delete({
    where: { id, store_id: storeId },
  });
};
