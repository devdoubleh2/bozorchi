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

// Format large numbers for axis labels
const formatAxisLabel = ({ value }: { value: number }): string => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return String(value);
};

// Custom type for AG Charts bar chart options (AG Charts v13 types are too strict)
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

interface RevenueChartProps {
    data: { date: string; revenue: number; purchases: number; cogs: number }[];
    title?: string;
    subtitle?: string;
    currency?: string;
}

export function RevenueChart({
    data,
    title,
    subtitle,
    currency = "UZS",
}: RevenueChartProps) {
    const { t, i18n } = useTranslation();

    const options = useMemo((): BarChartOptions => {
        // Transform data to include gross profit (revenue - cogs)
        const transformedData = data.map((item) => ({
            ...item,
            grossProfit: Math.max(0, item.revenue - item.cogs), // Ensure non-negative
        }));

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

        return {
            data: transformedData as Record<string, unknown>[],
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
            series: [
                {
                    type: "bar",
                    xKey: "date",
                    yKey: "revenue",
                    yName: t("home.chartLabels.sales"),
                    fill: "#3b82f6", // Blue for Sales
                    stroke: "#3b82f6",
                    tooltip: { renderer: tooltipRenderer },
                    stacked: false,
                },
                {
                    type: "bar",
                    xKey: "date",
                    yKey: "cogs",
                    yName: t("home.chartLabels.cogs"),
                    stacked: false,
                    fill: "#f59e0b", // Amber for COGS
                    stroke: "#f59e0b",
                    tooltip: { renderer: tooltipRenderer },
                },
                {
                    type: "bar",
                    xKey: "date",
                    yKey: "grossProfit",
                    yName: t("home.chartLabels.grossProfit"),
                    stacked: false,
                    fill: "#10b981", // Emerald for Gross Profit
                    stroke: "#10b981",
                    tooltip: { renderer: tooltipRenderer },
                },
            ],
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, title, subtitle, t, currency, i18n.language]);

    if (data.length === 0) {
        return (
            <div className="flex h-[320px] items-center justify-center rounded-lg border bg-muted/40">
                <p className="text-sm text-muted-foreground">{t("home.noRevenueData", { defaultValue: "No revenue data" })}</p>
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full rounded-lg border bg-card">
            <AgCharts options={options as unknown as AgChartOptions} />
        </div>
    );
}


