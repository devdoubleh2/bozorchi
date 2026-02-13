import { Response } from "express";
import logger from "../../logs/log";
import ExcelJS from "exceljs";
import { AuthRequest } from "@/middleware/auth";
import {
  enqueueImportJob,
  getImportJobStatus as getQueuedImportJobStatus,
  getImportQueueUnavailableReason,
  ImportQueueUnavailableError,
  isImportQueueAvailable,
} from "../lib/importQueue";
import {
  parseWorksheetProductRows,
  toImportRowInputsFromJson,
  validateImportRows,
} from "../services/importService";

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

      const workbook = new ExcelJS.Workbook();
      // @ts-ignore - Buffer type mismatch between multer and ExcelJS, but functionally compatible
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet("Products");

      if (!worksheet) {
        return res.status(400).json({
          error: "Invalid file format. Sheet 'Products' not found",
        });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      if (!req.store) {
        return res.status(400).json({
          error: "Store information is required for import validation",
        });
      }

      const validationResult = await validateImportRows({
        rows: parseWorksheetProductRows(worksheet),
        tenantPrisma: req.tenantPrisma,
        storeId: req.store.id,
      });

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

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      if (!req.store) {
        return res.status(400).json({
          error: "Store information is required for import validation",
        });
      }

      const validationResult = await validateImportRows({
        rows: toImportRowInputsFromJson(products),
        tenantPrisma: req.tenantPrisma,
        storeId: req.store.id,
      });

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

      if (!req.store) {
        return res.status(400).json({
          error: "Store information is required for bulk import",
        });
      }

      if (!req.organization?.id) {
        return res.status(400).json({
          error: "Organization context is missing",
        });
      }

      if (!req.tenantPrisma) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      if (!req.userId) {
        return res.status(400).json({
          error: "User context is missing",
        });
      }

      const validationResult = await validateImportRows({
        rows: toImportRowInputsFromJson(products),
        tenantPrisma: req.tenantPrisma,
        storeId: req.store.id,
      });

      if (!validationResult.valid) {
        return res.status(400).json({
          error: "Import payload failed validation",
          validation: validationResult,
        });
      }

      if (!isImportQueueAvailable()) {
        return res.status(503).json({
          error: "Bulk import queue unavailable",
          message:
            getImportQueueUnavailableReason() ||
            "REDIS_URL/BullMQ unavailable. Configure Redis and restart API.",
        });
      }

      const jobId = await enqueueImportJob({
        organizationId: req.organization.id,
        storeId: req.store.id,
        userId: req.userId,
        products: validationResult.data,
        requestedAt: new Date().toISOString(),
      });

      return res.status(202).json({
        jobId,
        status: "queued",
      });
    } catch (error) {
      if (error instanceof ImportQueueUnavailableError) {
        return res.status(503).json({
          error: "Bulk import queue unavailable",
          message:
            getImportQueueUnavailableReason() ||
            "REDIS_URL/BullMQ unavailable. Configure Redis and restart API.",
        });
      }

      logger.error("Execute import error:", "importController", error);
      return res.status(500).json({
        error: "Failed to enqueue import job",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getImportJobStatus(req: AuthRequest, res: Response) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }

      if (!req.organization?.id || !req.store?.id) {
        return res.status(400).json({
          error: "Organization and store context are required",
        });
      }

      if (!isImportQueueAvailable()) {
        return res.status(503).json({
          error: "Bulk import queue unavailable",
          message:
            getImportQueueUnavailableReason() ||
            "REDIS_URL/BullMQ unavailable. Configure Redis and restart API.",
        });
      }

      const status = await getQueuedImportJobStatus(jobId);
      if (!status) {
        return res.status(404).json({ error: "Import job not found" });
      }

      if (
        status.ownership.organizationId !== req.organization.id ||
        status.ownership.storeId !== req.store.id
      ) {
        return res.status(403).json({
          error: "Access denied to this import job",
        });
      }

      return res.json({
        jobId: status.jobId,
        status: status.status,
        progress: status.progress,
        result: status.result,
        failedReason: status.failedReason,
      });
    } catch (error) {
      if (error instanceof ImportQueueUnavailableError) {
        return res.status(503).json({
          error: "Bulk import queue unavailable",
          message:
            getImportQueueUnavailableReason() ||
            "REDIS_URL/BullMQ unavailable. Configure Redis and restart API.",
        });
      }

      logger.error("Get import job status error:", "importController", error);
      return res.status(500).json({
        error: "Failed to fetch import job status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
