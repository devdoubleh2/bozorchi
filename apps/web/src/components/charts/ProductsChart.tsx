import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AgCharts } from "ag-charts-react";
import type { AgChartOptions } from "ag-charts-community";
import { ModuleRegistry, AllCommunityModule } from "ag-charts-community";

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

// Custom type for AG Charts pie chart options (AG Charts v13 types are too strict)
interface PieChartOptions {
    data: Record<string, unknown>[];
    theme?: string;
    background?: { fill: string };
    title?: { text: string; fontSize: number; fontWeight: string; color: string };
    subtitle?: { text: string; fontSize: number; color: string };
    legend?: Record<string, unknown>;
    series: Array<{
        type: "pie";
        angleKey: string;
        labelKey: string;
        fills?: string[];
        strokes?: string[];
        strokeWidth?: number;
        tooltip?: { renderer: (params: Record<string, unknown>) => string };
        label?: {
            enabled?: boolean;
            fontSize?: number;
            color?: string;
        };
        calloutLabel?: {
            enabled?: boolean;
        };
    }>;
    padding?: { top: number; right: number; bottom: number; left: number };
}

interface ProductsChartProps {
    data: { name: string; revenue: number }[];
    title?: string;
    subtitle?: string;
    currency?: string;
}

export function ProductsChart({
    data,
    title,
    subtitle,
    currency = "UZS",
}: ProductsChartProps) {
    const { t, i18n } = useTranslation();

    const options = useMemo((): PieChartOptions => {
        // Custom HTML tooltip renderer for currency values
        const tooltipRenderer = (params: Record<string, unknown>) => {
            const datum = params.datum as Record<string, unknown>;
            const value = datum.revenue as number;
            const label = datum.name as string;
            const formattedValue = formatMoney(value, currency, i18n.language);
            
            // Calculate percentage
            const total = data.reduce((sum, item) => sum + item.revenue, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            return `
                <div style="padding: 8px 12px; background: #1f2937; border-radius: 6px; border: 1px solid #374151;">
                    <div style="font-weight: 600; color: #e5e7eb; margin-bottom: 4px;">${label || 'Unknown Product'}</div>
                    <div style="color: #9ca3af; font-size: 13px;">
                        ${t("home.revenue", { defaultValue: "Revenue" })}: <span style="color: #fff; font-weight: 500;">${formattedValue}</span>
                    </div>
                    <div style="color: #9ca3af; font-size: 13px;">
                        <span style="color: #fff; font-weight: 500;">${percentage}%</span>
                    </div>
                </div>
            `;
        };

        // Generate a nice color palette for the pie slices
        const pieColors = [
            "#8b5cf6", // Purple
            "#3b82f6", // Blue
            "#10b981", // Emerald
            "#f59e0b", // Amber
            "#ef4444", // Red
            "#06b6d4", // Cyan
            "#84cc16", // Lime
            "#f97316", // Orange
            "#ec4899", // Pink
            "#6366f1", // Indigo
        ];

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
                position: "right",
                item: {
                    label: {
                        color: "#e5e7eb",
                        fontSize: 11,
                    },
                    marker: {
                        strokeWidth: 0,
                    },
                },
                spacing: 20,
            },
            series: [
                {
                    type: "pie",
                    angleKey: "revenue",
                    labelKey: "name",
                    fills: pieColors,
                    strokes: pieColors,
                    strokeWidth: 2,
                    tooltip: { renderer: tooltipRenderer },
                    label: {
                        enabled: false, // Disable slice labels to avoid clutter
                    },
                    calloutLabel: {
                        enabled: false, // Disable callout labels
                    },
                },
            ],
            padding: { top: 10, right: 10, bottom: 10, left: 10 },
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, title, subtitle, t, currency, i18n.language]);

    if (data.length === 0) {
        return (
            <div className="flex h-[320px] items-center justify-center rounded-lg border bg-muted/40">
                <p className="text-sm text-muted-foreground">{t("home.noProductData", { defaultValue: "No product data" })}</p>
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full rounded-lg border bg-card">
            <AgCharts options={options as unknown as AgChartOptions} />
        </div>
    );
}
