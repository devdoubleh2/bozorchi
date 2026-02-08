import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
    type ColDef,
    type CellClassParams,
    type FillOperationParams,
    ModuleRegistry,
    AllCommunityModule,
    themeQuartz,
    colorSchemeDark,
    colorSchemeLight,
    type GridApi,
    type GridReadyEvent,
} from "ag-grid-community";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";

// ============================================================================
// MODULE REGISTRATION (executed once at module load)
// ============================================================================
ModuleRegistry.registerModules([AllCommunityModule]);

// ============================================================================
// TYPES
// ============================================================================
export interface ProductRow {
    productName: string;
    variationName: string;
    barcode: string;
    sku?: string;
    unitName: string;
    price: number;
    sellingPrice: number;
    wholesalePrice: number;
    deliveryCost: number;
    initialStock: number;
    color?: string;
    description?: string;
    productCategoryName?: string;
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

interface BulkImportPreviewGridProps {
    data: ProductRow[];
    errors?: ValidationError[];
    onDataChange?: (data: ProductRow[]) => void;
}

// ============================================================================
// CONSTANTS - Column Configuration
// ============================================================================
const REQUIRED_FIELDS: ReadonlySet<keyof ProductRow> = new Set([
    "productName",
    "variationName",
    "barcode",
    "unitName",
    "price",
    "sellingPrice",
    "initialStock",
]);

const FILLABLE_COLUMNS: ReadonlySet<keyof ProductRow> = new Set([
    "productName",
    "productCategoryName",
    "unitName",
    "price",
    "sellingPrice",
    "wholesalePrice",
    "deliveryCost",
    "color",
    "description",
]);


// Cell class names
const CELL_CLASS = {
    error: "bg-red-100 dark:bg-red-900/30",
    warning: "bg-amber-100 dark:bg-amber-900/30",
} as const;

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Detects current dark mode state from theme context and DOM
 */
function useDarkMode(): boolean {
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const resolveDarkMode = (): boolean => {
            if (theme === "dark") return true;
            if (theme === "light") return false;
            return document.documentElement.classList.contains("dark");
        };

        setIsDark(resolveDarkMode());

        // Watch for system theme changes via class mutations
        const observer = new MutationObserver(() => setIsDark(resolveDarkMode()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, [theme]);

    return isDark;
}

/**
 * Creates an error lookup map for O(1) cell error checking
 */
function useErrorMap(errors: ValidationError[]): Map<string, string> {
    return useMemo(() => {
        const map = new Map<string, string>();
        for (const { row, field, message } of errors) {
            map.set(`${row}-${field}`, message);
        }
        return map;
    }, [errors]);
}

// ============================================================================
// COLUMN FACTORY
// ============================================================================

interface ColumnConfig {
    field: keyof ProductRow;
    translationKey: string;
    defaultHeader: string;
    tooltipKey?: string;
    tooltipDefault?: string;
    required?: boolean;
    numeric?: boolean;
    minWidth: number;
}

const COLUMN_CONFIGS: readonly ColumnConfig[] = [
    {
        field: "productName",
        translationKey: "products.productName",
        defaultHeader: "Product Name",
        tooltipKey: "bulk.fillDownProductName",
        tooltipDefault: "Same name = same product. Fill-Down supported.",
        required: true,
        minWidth: 180,
    },
    {
        field: "variationName",
        translationKey: "products.variationName",
        defaultHeader: "Variation",
        tooltipKey: "bulk.variationUnique",
        tooltipDefault: "Must be unique for each row",
        required: true,
        minWidth: 150,
    },
    {
        field: "barcode",
        translationKey: "products.barcode",
        defaultHeader: "Barcode",
        tooltipKey: "bulk.barcodeUnique",
        tooltipDefault: "Must be unique. Fill-Down disabled.",
        required: true,
        minWidth: 140,
    },
    {
        field: "sku",
        translationKey: "products.sku",
        defaultHeader: "SKU",
        minWidth: 100,
    },
    {
        field: "productCategoryName",
        translationKey: "products.productCategory",
        defaultHeader: "Category",
        tooltipKey: "bulk.fillDownCategory",
        tooltipDefault: "Fill-Down supported",
        minWidth: 130,
    },
    {
        field: "unitName",
        translationKey: "products.unit",
        defaultHeader: "Unit",
        tooltipKey: "bulk.fillDownUnit",
        tooltipDefault: "Fill-Down supported",
        required: true,
        minWidth: 90,
    },
    {
        field: "price",
        translationKey: "products.price",
        defaultHeader: "Price",
        tooltipKey: "bulk.fillDownPrice",
        tooltipDefault: "Fill-Down supported",
        required: true,
        numeric: true,
        minWidth: 100,
    },
    {
        field: "sellingPrice",
        translationKey: "products.sellingPrice",
        defaultHeader: "Selling Price",
        tooltipKey: "bulk.fillDownPrice",
        tooltipDefault: "Fill-Down supported",
        required: true,
        numeric: true,
        minWidth: 120,
    },
    {
        field: "wholesalePrice",
        translationKey: "products.wholesalePrice",
        defaultHeader: "Wholesale",
        tooltipKey: "bulk.fillDownPrice",
        tooltipDefault: "Fill-Down supported",
        numeric: true,
        minWidth: 100,
    },
    {
        field: "deliveryCost",
        translationKey: "products.deliveryCost",
        defaultHeader: "Delivery Cost",
        tooltipKey: "bulk.fillDownPrice",
        tooltipDefault: "Fill-Down supported",
        numeric: true,
        minWidth: 110,
    },
    {
        field: "initialStock",
        translationKey: "bulk.initialStock",
        defaultHeader: "Stock",
        required: true,
        numeric: true,
        minWidth: 80,
    },
    {
        field: "color",
        translationKey: "products.color",
        defaultHeader: "Color",
        minWidth: 90,
    },
    {
        field: "description",
        translationKey: "products.description",
        defaultHeader: "Description",
        minWidth: 150,
    },
];

/**
 * Generates AG Grid column definitions from config with i18n support
 */

function useColumnDefs(
    t: (key: string, options?: { defaultValue: string }) => string,
    getCellClass: (params: CellClassParams<ProductRow>) => string
): ColDef<ProductRow>[] {
    return useMemo(() => {
        return COLUMN_CONFIGS.map((config): ColDef<ProductRow> => {
            const baseHeader = t(config.translationKey, { defaultValue: config.defaultHeader });
            const headerSuffix = config.required ? " *" : "";

            return {
                field: config.field,
                headerName: `${baseHeader}${headerSuffix}`,
                headerTooltip: config.tooltipKey
                    ? t(config.tooltipKey, { defaultValue: config.tooltipDefault ?? "" })
                    : undefined,
                cellClass: getCellClass,
                type: config.numeric ? "numericColumn" : undefined,
                minWidth: config.minWidth,
            };
        });
    }, [t, getCellClass]);
}


// ============================================================================
// DEFAULT COLUMN CONFIG
// ============================================================================
const DEFAULT_COL_DEF: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    editable: true,
    enableCellChangeFlash: true,
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function BulkImportPreviewGrid({
    data,
    errors = [],
    onDataChange,
}: BulkImportPreviewGridProps) {
    const { t } = useTranslation();
    const gridApiRef = useRef<GridApi<ProductRow> | null>(null);
    const isDark = useDarkMode();
    const errorMap = useErrorMap(errors);

    // Sync data changes via ref to avoid stale closure issues
    const onDataChangeRef = useRef(onDataChange);
    onDataChangeRef.current = onDataChange;

    // AG Grid theme
    const gridTheme = useMemo(
        () => themeQuartz.withPart(isDark ? colorSchemeDark : colorSchemeLight),
        [isDark]
    );

    // Cell class resolver with error + required field validation
    const getCellClass = useCallback(
        (params: CellClassParams<ProductRow>): string => {
            const field = params.colDef.field as keyof ProductRow;
            const rowIndex = params.node.rowIndex;
            if (rowIndex === null) return "";

            // Row offset: +2 because Excel row 1 is header, validation uses 1-indexed
            const errorKey = `${rowIndex + 2}-${field}`;
            if (errorMap.has(errorKey)) {
                return CELL_CLASS.error;
            }

            // Empty required field warning
            if (REQUIRED_FIELDS.has(field)) {
                const value = params.value;
                const isEmpty = value === null || value === undefined || value === "" || value === 0;
                if (isEmpty) return CELL_CLASS.warning;
            }

            return "";
        },
        [errorMap]
    );

    // Column definitions
    const columnDefs = useColumnDefs(t, getCellClass);

    // Fill operation - block unique fields, allow fillable columns
    const handleFillOperation = useCallback((params: FillOperationParams): unknown => {
        const colId = params.column.getColId() as keyof ProductRow;
        if (!FILLABLE_COLUMNS.has(colId)) return false;
        return params.values[0];
    }, []);

    // Cell change handler - extract all row data and notify parent
    const handleCellValueChanged = useCallback(() => {
        const api = gridApiRef.current;
        const callback = onDataChangeRef.current;
        if (!api || !callback) return;

        const updatedData: ProductRow[] = [];
        api.forEachNode((node) => {
            if (node.data) updatedData.push(node.data);
        });
        callback(updatedData);
    }, []);

    // Grid ready handler
    const handleGridReady = useCallback((event: GridReadyEvent<ProductRow>) => {
        gridApiRef.current = event.api;
    }, []);

    return (
        <div className="space-y-3">

            <div className="h-[400px] w-full rounded-md border">
                <AgGridReact<ProductRow>
                    theme={gridTheme}
                    rowData={data}
                    columnDefs={columnDefs}
                    defaultColDef={DEFAULT_COL_DEF}
                    animateRows
                    rowSelection="multiple"
                    suppressRowClickSelection
                    enableRangeSelection
                    enableFillHandle
                    fillHandleDirection="y"
                    fillOperation={handleFillOperation}
                    onCellValueChanged={handleCellValueChanged}
                    onGridReady={handleGridReady}
                    tooltipShowDelay={500}
                />
            </div>


        </div>
    );
}
