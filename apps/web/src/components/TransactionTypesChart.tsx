import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AgCharts } from "ag-charts-react";
import type { AgChartOptions } from "ag-charts-community";
import { ModuleRegistry, AllCommunityModule } from "ag-charts-community";
import { cn } from "@/lib/utils";

// Register AG Charts modules (required for v13+)
ModuleRegistry.registerModules([AllCommunityModule]);

// Format number with thousands separator and currency
const formatMoney = (value: number, currency: string, locale: string) => {
    if (!Number.isFinite(value)) return "0";

    const formatted = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    }).format(value);

    const currencyLabel = currency === "UZS" ? "so'm" : currency;
    return `${formatted} ${currencyLabel}`;
};

// Format large numbers for axis labels
const formatAxisLabel = ({ value }: { value: number }): string => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return String(value);
};

// Transaction type categories for better organization
type TxCategory = "all" | "inflows" | "outflows" | "internal";

const TX_CATEGORIES: Record<TxCategory, string[]> = {
    all: ["import", "export", "return", "adjustment", "debt", "repayment", "exchange", "internal_use", "transfer_in", "transfer_out", "supplier_return"],
    inflows: ["import", "return", "repayment", "transfer_in"], // Money/goods coming in
    outflows: ["export", "debt", "transfer_out", "supplier_return"], // Money/goods going out
    internal: ["adjustment", "exchange", "internal_use"], // Internal operations
};

// Transaction type colors - organized by category with cohesive palettes
const TX_TYPE_COLORS: Record<string, string> = {
    // Inflows - Green/Cyan tones (positive)
    import: "#10b981", // emerald-500
    return: "#34d399", // emerald-400
    repayment: "#22c55e", // green-500
    transfer_in: "#06b6d4", // cyan-500

    // Outflows - Blue/Red tones (negative)
    export: "#3b82f6", // blue-500
    debt: "#f59e0b", // amber-500
    transfer_out: "#6366f1", // indigo-500
    supplier_return: "#ef4444", // red-500

    // Internal - Purple/Orange tones (neutral)
    adjustment: "#a855f7", // purple-500
    exchange: "#8b5cf6", // violet-500
    internal_use: "#f97316", // orange-500
};

// Human-readable labels (fallback)
const TX_TYPE_LABELS: Record<string, string> = {
    import: "Import",
    export: "Export",
    return: "Return",
    debt: "Debt",
    repayment: "Repayment",
    adjustment: "Adjustment",
    transfer_in: "Transfer In",
    transfer_out: "Transfer Out",
    internal_use: "Internal Use",
    supplier_return: "Supplier Return",
    exchange: "Exchange",
};

// Custom type for AG Charts bar chart options
interface BarChartOptions {
    data: Record<string, unknown>[];
    theme?: string;
    background?: { fill: string };
    title?: { text: string; fontSize: number; fontWeight: string; color: string };
    subtitle?: { text: string; fontSize: number; color: string };
    legend?: Record<string, unknown>;
    series: Array<{
        type: "bar";
        xKey: string;
        yKey: string;
        yName: string;
        stacked?: boolean;
        fill: string;
        stroke: string;
        tooltip?: { renderer: (params: Record<string, unknown>) => string };
    }>;
    axes: Array<{
        type: "category" | "number";
        position: "top" | "bottom" | "left" | "right";
        label?: {
            color?: string;
            fontSize?: number;
            formatter?: (params: { value: number }) => string;
        };
        line?: { stroke: string };
        gridLine?: { enabled?: boolean; style?: Array<{ stroke: string; lineDash: number[] }> };
    }>;
    padding?: { top: number; right: number; bottom: number; left: number };
}

interface TransactionTypesChartProps {
    data: { date: string;[key: string]: string | number }[];
    activeTypes: string[];
    title?: string;
    subtitle?: string;
    currency?: string;
}

// Category tab button component
function CategoryTab({
    label,
    isActive,
    count,
    onClick,
}: {
    category: TxCategory;
    label: string;
    isActive: boolean;
    count: number;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                "border border-transparent",
                isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            {label}
            <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                isActive ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
            )}>
                {count}
            </span>
        </button>
    );
}

export function TransactionTypesChart({
    data,
    activeTypes,
    title = "Transaction Breakdown",
    subtitle = "All transaction types by day",
    currency = "UZS",
}: TransactionTypesChartProps) {
    const { t, i18n } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<TxCategory>("all");

    // Filter active types based on selected category
    const filteredTypes = useMemo(() => {
        const categoryTypes = TX_CATEGORIES[selectedCategory];
        return activeTypes.filter(type => categoryTypes.includes(type));
    }, [activeTypes, selectedCategory]);

    // Count types with actual data in each category
    const categoryCounts = useMemo(() => {
        const hasData = (type: string) => data.some(day => (day[type] as number) > 0);
        return {
            all: activeTypes.filter(hasData).length,
            inflows: TX_CATEGORIES.inflows.filter(t => activeTypes.includes(t) && hasData(t)).length,
            outflows: TX_CATEGORIES.outflows.filter(t => activeTypes.includes(t) && hasData(t)).length,
            internal: TX_CATEGORIES.internal.filter(t => activeTypes.includes(t) && hasData(t)).length,
        };
    }, [data, activeTypes]);

    const options = useMemo((): BarChartOptions => {
        // Custom HTML tooltip renderer for currency values
        const tooltipRenderer = (params: Record<string, unknown>) => {
            const datum = params.datum as Record<string, unknown>;
            const yKey = params.yKey as string;
            const yName = params.yName as string;
            const value = datum[yKey] as number;
            const formattedValue = formatMoney(value, currency, i18n.language);
            return `
                <div style="padding: 8px 12px; background: #1f2937; border-radius: 6px; border: 1px solid #374151;">
                    <div style="color: #9ca3af; font-size: 13px;">
                        ${yName}: <span style="color: #fff; font-weight: 500;">${formattedValue}</span>
                    </div>
                </div>
            `;
        };

        // Build series for filtered transaction types (grouped bars, not stacked)
        const series = filteredTypes.map((type) => ({
            type: "bar" as const,
            xKey: "date",
            yKey: type,
            yName: t(`txType.${type}`, { defaultValue: TX_TYPE_LABELS[type] ?? type }),
            stacked: false, // Grouped bars like Revenue Overview
            fill: TX_TYPE_COLORS[type] ?? "#888888",
            stroke: TX_TYPE_COLORS[type] ?? "#888888",
            tooltip: { renderer: tooltipRenderer },
        }));

        return {
            data: data as Record<string, unknown>[],
            theme: "ag-default-dark",
            background: {
                fill: "transparent",
            },
            title: title ? {
                text: title,
                fontSize: 16,
                fontWeight: "bold",
                color: "#e5e7eb",
            } : undefined,
            subtitle: subtitle ? {
                text: subtitle,
                fontSize: 12,
                color: "#9ca3af",
            } : undefined,
            legend: {
                position: "bottom",
                item: {
                    label: {
                        color: "#e5e7eb",
                        fontSize: 11,
                    },
                    marker: {
                        strokeWidth: 0,
                    },
                },
            },
            series,
            axes: [
                {
                    type: "category",
                    position: "bottom",
                    label: {
                        color: "#9ca3af",
                        fontSize: 11,
                    },
                    line: { stroke: "#374151" },
                    gridLine: { enabled: false },
                },
                {
                    type: "number",
                    position: "right",
                    label: {
                        color: "#9ca3af",
                        fontSize: 11,
                        formatter: formatAxisLabel,
                    },
                    line: { stroke: "#374151" },
                    gridLine: {
                        style: [{ stroke: "#374151", lineDash: [4, 4] }],
                    },
                },
            ],
            padding: { top: 20, right: 20, bottom: 20, left: 20 },
        };
    }, [data, filteredTypes, title, subtitle, t, currency, i18n.language]);

    if (data.length === 0 || activeTypes.length === 0) {
        return (
            <div className="flex h-[360px] items-center justify-center rounded-lg border bg-muted/40">
                <p className="text-sm text-muted-foreground">{t("home.noTransactionData", { defaultValue: "No transaction data" })}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Category filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                <CategoryTab
                    category="all"
                    label={t("txCategory.all", { defaultValue: "All" })}
                    isActive={selectedCategory === "all"}
                    count={categoryCounts.all}
                    onClick={() => setSelectedCategory("all")}
                />
                <CategoryTab
                    category="inflows"
                    label={t("txCategory.inflows", { defaultValue: "Inflows" })}
                    isActive={selectedCategory === "inflows"}
                    count={categoryCounts.inflows}
                    onClick={() => setSelectedCategory("inflows")}
                />
                <CategoryTab
                    category="outflows"
                    label={t("txCategory.outflows", { defaultValue: "Outflows" })}
                    isActive={selectedCategory === "outflows"}
                    count={categoryCounts.outflows}
                    onClick={() => setSelectedCategory("outflows")}
                />
                <CategoryTab
                    category="internal"
                    label={t("txCategory.internal", { defaultValue: "Internal" })}
                    isActive={selectedCategory === "internal"}
                    count={categoryCounts.internal}
                    onClick={() => setSelectedCategory("internal")}
                />
            </div>

            {/* Chart */}
            <div className="h-[320px] w-full rounded-lg border bg-card">
                {filteredTypes.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            {t("home.noDataForCategory", { defaultValue: "No data for this category" })}
                        </p>
                    </div>
                ) : (
                    <AgCharts options={options as unknown as AgChartOptions} />
                )}
            </div>
        </div>
    );
}
