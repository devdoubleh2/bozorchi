import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { BulkImportPreviewGrid } from "@/components/inventory/BulkImportPreviewGrid";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const Step = {
  Upload: 1,
  Preview: 2,
  Validate: 3,
  Commit: 4,
} as const;

type StepKey = (typeof Step)[keyof typeof Step];

type ProductRow = {
  productName: string;
  variationName: string;
  barcode: string;
  sku?: string;
  unitName: string;
  price: number;
  sellingPrice: number;
  wholesalePrice: number;
  initialStock: number;
  color?: string;
  description?: string;
  productCategoryName?: string;
  deliveryCost: number;
};

type ValidationError = {
  row: number;
  field: string;
  message: string;
};

type ValidationSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
};

type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  data: ProductRow[];
  summary: ValidationSummary;
};

type ExecuteResult = {
  inputCount: number;
  processedCount: number;
  successCount: number;
  failCount: number;
  errors: {
    row: number;
    product: string;
    error: string;
  }[];
  durationMs: number;
};

type ImportJobStatus = "queued" | "running" | "completed" | "failed";

type ImportProgress = {
  inputCount: number;
  processedCount: number;
  successCount: number;
  failCount: number;
};

type ExecuteEnqueueResponse = {
  jobId: string;
  status: "queued";
};

type ImportJobStatusResponse = {
  jobId: string;
  status: ImportJobStatus;
  progress: ImportProgress;
  result?: ExecuteResult;
  failedReason?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const isExcelFile = (file: File) =>
  /\.(xlsx|xls)$/i.test(file.name || file.type || "");

export default function ProductBulkCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<StepKey>(Step.Upload);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ProductRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);
  const [jobStatus, setJobStatus] = useState<ImportJobStatus | null>(null);
  const [jobProgress, setJobProgress] = useState<ImportProgress | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [validating, setValidating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const previewRows = useMemo(
    () => (validation?.data ?? []).slice(0, 10),
    [validation?.data]
  );

  const canExecute =
    Boolean(validation?.valid) && (validation?.summary.validRows ?? 0) > 0;

  const effectiveProgress = useMemo<ImportProgress | null>(() => {
    if (jobProgress) {
      return jobProgress;
    }

    if (executeResult) {
      return {
        inputCount: executeResult.inputCount,
        processedCount: executeResult.processedCount,
        successCount: executeResult.successCount,
        failCount: executeResult.failCount,
      };
    }

    return null;
  }, [jobProgress, executeResult]);

  const resetAll = useCallback(() => {
    setFile(null);
    setFileError(null);
    setParsedData([]);
    setValidation(null);
    setExecuteResult(null);
    setJobStatus(null);
    setJobProgress(null);
    setStep(Step.Upload);
    setGlobalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Client-side XLSX parsing for AG Grid preview
  const parseXlsxFile = useCallback(
    async (f: File) => {
      setParsing(true);
      setGlobalError(null);
      try {
        const arrayBuffer = await f.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames.find(
          (name) => name.toLowerCase() === "products"
        );
        if (!sheetName) {
          throw new Error(
            t("bulk.sheetNotFound", {
              defaultValue: "Sheet 'Products' not found in file",
            })
          );
        }
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: "",
        });

        // Unified header mapping (Russian and English support)
        const headerMap: Record<string, keyof ProductRow> = {
          // Russian headers
          "Название товара *": "productName",
          "Название вариации *": "variationName",
          "Штрихкод *": "barcode",
          "Артикул": "sku",
          "Категория товара": "productCategoryName",
          "Единица измерения *": "unitName",
          "Цена *": "price",
          "Стоимость доставки": "deliveryCost",
          "Цена продажи *": "sellingPrice",
          "Оптовая цена": "wholesalePrice",
          "Начальный остаток *": "initialStock",
          "Цвет": "color",
          "Описание": "description",
        };

        const rows: ProductRow[] = jsonData.map((row) => {
          const mapped: Partial<ProductRow> = {};
          Object.entries(row).forEach(([key, value]) => {
            const field = headerMap[key.trim()];
            if (field) {
              if (
                field === "price" ||
                field === "sellingPrice" ||
                field === "wholesalePrice" ||
                field === "initialStock" ||
                field === "deliveryCost"
              ) {
                mapped[field] = Number(value) || 0;
              } else {
                mapped[field] = String(value || "");
              }
            }
          });

          return {
            productName: mapped.productName || "",
            variationName: mapped.variationName || "",
            barcode: mapped.barcode || "",
            sku: mapped.sku,
            unitName: mapped.unitName || "",
            price: mapped.price || 0,
            sellingPrice: mapped.sellingPrice || 0,
            wholesalePrice: mapped.wholesalePrice || 0,
            deliveryCost: mapped.deliveryCost || 0,
            initialStock: mapped.initialStock || 0,
            color: mapped.color,
            description: mapped.description,
            productCategoryName: mapped.productCategoryName,
          };
        });

        setParsedData(rows);
        setStep(Step.Preview);
      } catch (error) {
        setGlobalError(
          error instanceof Error
            ? error.message
            : t("bulk.parseError", { defaultValue: "Failed to parse file" })
        );
      } finally {
        setParsing(false);
      }
    },
    [t]
  );

  // Handle data changes from AG Grid (Fill-Down edits)
  const handleDataChange = useCallback((updatedData: ProductRow[]) => {
    setParsedData(updatedData);
  }, []);

  // Download errors as CSV
  const downloadErrors = useCallback(() => {
    if (!executeResult?.errors.length) return;
    const csvContent = ["Row,Product,Error"]
      .concat(
        executeResult.errors.map(
          (e) =>
            `${e.row},"${e.product.replace(/"/g, '""')}","${e.error.replace(/"/g, '""')}"`
        )
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [executeResult?.errors]);

  const handleFileSelect = useCallback(
    (nextFile: File | null) => {
      setFileError(null);
      setGlobalError(null);
      setValidation(null);
      setExecuteResult(null);
      if (!nextFile) {
        setFile(null);
        return;
      }
      if (!isExcelFile(nextFile)) {
        setFileError(
          t("bulk.fileTypeError", {
            defaultValue: "Please upload an Excel file (.xlsx or .xls).",
          })
        );
        setFile(null);
        return;
      }
      if (nextFile.size > MAX_FILE_SIZE) {
        setFileError(
          t("bulk.fileSizeError", {
            defaultValue: "File exceeds the 10 MB limit.",
          })
        );
        setFile(null);
        return;
      }
      setFile(nextFile);
      setStep(Step.Upload);
    },
    [t]
  );

  const handleDownloadTemplate = useCallback(async () => {
    setGlobalError(null);
    setDownloadingTemplate(true);
    try {
      const blob = await api.download("/api/import/template");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "product_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : t("bulk.templateError", {
            defaultValue: "Failed to download template.",
          })
      );
    } finally {
      setDownloadingTemplate(false);
    }
  }, [t]);

  const handleValidate = useCallback(async () => {
    // Use parsedData (edited in AG Grid) instead of the original file
    if (!parsedData.length) return;
    setValidating(true);
    setGlobalError(null);
    setExecuteResult(null);
    setJobStatus(null);
    setJobProgress(null);
    try {
      // Send the edited JSON data instead of re-uploading the file
      const result = await api.post<ValidationResult>("/api/import/validate-json", {
        products: parsedData,
      });
      setValidation(result);
      setStep(Step.Validate);
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : t("bulk.validateError", {
            defaultValue: "Validation failed. Please try again.",
          })
      );
    } finally {
      setValidating(false);
    }
  }, [parsedData, t]);

  const handleExecute = useCallback(async () => {
    if (!validation?.data.length) return;
    setExecuting(true);
    setGlobalError(null);
    setExecuteResult(null);
    setJobStatus("queued");
    setJobProgress({
      inputCount: validation.data.length,
      processedCount: 0,
      successCount: 0,
      failCount: 0,
    });
    setStep(Step.Commit);

    try {
      const enqueueResponse = await api.post<ExecuteEnqueueResponse>("/api/import/execute", {
        products: validation.data,
      });

      const pollStartTime = Date.now();
      const pollTimeoutMs = 15 * 60 * 1000;

      while (true) {
        const statusResponse = await api.get<ImportJobStatusResponse>(
          `/api/import/jobs/${encodeURIComponent(enqueueResponse.jobId)}`
        );

        setJobStatus(statusResponse.status);
        setJobProgress(statusResponse.progress);

        if (statusResponse.status === "completed") {
          if (!statusResponse.result) {
            throw new Error(
              t("bulk.jobMissingResult", {
                defaultValue: "Import job completed without result payload.",
              })
            );
          }

          setExecuteResult(statusResponse.result);

          // Invalidate related caches so POS and other pages reflect new data
          queryClient.invalidateQueries({ queryKey: ["pos-inventory"] });
          queryClient.invalidateQueries({ queryKey: ["pos-categories"] });
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["product-categories"] });

          toast.success(
            t("bulk.importComplete", {
              defaultValue: "Import completed: {{success}} successful, {{failed}} failed",
              success: statusResponse.result.successCount,
              failed: statusResponse.result.failCount,
            })
          );
          break;
        }

        if (statusResponse.status === "failed") {
          throw new Error(
            statusResponse.failedReason ||
              t("bulk.jobFailed", {
                defaultValue: "Import job failed. Please try again.",
              })
          );
        }

        if (Date.now() - pollStartTime > pollTimeoutMs) {
          throw new Error(
            t("bulk.jobTimeout", {
              defaultValue:
                "Import is taking too long. Please check job status again.",
            })
          );
        }

        await new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), 1500);
        });
      }
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : t("bulk.commitError", {
            defaultValue: "Import failed. Please try again.",
          })
      );
    } finally {
      setExecuting(false);
    }
  }, [validation?.data, t, queryClient]);

  return (
    <div className="mx-auto w-full max-w-[1000px] p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {t("inventory.bulkAddTitle", {
              defaultValue: "Bulk product import",
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("inventory.bulkAddDescription", {
              defaultValue:
                "Import products and variations from Excel. Same product name = variations under one product.",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
          >
            {downloadingTemplate
              ? t("bulk.downloading", { defaultValue: "Downloading…" })
              : t("bulk.downloadTemplate", {
                defaultValue: "Download template",
              })}
          </Button>
        </div>
      </header>

      {/* Product grouping hint */}
      <div className="mb-6 rounded-md border bg-muted/50 p-4">
        <h3 className="text-sm font-medium mb-2">
          {t("bulk.howItWorks", { defaultValue: "How it works" })}
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              {t("bulk.groupingHint1", {
                defaultValue: "Rows with the same Product Name become variations of one product",
              })}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              {t("bulk.groupingHint2", {
                defaultValue: "For simple products, use the same name in both Product Name and Variation Name columns",
              })}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              {t("bulk.groupingHint3", {
                defaultValue: "Categories and units are created automatically if they don't exist",
              })}
            </span>
          </li>
        </ul>
      </div>

      <ol className="mb-6 grid grid-cols-4 gap-2 text-xs">
        {[
          {
            id: Step.Upload,
            label: t("bulk.step.upload", { defaultValue: "Upload" }),
          },
          {
            id: Step.Preview,
            label: t("bulk.step.preview", { defaultValue: "Preview" }),
          },
          {
            id: Step.Validate,
            label: t("bulk.step.validate", { defaultValue: "Validate" }),
          },
          {
            id: Step.Commit,
            label: t("bulk.step.commit", { defaultValue: "Import" }),
          },
        ].map((s) => (
          <li
            key={s.id}
            className={`rounded-md border p-2 ${step === s.id ? "border-primary bg-primary/5" : "border-border/60"
              }`}
          >
            <span className="block font-medium">{s.label}</span>
          </li>
        ))}
      </ol>

      {globalError && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      {step === Step.Upload && (
        <section className="space-y-4">
          <div className="rounded-md border p-4">
            <h2 className="text-sm font-semibold">
              {t("bulk.templateTitle", {
                defaultValue: "Step 1: Download and fill the template",
              })}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("bulk.templateDescription", {
                defaultValue:
                  "Download the Excel template, fill in your products, and upload it here.",
              })}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                {t("bulk.templateHintRequired", {
                  defaultValue:
                    "Required fields are marked with * in the template",
                })}
              </li>
              <li>
                {t("bulk.templateHintFillDown", {
                  defaultValue:
                    "Use Fill-Down in Excel for common values (Unit, Category, Prices)",
                })}
              </li>
              <li>
                {t("bulk.templateHintLimits", {
                  defaultValue:
                    "Maximum file size 10 MB. Only .xlsx or .xls files.",
                })}
              </li>
            </ul>
          </div>

          <div
            className="flex min-h-[180px] flex-col items-center justify-center rounded-md border border-dashed p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                handleFileSelect(dropped);
                if (fileInputRef.current) {
                  fileInputRef.current.files = e.dataTransfer.files;
                }
              }
            }}
          >
            <p className="text-sm text-muted-foreground">
              {t("bulk.dropHere", {
                defaultValue: "Drop your Excel file here or pick it manually.",
              })}
            </p>
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="max-w-xs cursor-pointer"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("bulk.chooseFile", { defaultValue: "Choose file" })}
              </Button>
            </div>
            {file && (
              <div className="mt-3 text-sm">
                <span className="font-medium">{file.name}</span>{" "}
                <span className="text-muted-foreground">
                  ({formatFileSize(file.size)})
                </span>
              </div>
            )}
            {fileError && (
              <p className="mt-3 text-sm text-destructive">{fileError}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => file && parseXlsxFile(file)} disabled={!file || parsing}>
              {parsing
                ? t("bulk.parsing", { defaultValue: "Parsing…" })
                : t("bulk.previewFile", {
                  defaultValue: "Preview file",
                })}
            </Button>
            <Button variant="ghost" onClick={resetAll}>
              {t("bulk.reset", { defaultValue: "Reset" })}
            </Button>
          </div>
        </section>
      )}

      {step === Step.Preview && parsedData.length > 0 && (
        <section className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {t("bulk.previewTitle", {
                  defaultValue: "Step 2: Review and edit data",
                })}
              </h2>
              <span className="text-sm text-muted-foreground">
                {t("bulk.previewRowCount", {
                  defaultValue: "{{count}} rows found",
                  count: parsedData.length,
                })}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("bulk.previewDescription", {
                defaultValue:
                  "Review your data below. You can edit cells and use Fill-Down for common values.",
              })}
            </p>
          </div>

          <BulkImportPreviewGrid data={parsedData} onDataChange={handleDataChange} />

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(Step.Upload)}>
              {t("bulk.chooseAnother", {
                defaultValue: "Choose another file",
              })}
            </Button>
            <Button onClick={handleValidate} disabled={validating}>
              {validating
                ? t("bulk.validating", { defaultValue: "Validating…" })
                : t("bulk.runValidation", {
                  defaultValue: "Validate data",
                })}
            </Button>
          </div>
        </section>
      )}

      {step >= Step.Validate && validation && (
        <section className="space-y-5">
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {t("bulk.validationSummary", {
                  defaultValue: "Step 3: Validation results",
                })}
              </h2>
              <span
                className={`text-sm font-medium ${validation.valid ? "text-emerald-600" : "text-destructive"
                  }`}
              >
                {validation.valid
                  ? t("bulk.validationPassed", {
                    defaultValue: "Ready to import",
                  })
                  : t("bulk.validationFailed", {
                    defaultValue: "Needs attention",
                  })}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("bulk.total", { defaultValue: "Total rows" })}
                </p>
                <p className="text-2xl font-semibold">
                  {validation.summary.totalRows}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("bulk.valid", { defaultValue: "Valid rows" })}
                </p>
                <p className="text-2xl font-semibold text-emerald-600">
                  {validation.summary.validRows}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("bulk.invalid", { defaultValue: "Rows with issues" })}
                </p>
                <p className="text-2xl font-semibold text-destructive">
                  {validation.summary.invalidRows}
                </p>
              </div>
            </div>
            {!validation.valid && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("bulk.fixErrorsHint", {
                  defaultValue:
                    "Fix the issues listed below, update the spreadsheet, and upload again.",
                })}
              </p>
            )}
          </div>

          <div className="rounded-md border">
            <div className="border-b px-4 py-3 text-sm font-semibold">
              {t("bulk.errors", { defaultValue: "Validation errors" })}
            </div>
            {validation.errors.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                {t("bulk.noErrors", {
                  defaultValue: "All rows look good.",
                })}
              </div>
            ) : (
              <ScrollArea className="h-[260px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("bulk.row", { defaultValue: "Row" })}
                      </TableHead>
                      <TableHead>
                        {t("bulk.field", { defaultValue: "Field" })}
                      </TableHead>
                      <TableHead>
                        {t("bulk.message", { defaultValue: "Message" })}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.errors.map((error, idx) => (
                      <TableRow key={`${error.row}-${error.field}-${idx}`}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.field}</TableCell>
                        <TableCell className="text-destructive">
                          {error.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>

          <div className="rounded-md border">
            <div className="border-b px-4 py-3 text-sm font-semibold">
              {t("bulk.previewRows", { defaultValue: "Preview (first 10 rows)" })}
            </div>
            {previewRows.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                {t("bulk.noData", { defaultValue: "No data to preview." })}
              </div>
            ) : (
              <ScrollArea className="h-[300px] w-full">
                <div className="w-max min-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          {t("products.productName", { defaultValue: "Product" })}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t("products.variationName", {
                            defaultValue: "Variation",
                          })}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t("products.barcode", { defaultValue: "Barcode" })}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t("products.productCategory", {
                            defaultValue: "Category",
                          })}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t("products.unit", { defaultValue: "Unit" })}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t("products.sellingPrice", {
                            defaultValue: "Selling price",
                          })}
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          {t("bulk.initialStock", {
                            defaultValue: "Stock",
                          })}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, idx) => (
                        <TableRow key={`${row.barcode}-${idx}`}>
                          <TableCell className="whitespace-nowrap">{row.productName}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.variationName}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.barcode}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {row.productCategoryName ||
                              t("bulk.notProvided", {
                                defaultValue: "—",
                              })}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{row.unitName}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatPrice(row.sellingPrice)}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.initialStock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(Step.Upload)}>
              {t("bulk.chooseAnother", {
                defaultValue: "Choose another file",
              })}
            </Button>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleValidate}
                disabled={!file || validating}
              >
                {validating
                  ? t("bulk.validating", { defaultValue: "Validating…" })
                  : t("bulk.revalidate", {
                    defaultValue: "Re-validate",
                  })}
              </Button>
              <Button
                onClick={handleExecute}
                disabled={!canExecute || executing}
              >
                {executing
                  ? t("bulk.importing", { defaultValue: "Importing…" })
                  : t("bulk.startImport", { defaultValue: "Start import" })}
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === Step.Commit && (
        <section className="mt-6 space-y-4">
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {t("bulk.commitSummary", {
                  defaultValue: "Import results",
                })}
              </h2>
              <span className="text-sm text-muted-foreground">
                {t(`bulk.queueStatus.${jobStatus || "queued"}`, {
                  defaultValue: jobStatus || "queued",
                })}
              </span>
            </div>

            {effectiveProgress && (
              <div className="mt-4 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
                {t("bulk.progressLabel", {
                  defaultValue: "Processed {{processed}} / {{input}} rows",
                  processed: effectiveProgress.processedCount,
                  input: effectiveProgress.inputCount,
                })}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("bulk.inputCount", { defaultValue: "Input rows" })}
                </p>
                <p className="text-2xl font-semibold">
                  {effectiveProgress?.inputCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("bulk.processedCount", { defaultValue: "Processed rows" })}
                </p>
                <p className="text-2xl font-semibold">
                  {effectiveProgress?.processedCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("bulk.rows", { defaultValue: "Successful" })}
                </p>
                <p className="text-2xl font-semibold text-emerald-600">
                  {effectiveProgress?.successCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("bulk.failed", { defaultValue: "Failed" })}
                </p>
                <p className="text-2xl font-semibold text-destructive">
                  {effectiveProgress?.failCount ?? 0}
                </p>
              </div>
            </div>

            {executing && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("bulk.queuePolling", {
                  defaultValue: "Import is running in background. Progress updates every few seconds.",
                })}
              </p>
            )}

            {!executing && executeResult && (executeResult.errors.length > 0 ? (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {t("bulk.commitErrors", {
                      defaultValue: "Rows that could not be imported",
                    })}
                  </p>
                  <Button variant="outline" size="sm" onClick={downloadErrors}>
                    {t("bulk.downloadErrors", { defaultValue: "Download errors" })}
                  </Button>
                </div>
                <ScrollArea className="mt-2 h-[220px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t("bulk.row", { defaultValue: "Row" })}
                        </TableHead>
                        <TableHead>
                          {t("products.variationName", {
                            defaultValue: "Variation",
                          })}
                        </TableHead>
                        <TableHead>
                          {t("bulk.message", { defaultValue: "Message" })}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executeResult.errors.map((error, idx) => (
                        <TableRow key={`${error.product}-${idx}`}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>{error.product}</TableCell>
                          <TableCell className="text-destructive">
                            {error.error}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("bulk.allImported", {
                  defaultValue: "All rows were imported successfully.",
                })}
              </p>
            ))}

            {jobStatus === "failed" && !executeResult && (
              <p className="mt-4 text-sm text-destructive">
                {t("bulk.jobFailed", {
                  defaultValue: "Import job failed. Please try again.",
                })}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/inventory")}
                disabled={!executeResult}
              >
                {t("bulk.viewInventory", { defaultValue: "Go to inventory" })}
              </Button>
              <Button variant="outline" onClick={resetAll}>
                {t("bulk.importAnother", {
                  defaultValue: "Import another file",
                })}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
