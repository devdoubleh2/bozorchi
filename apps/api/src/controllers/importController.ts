import { Response } from "express";
import logger from "../../logs/log";
import {
  createTransaction,
  PrismaClientOrTransaction,
} from "../services/transactions";
import { Prisma, Product } from "../generated/tenant/client";
import ExcelJS from "exceljs";
import { AuthRequest } from "@/middleware/auth";
import { z } from "zod";

// Helper to extract text from ExcelJS cell values (handles RichText objects)
const getCellText = (cell: ExcelJS.Cell): string => {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  // Handle RichText objects: { richText: [{ text: "..." }, ...] }
  if (typeof value === "object" && "richText" in value && Array.isArray((value as any).richText)) {
    return (value as any).richText.map((rt: { text: string }) => rt.text || "").join("");
  }
  // Handle formula results
  if (typeof value === "object" && "result" in value) {
    const result = (value as any).result;
    return result !== null && result !== undefined ? String(result) : "";
  }
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }
  // Fallback: try to get text property or stringify
  if (typeof value === "object" && "text" in value) {
    return String((value as any).text || "");
  }
  return String(value);
};

// Helper to create Decimal from string/number/Decimal
const DecimalSchema = z
  .union([z.number(), z.string(), z.instanceof(Prisma.Decimal)])
  .transform((val) => new Prisma.Decimal(val));

const ProductRowSchema = z.object({
  productName: z.string().min(1, "Название товара обязательно"),
  variationName: z.string().min(1, "Название вариации обязательно"),
  barcode: z.string().min(1, "Штрихкод обязателен"),
  sku: z.string().optional(),
  unitName: z.string().min(1, "Единица измерения обязательна"),
  price: DecimalSchema.refine(
    (val) => val.greaterThan(0),
    "Цена должна быть больше 0"
  ),
  deliveryCost: DecimalSchema.refine(
    (val) => val.greaterThanOrEqualTo(0),
    "Стоимость доставки не может быть отрицательной"
  )
    .optional()
    .default(new Prisma.Decimal(0)),
  sellingPrice: DecimalSchema.refine(
    (val) => val.greaterThan(0),
    "Цена продажи должна быть больше 0"
  ),
  wholesalePrice: DecimalSchema.refine(
    (val) => val.greaterThanOrEqualTo(0),
    "Оптовая цена не может быть отрицательной"
  )
    .optional()
    .default(new Prisma.Decimal(0)),
  initialStock: z.number().min(0, "Начальный остаток не может быть отрицательным"),
  color: z.string().optional(),
  description: z.string().optional(),
  productCategoryName: z.string().optional(),
});

// Helper for deduplication matching (case-insensitive, trimmed)
const normalizeForMatch = (s: string | undefined | null): string =>
  (s || "").trim().toLowerCase();

type ProductRow = z.infer<typeof ProductRowSchema>;

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data: ProductRow[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export class ImportController {
  /**
   * Download unified import template
   * Single template for all imports - products are grouped by Product Name column
   */
  async downloadTemplate(_req: AuthRequest, res: Response) {
    try {
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Products");

      // Unified template columns
      worksheet.columns = [
        { header: "Название товара *", key: "productName", width: 30 },
        { header: "Название вариации *", key: "variationName", width: 30 },
        { header: "Штрихкод *", key: "barcode", width: 20 },
        { header: "Артикул", key: "sku", width: 15 },
        { header: "Категория товара", key: "productCategoryName", width: 25 },
        { header: "Единица измерения *", key: "unitName", width: 20 },
        { header: "Цена *", key: "price", width: 15 },
        { header: "Стоимость доставки", key: "deliveryCost", width: 18 },
        { header: "Цена продажи *", key: "sellingPrice", width: 15 },
        { header: "Оптовая цена", key: "wholesalePrice", width: 15 },
        { header: "Начальный остаток *", key: "initialStock", width: 18 },
        { header: "Цвет", key: "color", width: 15 },
        { header: "Описание", key: "description", width: 40 },
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4fc3f7" },
      };

      // Add example rows showing product grouping
      // Example 1: T-Shirt with 3 size variations
      worksheet.addRow({
        productName: "Футболка классическая",
        variationName: "Размер S",
        barcode: "1234567890001",
        sku: "TS-CL-S",
        productCategoryName: "Одежда",
        unitName: "шт",
        price: 50000,
        deliveryCost: 5000,
        sellingPrice: 75000,
        wholesalePrice: 65000,
        initialStock: 50,
        color: "#FFFFFF",
        description: "Классическая белая футболка",
      });
      worksheet.addRow({
        productName: "Футболка классическая",
        variationName: "Размер M",
        barcode: "1234567890002",
        sku: "TS-CL-M",
        productCategoryName: "Одежда",
        unitName: "шт",
        price: 50000,
        deliveryCost: 5000,
        sellingPrice: 75000,
        wholesalePrice: 65000,
        initialStock: 100,
        color: "#FFFFFF",
        description: "Классическая белая футболка",
      });
      worksheet.addRow({
        productName: "Футболка классическая",
        variationName: "Размер L",
        barcode: "1234567890003",
        sku: "TS-CL-L",
        productCategoryName: "Одежда",
        unitName: "шт",
        price: 50000,
        deliveryCost: 5000,
        sellingPrice: 75000,
        wholesalePrice: 65000,
        initialStock: 75,
        color: "#FFFFFF",
        description: "Классическая белая футболка",
      });

      // Example 2: Simple product with single variation
      worksheet.addRow({
        productName: "Молоко 1л",
        variationName: "Молоко 1л",
        barcode: "1234567890004",
        sku: "MILK-1L",
        productCategoryName: "Молочные продукты",
        unitName: "шт",
        price: 12000,
        deliveryCost: 1000,
        sellingPrice: 15000,
        wholesalePrice: 13000,
        initialStock: 200,
        color: "",
        description: "",
      });

      // Highlight example rows
      for (let i = 2; i <= 5; i++) {
        worksheet.getRow(i).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
        worksheet.getRow(i).font = { italic: true, color: { argb: "FF666666" } };
      }

      // Add comprehensive Instructions sheet
      const instructionsSheet = workbook.addWorksheet("Инструкции");
      instructionsSheet.columns = [
        { header: "Раздел", key: "section", width: 25 },
        { header: "Описание", key: "description", width: 80 },
      ];
      instructionsSheet.getRow(1).font = { bold: true };
      instructionsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4fc3f7" },
      };

      const instructions = [
        { section: "📋 ОБЩИЕ ПРАВИЛА", description: "" },
        { section: "Обязательные поля", description: "Поля отмеченные * обязательны для заполнения" },
        { section: "Лист Products", description: "Все товары должны быть на листе 'Products' (не переименовывайте)" },
        { section: "", description: "" },
        { section: "📦 ГРУППИРОВКА ТОВАРОВ", description: "" },
        { section: "Один товар", description: "Если 'Название товара' одинаковое в нескольких строках - это вариации одного товара" },
        { section: "Пример", description: "3 строки с 'Футболка классическая' = 1 товар с 3 вариациями (S, M, L)" },
        { section: "Простой товар", description: "Если товар без вариаций - используйте одинаковое название в обоих колонках" },
        { section: "", description: "" },
        { section: "⬇️ ЗАПОЛНЕНИЕ (Fill-Down)", description: "" },
        { section: "Совет", description: "Для одинаковых значений используйте Fill-Down в Excel (выделите ячейку → потяните за уголок вниз)" },
        { section: "Рекомендуемые поля", description: "Единица измерения, Категория, Цены - часто одинаковы для группы товаров" },
        { section: "Уникальные поля", description: "Штрихкод и Название вариации должны быть уникальны для каждой строки" },
        { section: "", description: "" },
        { section: "📝 ПОЛЯ ШАБЛОНА", description: "" },
        { section: "Название товара *", description: "Общее название товара (напр. 'Футболка классическая')" },
        { section: "Название вариации *", description: "Конкретная вариация (напр. 'Размер S', 'Синий 500мл')" },
        { section: "Штрихкод *", description: "Уникальный штрихкод (13 цифр EAN-13 или любой уникальный код)" },
        { section: "Артикул", description: "SKU артикул для внутреннего учёта (необязательно)" },
        { section: "Категория товара", description: "Категория будет создана автоматически если не существует" },
        { section: "Единица измерения *", description: "Единица измерения: шт, кг, л, м и т.д." },
        { section: "Цена *", description: "Закупочная цена товара (цена поставщика, без доставки)" },
        { section: "Стоимость доставки", description: "Стоимость доставки/транспорта единицы товара (необязательно, по умолчанию 0)" },
        { section: "Цена продажи *", description: "Розничная цена для покупателей" },
        { section: "Оптовая цена", description: "Цена для оптовых покупателей (по умолчанию 0)" },
        { section: "Начальный остаток *", description: "Количество на складе при импорте" },
        { section: "Цвет", description: "HEX цвет для карточки (#FF0000) или оставьте пустым" },
        { section: "Описание", description: "Дополнительная информация о товаре" },
        { section: "", description: "" },
        { section: "⚠️ ВАЖНО", description: "" },
        { section: "Примеры", description: "Удалите примеры (строки 2-5) перед импортом своих данных" },
        { section: "Дубликаты", description: "Штрихкоды должны быть уникальны - дубликаты будут отклонены" },
      ];
      instructions.forEach((inst) => instructionsSheet.addRow(inst));

      // Style section headers
      instructionsSheet.eachRow((row, rowNum) => {
        if (rowNum > 1) {
          const sectionCell = row.getCell(1);
          const sectionValue = String(sectionCell.value || "");
          if (sectionValue.startsWith("📋") || sectionValue.startsWith("📦") ||
            sectionValue.startsWith("⬇️") || sectionValue.startsWith("📝") ||
            sectionValue.startsWith("⚠️")) {
            row.font = { bold: true };
            row.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE3F2FD" },
            };
          }
        }
      });

      // Set response headers
      res.setHeader("Content-Disposition", "attachment; filename=product_import_template.xlsx");
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      await workbook.xlsx.write(res);
      return res.end();
    } catch (error) {
      logger.error("Download template error:", "importController", error);
      return res.status(500).json({
        error: "Failed to generate template",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Validate uploaded import file
   * Unified validation - no mode parameter needed
   */
  async validateFile(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = new ExcelJS.Workbook();
      // @ts-ignore - Buffer type mismatch between multer and ExcelJS, but functionally compatible
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet("Products");

      if (!worksheet) {
        return res.status(400).json({
          error: "Invalid file format. Sheet 'Products' not found",
        });
      }

      const errors: ValidationError[] = [];
      const data: ProductRow[] = [];

      // Skip header row and process data
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        // Unified column parsing
        const rawData = {
          productName: getCellText(row.getCell(1)),
          variationName: getCellText(row.getCell(2)),
          barcode: getCellText(row.getCell(3)),
          sku: getCellText(row.getCell(4)) || undefined,
          productCategoryName: getCellText(row.getCell(5)) || undefined,
          unitName: getCellText(row.getCell(6)),
          price: Number(row.getCell(7).value) || 0,
          deliveryCost: Number(row.getCell(8).value) || 0,
          sellingPrice: Number(row.getCell(9).value) || 0,
          wholesalePrice: Number(row.getCell(10).value) || 0,
          initialStock: Number(row.getCell(11).value) || 0,
          color: getCellText(row.getCell(12)) || undefined,
          description: getCellText(row.getCell(13)) || undefined,
        };

        const result = ProductRowSchema.safeParse(rawData);

        if (!result.success) {
          result.error.issues.forEach((err) => {
            errors.push({
              row: rowNumber,
              field: err.path[0] as string,
              message: err.message,
            });
          });
        } else {
          data.push(result.data);
        }
      });

      // Check for duplicate barcodes in the file
      const barcodes = data.map((d) => d.barcode);
      const duplicateBarcodes = barcodes.filter(
        (barcode, index) => barcodes.indexOf(barcode) !== index
      );

      duplicateBarcodes.forEach((barcode) => {
        const rowNumbers = data
          .map((d, idx) => (d.barcode === barcode ? idx + 2 : -1))
          .filter((idx) => idx !== -1);

        rowNumbers.forEach((rowNumber) => {
          errors.push({
            row: rowNumber,
            field: "barcode",
            message: `Дубликат штрихкода в файле: ${barcode}`,
          });
        });
      });

      if (!req.tenantPrisma) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      // Check if barcodes already exist in database
      const existingBarcodes = await req.tenantPrisma.productVariation.findMany({
        where: {
          barcode: {
            in: barcodes,
          },
          store_id: req.store!.id,
        },
        select: {
          barcode: true,
        },
      });

      const existingBarcodeSet = new Set(
        existingBarcodes
          .filter((pv): pv is { barcode: string } => pv.barcode !== null)
          .map((pv) => pv.barcode)
      );

      data.forEach((rowData, index) => {
        if (existingBarcodeSet.has(rowData.barcode)) {
          errors.push({
            row: index + 2,
            field: "barcode",
            message: `Штрихкод уже существует в базе: ${rowData.barcode}`,
          });
        }
      });

      const validationResult: ValidationResult = {
        valid: errors.length === 0,
        errors,
        data,
        summary: {
          totalRows: data.length,
          validRows:
            data.length -
            errors.filter((e) => e.field === "barcode" || !e.field).length,
          invalidRows: errors.length,
        },
      };

      return res.json(validationResult);
    } catch (error) {
      logger.error("Validate file error:", "importController", error);
      return res.status(500).json({
        error: "Failed to validate file",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Validate JSON data (from AG Grid edits)
   * This allows users to edit data in the grid and validate the edited version
   */
  async validateJson(req: AuthRequest, res: Response) {
    try {
      const { products } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "No products provided" });
      }

      const errors: ValidationError[] = [];
      const data: ProductRow[] = [];

      // Validate each product row
      products.forEach((rawData: any, index: number) => {
        const rowNumber = index + 2; // Account for header row (1-indexed Excel style)

        const result = ProductRowSchema.safeParse(rawData);

        if (!result.success) {
          result.error.issues.forEach((err) => {
            errors.push({
              row: rowNumber,
              field: err.path[0] as string,
              message: err.message,
            });
          });
        } else {
          data.push(result.data);
        }
      });

      // Check for duplicate barcodes in the payload
      const barcodes = data.map((d) => d.barcode);
      const duplicateBarcodes = barcodes.filter(
        (barcode, index) => barcodes.indexOf(barcode) !== index
      );

      duplicateBarcodes.forEach((barcode) => {
        const rowNumbers = data
          .map((d, idx) => (d.barcode === barcode ? idx + 2 : -1))
          .filter((idx) => idx !== -1);

        rowNumbers.forEach((rowNumber) => {
          errors.push({
            row: rowNumber,
            field: "barcode",
            message: `Дубликат штрихкода в файле: ${barcode}`,
          });
        });
      });

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Check if barcodes already exist in database
      const existingBarcodes = await req.tenantPrisma.productVariation.findMany({
        where: {
          barcode: {
            in: barcodes,
          },
          store_id: req.store!.id,
        },
        select: {
          barcode: true,
        },
      });

      const existingBarcodeSet = new Set(
        existingBarcodes
          .filter((pv): pv is { barcode: string } => pv.barcode !== null)
          .map((pv) => pv.barcode)
      );

      data.forEach((rowData, index) => {
        if (existingBarcodeSet.has(rowData.barcode)) {
          errors.push({
            row: index + 2,
            field: "barcode",
            message: `Штрихкод уже существует в базе: ${rowData.barcode}`,
          });
        }
      });

      const validationResult: ValidationResult = {
        valid: errors.length === 0,
        errors,
        data,
        summary: {
          totalRows: data.length,
          validRows:
            data.length -
            errors.filter((e) => e.field === "barcode" || !e.field).length,
          invalidRows: errors.length,
        },
      };

      return res.json(validationResult);
    } catch (error) {
      logger.error("Validate JSON error:", "importController", error);
      return res.status(500).json({
        error: "Failed to validate data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  /**
   * Unified import - auto - groups products by productName
   */
  async executeImport(req: AuthRequest, res: Response) {
    try {
      const { products } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          error: "Products array is required",
        });
      }

      // Validate products using Zod
      const validatedProducts: ProductRow[] = [];
      for (const p of products) {
        const result = ProductRowSchema.safeParse(p);
        if (!result.success) {
          return res.status(400).json({
            error: "Invalid product data in import payload",
            details: result.error.issues,
          });
        }
        validatedProducts.push(result.data);
      }

      if (!req.store) {
        return res.status(400).json({
          error: "Store information is required for bulk import",
        });
      }

      const storeId = req.store.id;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        return res.status(400).json({
          error: "Organization context is missing",
        });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const normalizeName = (name: string) => name.trim().toLowerCase();

      // Prepare caches up front so we do not create duplicate units/categories while importing
      const unitCache = new Map<string, any>();
      const categoryCache = new Map<string, any>();
      const productCache = new Map<string, Product>();

      // Collect unique names from the payload (first occurrence wins for creation)
      const unitNameMap = new Map<string, string>();
      const categoryNameMap = new Map<string, { name: string; color?: string }>();

      validatedProducts.forEach((p) => {
        const unitKey = normalizeName(p.unitName);
        if (!unitNameMap.has(unitKey)) {
          unitNameMap.set(unitKey, p.unitName.trim());
        }

        if (p.productCategoryName) {
          const categoryName = p.productCategoryName.trim();
          const catKey = normalizeName(categoryName);
          if (!categoryNameMap.has(catKey)) {
            const categoryValue: { name: string; color?: string } = {
              name: categoryName,
            };
            if (p.color) {
              categoryValue.color = p.color;
            }
            categoryNameMap.set(catKey, categoryValue);
          }
        }
      });

      // Preload existing units/categories for this store
      const unitNames = Array.from(unitNameMap.values());
      const categoryNames = Array.from(categoryNameMap.values()).map((c) => c.name);

      const [existingUnits, existingCategories] = await Promise.all([
        req.tenantPrisma.unit.findMany({
          where: {
            store_id: storeId,
            ...(unitNames.length ? { name: { in: unitNames } } : {}),
          },
          orderBy: { created_at: "asc" },
        }),
        req.tenantPrisma.productCategory.findMany({
          where: {
            store_id: storeId,
            ...(categoryNames.length ? { name: { in: categoryNames } } : {}),
          },
          orderBy: { created_at: "asc" },
        }),
      ]);

      existingUnits.forEach((unit: { name: string }) => {
        const key = normalizeName(unit.name);
        if (!unitCache.has(key)) {
          unitCache.set(key, unit);
        }
      });

      existingCategories.forEach((category: { name: string }) => {
        const key = normalizeName(category.name);
        if (!categoryCache.has(key)) {
          categoryCache.set(key, category);
        }
      });

      // Create missing units once per store to avoid duplicates
      for (const [normalized, originalName] of unitNameMap.entries()) {
        if (!unitCache.has(normalized)) {
          const createdUnit = await req.tenantPrisma.unit.create({
            data: {
              name: originalName,
              store_id: storeId,
              organization_id: organizationId,
            },
          });
          unitCache.set(normalizeName(createdUnit.name), createdUnit);
        }
      }

      // Create missing product categories once per store to avoid duplicates
      for (const [, categoryData] of categoryNameMap.entries()) {
        const normalized = normalizeName(categoryData.name);
        if (!categoryCache.has(normalized)) {
          const createdCategory = await req.tenantPrisma.productCategory.create({
            data: {
              name: categoryData.name,
              store_id: storeId,
              color: categoryData.color || "#4fc3f7",
            },
          });
          categoryCache.set(normalizeName(createdCategory.name), createdCategory);
        }
      }

      // Collect unique product names and their category mappings
      const productNameMap = new Map<string, { name: string; categoryName?: string }>();
      validatedProducts.forEach((p) => {
        const productKey = normalizeName(p.productName);
        if (!productNameMap.has(productKey)) {
          productNameMap.set(productKey, {
            name: p.productName.trim(),
            categoryName: p.productCategoryName,
          });
        }
      });

      // Preload existing products for this store
      const productNames = Array.from(productNameMap.values()).map((p) => p.name);
      const existingProducts = await req.tenantPrisma.product.findMany({
        where: {
          store_id: storeId,
          ...(productNames.length ? { name: { in: productNames } } : {}),
        },
      });

      existingProducts.forEach((product: Product) => {
        const key = normalizeName(product.name);
        if (!productCache.has(key)) {
          productCache.set(key, product);
        }
      });

      // Count variations per product to determine if product should be 'variable' type
      const variationCountMap = new Map<string, number>();
      validatedProducts.forEach((p) => {
        const productKey = normalizeName(p.productName);
        variationCountMap.set(productKey, (variationCountMap.get(productKey) || 0) + 1);
      });

      // Create missing products BEFORE processing variations (to avoid FK constraint violations)
      for (const [normalized, productData] of productNameMap.entries()) {
        if (!productCache.has(normalized)) {
          let productCategoryId: string | null = null;
          if (productData.categoryName) {
            const categoryKey = normalizeName(productData.categoryName);
            const category = categoryCache.get(categoryKey);
            productCategoryId = category?.id || null;
          }

          // Determine product type based on variation count
          const variationCount = variationCountMap.get(normalized) || 1;
          const productType = variationCount > 1 ? "variable" : "simple";

          const createdProduct = await req.tenantPrisma.product.create({
            data: {
              name: productData.name,
              product_category_id: productCategoryId,
              store_id: storeId,
              user_id: req.userId!,
              organization_id: organizationId,
              type: productType,
            },
          });
          productCache.set(normalizeName(createdProduct.name), createdProduct);
        } else {
          // If product exists and we're adding multiple variations, upgrade to 'variable'
          const existingProduct = productCache.get(normalized);
          const variationCount = variationCountMap.get(normalized) || 1;
          if (existingProduct && existingProduct.type === "simple" && variationCount > 1) {
            await req.tenantPrisma.product.update({
              where: { id: existingProduct.id },
              data: { type: "variable" },
            });
          }
        }
      }

      // Get user's store
      const results = {
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: [] as { product: string; error: string }[],
        skippedItems: [] as { product: string; reason: string }[],
      };

      // Process products in smaller chunks with controlled concurrency to avoid transaction timeouts
      const chunkSize = 10;
      for (let i = 0; i < validatedProducts.length; i += chunkSize) {
        const chunk = validatedProducts.slice(i, i + chunkSize);

        // Process chunk items sequentially to avoid overwhelming the connection pool
        for (const productData of chunk) {
          try {
            await req.tenantPrisma!.$transaction(
              async (tx: any) => {
                // Resolve unit and product category from cache (created beforehand)
                const unitKey = normalizeName(productData.unitName);
                const unit = unitCache.get(unitKey);

                if (!unit) {
                  throw new Error(
                    `Unit "${productData.unitName}" is missing for this store`
                  );
                }

                // Get product from cache by normalized productName
                const productKey = normalizeName(productData.productName);
                const product = productCache.get(productKey);

                if (!product) {
                  throw new Error(
                    `Товар "${productData.productName}" не найден`
                  );
                }

                // DEDUPLICATION CHECK: Check if variation with same name+color+unit already exists
                const existingVariation = await tx.productVariation.findFirst({
                  where: {
                    store_id: storeId,
                    product_id: product.id,
                    name: {
                      equals: normalizeForMatch(productData.variationName),
                      mode: "insensitive",
                    },
                    color: normalizeForMatch(productData.color) || "#4fc3f7",
                    unit_id: unit.id,
                  },
                });

                if (existingVariation) {
                  // Skip this duplicate
                  results.skipped++;
                  results.skippedItems.push({
                    product: productData.variationName,
                    reason: "Дубликат: товар с таким же названием, цветом и единицей уже существует",
                  });
                  return; // Skip to next product
                }

                // Create product variation
                const productVariation = await tx.productVariation.create({
                  data: {
                    name: productData.variationName,
                    description: productData.description || null,
                    barcode: productData.barcode,
                    sku: productData.sku || null,
                    price: productData.price,
                    delivery_cost: productData.deliveryCost || new Prisma.Decimal(0),
                    selling_price: productData.sellingPrice,
                    wholesale_price: productData.wholesalePrice || new Prisma.Decimal(0),
                    unit_id: unit.id,
                    product_id: product.id,
                    store_id: storeId,
                    color: productData.color || "#4fc3f7",
                  },
                });

                // Create initial stock transaction
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
                      userId: req.userId!,
                    },
                    tx as unknown as PrismaClientOrTransaction
                  );
                }
              },
              {
                maxWait: 10000, // Max time to wait for a transaction slot (10 seconds)
                timeout: 30000, // Max transaction execution time (30 seconds)
              }
            );

            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              product: productData.variationName,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            logger.error("Import product error:", "importController", error);
          }
        }
      }

      return res.json({
        successCount: results.successful,
        failCount: results.failed,
        skippedCount: results.skipped,
        errors: results.errors,
        skippedItems: results.skippedItems,
      });
    } catch (error) {
      logger.error("Execute import error:", "importController", error);
      return res.status(500).json({
        error: "Failed to execute import",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
