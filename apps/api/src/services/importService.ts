import ExcelJS from "exceljs";
import { z } from "zod";
import { Prisma, PrismaClient, Product } from "../generated/tenant/client";
import {
  createTransaction,
  PrismaClientOrTransaction,
} from "./transactions";
import logger from "../../logs/log";

export const DEFAULT_VARIATION_COLOR = "#4fc3f7";
const IMPORT_CHUNK_SIZE = 10;

const normalizeRequiredText = (value: unknown): string =>
  String(value ?? "").trim();

const normalizeOptionalText = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
};

const requiredText = (message: string) =>
  z.preprocess(
    (value) => normalizeRequiredText(value),
    z.string().min(1, message)
  );

const optionalText = z.preprocess(
  (value) => normalizeOptionalText(value),
  z.string().optional()
);

const DecimalSchema = z
  .preprocess((value) => {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : 0;
    }

    return value;
  }, z.union([z.number(), z.string(), z.instanceof(Prisma.Decimal)]))
  .transform((value) => new Prisma.Decimal(value));

const NumberSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}, z.number());

export const ProductRowSchema = z.object({
  productName: requiredText("Название товара обязательно"),
  variationName: requiredText("Название вариации обязательно"),
  barcode: requiredText("Штрихкод обязателен"),
  sku: optionalText,
  unitName: requiredText("Единица измерения обязательна"),
  price: DecimalSchema.refine(
    (value) => value.greaterThan(0),
    "Цена должна быть больше 0"
  ),
  deliveryCost: DecimalSchema.refine(
    (value) => value.greaterThanOrEqualTo(0),
    "Стоимость доставки не может быть отрицательной"
  )
    .optional()
    .default(new Prisma.Decimal(0)),
  sellingPrice: DecimalSchema.refine(
    (value) => value.greaterThan(0),
    "Цена продажи должна быть больше 0"
  ),
  wholesalePrice: DecimalSchema.refine(
    (value) => value.greaterThanOrEqualTo(0),
    "Оптовая цена не может быть отрицательной"
  )
    .optional()
    .default(new Prisma.Decimal(0)),
  initialStock: NumberSchema.refine(
    (value) => value >= 0,
    "Начальный остаток не может быть отрицательным"
  ),
  color: optionalText,
  description: optionalText,
  productCategoryName: optionalText,
});

export type ProductRow = z.infer<typeof ProductRowSchema>;

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data: ProductRow[];
  summary: ValidationSummary;
}

export interface ImportRowInput {
  rowNumber: number;
  rawData: unknown;
}

type DedupeComparableRow = Pick<
  ProductRow,
  "productName" | "variationName" | "unitName" | "color"
>;

export interface ImportExecutionError {
  row: number;
  product: string;
  error: string;
}

export interface ImportProgressSnapshot {
  inputCount: number;
  processedCount: number;
  successCount: number;
  failCount: number;
}

export interface ImportExecutionResult {
  inputCount: number;
  processedCount: number;
  successCount: number;
  failCount: number;
  errors: ImportExecutionError[];
  durationMs: number;
}

export interface ValidateImportRowsOptions {
  rows: ImportRowInput[];
  tenantPrisma: PrismaClient;
  storeId: string;
}

export interface ExecuteImportRowsOptions {
  tenantPrisma: PrismaClient;
  organizationId: string;
  storeId: string;
  userId: string;
  products: ProductRow[];
  onProgress?: (
    progress: ImportProgressSnapshot
  ) => void | Promise<void>;
}

// Extract text from ExcelJS values including rich text, formulas, and dates.
export const getCellText = (cell: ExcelJS.Cell): string => {
  const value = cell.value;

  if (value === null || value === undefined) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (
    typeof value === "object" &&
    "richText" in value &&
    Array.isArray((value as { richText?: { text: string }[] }).richText)
  ) {
    return (value as { richText: { text: string }[] }).richText
      .map((part) => part.text || "")
      .join("");
  }

  if (typeof value === "object" && "result" in value) {
    const result = (value as { result?: unknown }).result;
    return result === null || result === undefined ? "" : String(result);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object" && "text" in value) {
    return String((value as { text?: unknown }).text ?? "");
  }

  return String(value);
};

const getCellNumber = (cell: ExcelJS.Cell): number => {
  const value = cell.value;

  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "object" && "result" in value) {
    const result = (value as { result?: unknown }).result;
    const parsedResult = Number(result);
    return Number.isFinite(parsedResult) ? parsedResult : 0;
  }

  const parsed = Number(getCellText(cell));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeForMatch = (value: string | undefined | null): string =>
  (value || "").trim().toLowerCase();

export const normalizeColor = (value: string | undefined | null): string => {
  const normalized = normalizeForMatch(value);
  return normalized || DEFAULT_VARIATION_COLOR;
};

export const buildImportDedupeKey = (
  storeId: string,
  row: DedupeComparableRow
): string => {
  const productName = normalizeForMatch(row.productName);
  const variationName = normalizeForMatch(row.variationName);
  const unitName = normalizeForMatch(row.unitName);
  const color = normalizeColor(row.color);

  return `${storeId}|${productName}|${variationName}|${unitName}|${color}`;
};

export const buildDedupeWhereClause = (
  storeId: string,
  row: DedupeComparableRow
): Prisma.ProductVariationWhereInput => {
  const normalizedColor = normalizeColor(row.color);
  const colorWhere: Prisma.ProductVariationWhereInput[] = [
    {
      color: {
        equals: normalizedColor,
        mode: "insensitive",
      },
    },
  ];

  if (normalizedColor === DEFAULT_VARIATION_COLOR) {
    colorWhere.push({ color: null });
  }

  return {
    store_id: storeId,
    product: {
      name: {
        equals: row.productName.trim(),
        mode: "insensitive",
      },
    },
    name: {
      equals: row.variationName.trim(),
      mode: "insensitive",
    },
    unit: {
      name: {
        equals: row.unitName.trim(),
        mode: "insensitive",
      },
    },
    OR: colorWhere,
  };
};

export const parseWorksheetProductRows = (
  worksheet: ExcelJS.Worksheet
): ImportRowInput[] => {
  const rows: ImportRowInput[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    rows.push({
      rowNumber,
      rawData: {
        productName: getCellText(row.getCell(1)),
        variationName: getCellText(row.getCell(2)),
        barcode: getCellText(row.getCell(3)),
        sku: getCellText(row.getCell(4)) || undefined,
        productCategoryName: getCellText(row.getCell(5)) || undefined,
        unitName: getCellText(row.getCell(6)),
        price: getCellNumber(row.getCell(7)),
        deliveryCost: getCellNumber(row.getCell(8)),
        sellingPrice: getCellNumber(row.getCell(9)),
        wholesalePrice: getCellNumber(row.getCell(10)),
        initialStock: getCellNumber(row.getCell(11)),
        color: getCellText(row.getCell(12)) || undefined,
        description: getCellText(row.getCell(13)) || undefined,
      },
    });
  });

  return rows;
};

export const toImportRowInputsFromJson = (products: unknown[]): ImportRowInput[] =>
  products.map((rawData, index) => ({
    rowNumber: index + 2,
    rawData,
  }));

export async function validateImportRows(
  options: ValidateImportRowsOptions
): Promise<ValidationResult> {
  const { rows, tenantPrisma, storeId } = options;
  const errors: ValidationError[] = [];
  const parsedRows: Array<{ rowNumber: number; data: ProductRow }> = [];

  for (const row of rows) {
    const result = ProductRowSchema.safeParse(row.rawData);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push({
          row: row.rowNumber,
          field: String(issue.path[0] ?? "row"),
          message: issue.message,
        });
      });
      continue;
    }

    parsedRows.push({
      rowNumber: row.rowNumber,
      data: result.data,
    });
  }

  const barcodeRows = new Map<string, number[]>();
  parsedRows.forEach((row) => {
    const barcode = row.data.barcode;
    const existing = barcodeRows.get(barcode) || [];
    existing.push(row.rowNumber);
    barcodeRows.set(barcode, existing);
  });

  barcodeRows.forEach((rowNumbers, barcode) => {
    if (rowNumbers.length <= 1) {
      return;
    }

    rowNumbers.forEach((rowNumber) => {
      errors.push({
        row: rowNumber,
        field: "barcode",
        message: `Дубликат штрихкода в файле: ${barcode}`,
      });
    });
  });

  const barcodes = Array.from(barcodeRows.keys());
  if (barcodes.length > 0) {
    const existingBarcodes = await tenantPrisma.productVariation.findMany({
      where: {
        store_id: storeId,
        barcode: {
          in: barcodes,
        },
      },
      select: {
        barcode: true,
      },
    });

    const existingBarcodeSet = new Set(
      existingBarcodes
        .filter((item): item is { barcode: string } => item.barcode !== null)
        .map((item) => item.barcode)
    );

    parsedRows.forEach((row) => {
      if (!existingBarcodeSet.has(row.data.barcode)) {
        return;
      }

      errors.push({
        row: row.rowNumber,
        field: "barcode",
        message: `Штрихкод уже существует в базе: ${row.data.barcode}`,
      });
    });
  }

  const dedupeRows = new Map<string, number[]>();
  parsedRows.forEach((row) => {
    const dedupeKey = buildImportDedupeKey(storeId, row.data);
    const existing = dedupeRows.get(dedupeKey) || [];
    existing.push(row.rowNumber);
    dedupeRows.set(dedupeKey, existing);
  });

  dedupeRows.forEach((rowNumbers) => {
    if (rowNumbers.length <= 1) {
      return;
    }

    rowNumbers.forEach((rowNumber) => {
      errors.push({
        row: rowNumber,
        field: "dedupeKey",
        message:
          "Дубликат в файле: комбинация товар/вариация/единица/цвет должна быть уникальной",
      });
    });
  });

  const uniqueRowsForDbLookup: ProductRow[] = [];
  const seenKeys = new Set<string>();
  parsedRows.forEach((row) => {
    const dedupeKey = buildImportDedupeKey(storeId, row.data);
    if (seenKeys.has(dedupeKey)) {
      return;
    }

    seenKeys.add(dedupeKey);
    uniqueRowsForDbLookup.push(row.data);
  });

  if (uniqueRowsForDbLookup.length > 0) {
    const existingDedupeMatches = await tenantPrisma.productVariation.findMany({
      where: {
        OR: uniqueRowsForDbLookup.map((row) => buildDedupeWhereClause(storeId, row)),
      },
      select: {
        store_id: true,
        name: true,
        color: true,
        product: {
          select: {
            name: true,
          },
        },
        unit: {
          select: {
            name: true,
          },
        },
      },
    });

    const existingDedupeSet = new Set(
      existingDedupeMatches.map((item) =>
        buildImportDedupeKey(item.store_id || storeId, {
          productName: item.product.name,
          variationName: item.name,
          unitName: item.unit.name,
          color: item.color ?? undefined,
        })
      )
    );

    parsedRows.forEach((row) => {
      const dedupeKey = buildImportDedupeKey(storeId, row.data);
      if (!existingDedupeSet.has(dedupeKey)) {
        return;
      }

      errors.push({
        row: row.rowNumber,
        field: "dedupeKey",
        message:
          "Комбинация товар/вариация/единица/цвет уже существует в базе",
      });
    });
  }

  const rowsWithErrors = new Set(errors.map((error) => error.row));

  return {
    valid: errors.length === 0,
    errors,
    data: parsedRows.map((row) => row.data),
    summary: {
      totalRows: rows.length,
      validRows: rows.length - rowsWithErrors.size,
      invalidRows: rowsWithErrors.size,
    },
  };
}

const emitProgressSafely = async (
  callback: ExecuteImportRowsOptions["onProgress"],
  snapshot: ImportProgressSnapshot
): Promise<void> => {
  if (!callback) {
    return;
  }

  try {
    await callback(snapshot);
  } catch (error) {
    logger.error("Import progress callback failed", "importService", error);
  }
};

const normalizeName = (name: string): string => normalizeForMatch(name);

const buildInsensitiveNameOr = (names: string[]) =>
  names.map((name) => ({
    name: {
      equals: name,
      mode: "insensitive" as const,
    },
  }));

export async function executeImportRows(
  options: ExecuteImportRowsOptions
): Promise<ImportExecutionResult> {
  const {
    tenantPrisma,
    storeId,
    organizationId,
    userId,
    products,
    onProgress,
  } = options;

  const startedAt = Date.now();
  const inputCount = products.length;
  let successCount = 0;
  let failCount = 0;
  const errors: ImportExecutionError[] = [];

  const unitCache = new Map<string, { id: string; name: string }>();
  const categoryCache = new Map<string, { id: string; name: string }>();
  const productCache = new Map<string, Product>();

  const unitNameMap = new Map<string, string>();
  const categoryNameMap = new Map<string, { name: string; color?: string }>();

  products.forEach((row) => {
    const unitKey = normalizeName(row.unitName);
    if (!unitNameMap.has(unitKey)) {
      unitNameMap.set(unitKey, row.unitName.trim());
    }

    if (row.productCategoryName) {
      const categoryName = row.productCategoryName.trim();
      const categoryKey = normalizeName(categoryName);
      if (!categoryNameMap.has(categoryKey)) {
        categoryNameMap.set(categoryKey, {
          name: categoryName,
          color: row.color,
        });
      }
    }
  });

  const unitNames = Array.from(unitNameMap.values());
  const categoryNames = Array.from(categoryNameMap.values()).map(
    (category) => category.name
  );

  const [existingUnits, existingCategories] = await Promise.all([
    tenantPrisma.unit.findMany({
      where: {
        store_id: storeId,
        ...(unitNames.length > 0 ? { OR: buildInsensitiveNameOr(unitNames) } : {}),
      },
      orderBy: { created_at: "asc" },
    }),
    tenantPrisma.productCategory.findMany({
      where: {
        store_id: storeId,
        ...(categoryNames.length > 0
          ? { OR: buildInsensitiveNameOr(categoryNames) }
          : {}),
      },
      orderBy: { created_at: "asc" },
    }),
  ]);

  existingUnits.forEach((unit) => {
    const key = normalizeName(unit.name);
    if (!unitCache.has(key)) {
      unitCache.set(key, { id: unit.id, name: unit.name });
    }
  });

  existingCategories.forEach((category) => {
    const key = normalizeName(category.name);
    if (!categoryCache.has(key)) {
      categoryCache.set(key, { id: category.id, name: category.name });
    }
  });

  for (const [normalized, originalName] of unitNameMap.entries()) {
    if (unitCache.has(normalized)) {
      continue;
    }

    const createdUnit = await tenantPrisma.unit.create({
      data: {
        name: originalName,
        store_id: storeId,
        organization_id: organizationId,
      },
    });

    unitCache.set(normalizeName(createdUnit.name), {
      id: createdUnit.id,
      name: createdUnit.name,
    });
  }

  for (const [normalized, categoryData] of categoryNameMap.entries()) {
    if (categoryCache.has(normalized)) {
      continue;
    }

    const createdCategory = await tenantPrisma.productCategory.create({
      data: {
        name: categoryData.name,
        store_id: storeId,
        color: categoryData.color || DEFAULT_VARIATION_COLOR,
      },
    });

    categoryCache.set(normalizeName(createdCategory.name), {
      id: createdCategory.id,
      name: createdCategory.name,
    });
  }

  const productNameMap = new Map<string, { name: string; categoryName?: string }>();
  const variationCountMap = new Map<string, number>();

  products.forEach((row) => {
    const productKey = normalizeName(row.productName);

    if (!productNameMap.has(productKey)) {
      productNameMap.set(productKey, {
        name: row.productName.trim(),
        categoryName: row.productCategoryName,
      });
    }

    variationCountMap.set(productKey, (variationCountMap.get(productKey) || 0) + 1);
  });

  const productNames = Array.from(productNameMap.values()).map((item) => item.name);
  const existingProducts = await tenantPrisma.product.findMany({
    where: {
      store_id: storeId,
      ...(productNames.length > 0
        ? {
            OR: buildInsensitiveNameOr(productNames),
          }
        : {}),
    },
  });

  existingProducts.forEach((product) => {
    const key = normalizeName(product.name);
    if (!productCache.has(key)) {
      productCache.set(key, product);
    }
  });

  for (const [normalized, productData] of productNameMap.entries()) {
    const cachedProduct = productCache.get(normalized);
    const variationCount = variationCountMap.get(normalized) || 1;

    if (!cachedProduct) {
      const categoryId = productData.categoryName
        ? categoryCache.get(normalizeName(productData.categoryName))?.id || null
        : null;

      const createdProduct = await tenantPrisma.product.create({
        data: {
          name: productData.name,
          product_category_id: categoryId,
          store_id: storeId,
          user_id: userId,
          organization_id: organizationId,
          type: variationCount > 1 ? "variable" : "simple",
        },
      });

      productCache.set(normalizeName(createdProduct.name), createdProduct);
      continue;
    }

    if (cachedProduct.type === "simple" && variationCount > 1) {
      await tenantPrisma.product.update({
        where: { id: cachedProduct.id },
        data: { type: "variable" },
      });

      productCache.set(normalized, {
        ...cachedProduct,
        type: "variable",
      });
    }
  }

  await emitProgressSafely(onProgress, {
    inputCount,
    processedCount: 0,
    successCount,
    failCount,
  });

  for (let start = 0; start < products.length; start += IMPORT_CHUNK_SIZE) {
    const chunk = products.slice(start, start + IMPORT_CHUNK_SIZE);

    for (let index = 0; index < chunk.length; index += 1) {
      const productData = chunk[index]!;
      const absoluteIndex = start + index;
      const rowNumber = absoluteIndex + 2;

      try {
        await tenantPrisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const unit = unitCache.get(normalizeName(productData.unitName));
            if (!unit) {
              throw new Error(
                `Unit \"${productData.unitName}\" is missing for this store`
              );
            }

            const product = productCache.get(normalizeName(productData.productName));
            if (!product) {
              throw new Error(`Товар \"${productData.productName}\" не найден`);
            }

            const duplicateVariation = await tx.productVariation.findFirst({
              where: buildDedupeWhereClause(storeId, productData),
              select: { id: true },
            });

            if (duplicateVariation) {
              throw new Error(
                "Комбинация товар/вариация/единица/цвет уже существует в базе"
              );
            }

            const productVariation = await tx.productVariation.create({
              data: {
                name: productData.variationName,
                description: productData.description || null,
                barcode: productData.barcode,
                sku: productData.sku || null,
                price: productData.price,
                delivery_cost:
                  productData.deliveryCost || new Prisma.Decimal(0),
                selling_price: productData.sellingPrice,
                wholesale_price:
                  productData.wholesalePrice || new Prisma.Decimal(0),
                unit_id: unit.id,
                product_id: product.id,
                store_id: storeId,
                color: normalizeColor(productData.color),
              },
            });

            if (productData.initialStock > 0) {
              await createTransaction(
                {
                  product_variation_id: productVariation.id,
                  store_id: storeId,
                  transaction_type: "import",
                  quantity: productData.initialStock,
                  unit_price: productData.price,
                  total_amount: productData.price.times(productData.initialStock),
                  remarks: "Bulk import - initial stock",
                  userId,
                },
                tx as unknown as PrismaClientOrTransaction
              );
            }
          },
          {
            maxWait: 10000,
            timeout: 30000,
          }
        );

        successCount += 1;
      } catch (error) {
        failCount += 1;
        errors.push({
          row: rowNumber,
          product: productData.variationName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        logger.error("Import product error", "importService", error);
      }
    }

    await emitProgressSafely(onProgress, {
      inputCount,
      processedCount: successCount + failCount,
      successCount,
      failCount,
    });
  }

  return {
    inputCount,
    processedCount: successCount + failCount,
    successCount,
    failCount,
    errors,
    durationMs: Date.now() - startedAt,
  };
}
