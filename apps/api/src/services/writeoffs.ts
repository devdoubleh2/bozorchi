import {
  WriteOff,
  Prisma,
  WriteOffReason,
  PrismaClient,
} from "../generated/tenant/client";
import logger from "../../logs/log";

export type PrismaClientOrTransaction = PrismaClient | Prisma.TransactionClient;

// Zod-style validation helpers
const validateWriteOffInput = (data: any) => {
  if (!data.product_variation_id) {
    throw new Error("product_variation_id is required");
  }
  if (!data.quantity || data.quantity <= 0) {
    throw new Error("quantity must be greater than 0");
  }
  if (!data.reason || !Object.values(WriteOffReason).includes(data.reason)) {
    throw new Error(
      `reason must be one of: ${Object.values(WriteOffReason).join(", ")}`
    );
  }
  if (!data.store_id) {
    throw new Error("store_id is required");
  }
  if (!data.user_id) {
    throw new Error("user_id is required");
  }
};

interface CreateWriteOffInput {
  product_variation_id: string;
  quantity: number;
  reason: WriteOffReason;
  store_id: string;
  user_id: string;
  notes?: string;
  write_off_date?: Date;
}

interface WriteOffFilters {
  reason?: WriteOffReason;
  product_variation_id?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Create a new write-off record
 * Validates stock availability and creates transaction
 */
export async function createWriteOff(
  data: CreateWriteOffInput,
  prismaClient: PrismaClientOrTransaction
): Promise<WriteOff> {
  try {
    validateWriteOffInput(data);

    // Check if product variation exists
    const productVariation = await prismaClient.productVariation.findUnique({
      where: { id: data.product_variation_id },
    });

    if (!productVariation) {
      throw new Error("Product variation not found");
    }

    // Get current inventory
    const inventory = await prismaClient.inventory.findFirst({
      where: {
        product_variation_id: data.product_variation_id,
        store_id: data.store_id,
      },
    });

    if (!inventory) {
      throw new Error("No inventory found for this product in the store");
    }

    if (inventory.quantity_in_stock < data.quantity) {
      throw new Error(
        `Insufficient stock. Available: ${inventory.quantity_in_stock}, Requested: ${data.quantity}`
      );
    }

    // Create write-off record
    const writeOff = await prismaClient.writeOff.create({
      data: {
        product_variation_id: data.product_variation_id,
        store_id: data.store_id,
        user_id: data.user_id,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes || null,
        write_off_date: data.write_off_date || new Date(),
      },
    });

    // Update inventory - decrement stock
    await prismaClient.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity_in_stock: inventory.quantity_in_stock - data.quantity,
      },
    });

    logger.info("Write-off created successfully", "writeoffs", {
      writeOffId: writeOff.id,
      productVariationId: data.product_variation_id,
      quantity: data.quantity,
      storeId: data.store_id,
    });

    return writeOff;
  } catch (error) {
    logger.error("Failed to create write-off", "writeoffs", {
      error: error instanceof Error ? error.message : "Unknown error",
      data,
    });
    throw error;
  }
}

/**
 * Get all write-offs with filters and pagination
 */
export async function getWriteOffs(
  storeId: string,
  filters: WriteOffFilters = {},
  pagination: { page?: number; limit?: number } = {},
  prismaClient: PrismaClientOrTransaction
): Promise<{ writeOffs: WriteOff[]; total: number }> {
  try {
    const where: Prisma.WriteOffWhereInput = {
      store_id: storeId,
      ...(filters.reason && { reason: filters.reason }),
      ...(filters.product_variation_id && {
        product_variation_id: filters.product_variation_id,
      }),
      ...(filters.dateFrom || filters.dateTo
        ? {
          write_off_date: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        }
        : {}),
    };

    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const skip = (page - 1) * limit;

    const [writeOffs, total] = await Promise.all([
      prismaClient.writeOff.findMany({
        where,
        include: {
          product_variation: {
            include: {
              product: true,
              unit: true,
            },
          },
        },
        orderBy: { write_off_date: "desc" },
        skip,
        take: limit,
      }),
      prismaClient.writeOff.count({ where }),
    ]);

    return { writeOffs, total };
  } catch (error) {
    logger.error("Failed to get write-offs", "writeoffs", {
      error: error instanceof Error ? error.message : "Unknown error",
      storeId,
    });
    throw error;
  }
}

interface WriteOffSummary {
  totalWriteOffs: number;
  totalQuantity: number;
  totalValue: number;
  summaryByReason: Record<
    string,
    {
      count: number;
      totalQuantity: number;
      totalValue: number;
    }
  >;
}

/**
 * Get write-off summary and statistics
 */
export async function getWriteOffSummary(
  storeId: string,
  filters: { dateFrom?: Date; dateTo?: Date } = {},
  prismaClient: PrismaClientOrTransaction
): Promise<WriteOffSummary> {
  try {
    const where: Prisma.WriteOffWhereInput = {
      store_id: storeId,
      ...(filters.dateFrom || filters.dateTo
        ? {
          write_off_date: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        }
        : {}),
    };

    const writeOffs = await prismaClient.writeOff.findMany({
      where,
      include: {
        product_variation: {
          select: {
            price: true,
          },
        },
      },
    });

    const summary: WriteOffSummary = {
      totalWriteOffs: writeOffs.length,
      totalQuantity: 0,
      totalValue: 0,
      summaryByReason: {},
    };

    // Calculate totals
    for (const writeOff of writeOffs) {
      const value =
        writeOff.quantity *
        parseFloat(writeOff.product_variation.price.toString());
      summary.totalQuantity += writeOff.quantity;
      summary.totalValue += value;

      // Initialize reason summary if not exists
      if (!summary.summaryByReason[writeOff.reason]) {
        summary.summaryByReason[writeOff.reason] = {
          count: 0,
          totalQuantity: 0,
          totalValue: 0,
        };
      }

      // Add to reason summary
      const reasonSummary = summary.summaryByReason[writeOff.reason]!;
      reasonSummary.count += 1;
      reasonSummary.totalQuantity += writeOff.quantity;
      reasonSummary.totalValue += value;
    }

    return summary;
  } catch (error) {
    logger.error("Failed to get write-off summary", "writeoffs", {
      error: error instanceof Error ? error.message : "Unknown error",
      storeId,
    });
    throw error;
  }
}

/**
 * Get a specific write-off by ID
 */
export async function getWriteOffById(
  id: string,
  storeId: string,
  prismaClient: PrismaClientOrTransaction
): Promise<WriteOff | null> {
  try {
    const writeOff = await prismaClient.writeOff.findFirst({
      where: { id, store_id: storeId },
      include: {
        product_variation: {
          include: {
            product: true,
            unit: true,
          },
        },
      },
    });

    return writeOff || null;
  } catch (error) {
    logger.error("Failed to get write-off by ID", "writeoffs", {
      error: error instanceof Error ? error.message : "Unknown error",
      id,
    });
    throw error;
  }
}

/**
 * Delete a write-off (permanently removes record and restores inventory)
 */
export async function deleteWriteOff(
  id: string,
  storeId: string,
  prismaClient: PrismaClientOrTransaction
): Promise<boolean> {
  try {
    const writeOff = await prismaClient.writeOff.findFirst({
      where: { id, store_id: storeId },
    });

    if (!writeOff) {
      throw new Error("Write-off not found");
    }

    // Restore inventory
    const inventory = await prismaClient.inventory.findFirst({
      where: {
        product_variation_id: writeOff.product_variation_id,
        store_id: storeId,
      },
    });

    if (inventory) {
      await prismaClient.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity_in_stock: inventory.quantity_in_stock + writeOff.quantity,
        },
      });
    }

    // Delete the write-off record
    await prismaClient.writeOff.delete({
      where: { id },
    });

    logger.info("Write-off deleted successfully", "writeoffs", {
      writeOffId: id,
      storeId,
    });

    return true;
  } catch (error) {
    logger.error("Failed to delete write-off", "writeoffs", {
      error: error instanceof Error ? error.message : "Unknown error",
      id,
    });
    throw error;
  }
}
