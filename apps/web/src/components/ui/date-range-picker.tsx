"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { startOfMonth, endOfMonth, startOfQuarter, startOfYear, subDays, subMonths } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps {
    className?: string
    value?: DateRange
    onChange?: (range: DateRange | undefined) => void
    /** Align the popover to start, center, or end */
    align?: "start" | "center" | "end"
}

type PresetKey =
    | "today"
    | "yesterday"
    | "last7days"
    | "last30days"
    | "thisMonth"
    | "lastMonth"
    | "thisQuarter"
    | "thisYear"

interface Preset {
    key: PresetKey
    getRange: () => DateRange
}

const presets: Preset[] = [
    {
        key: "today",
        getRange: () => {
            const today = new Date()
            return { from: today, to: today }
        },
    },
    {
        key: "yesterday",
        getRange: () => {
            const yesterday = subDays(new Date(), 1)
            return { from: yesterday, to: yesterday }
        },
    },
    {
        key: "last7days",
        getRange: () => ({
            from: subDays(new Date(), 6),
            to: new Date(),
        }),
    },
    {
        key: "last30days",
        getRange: () => ({
            from: subDays(new Date(), 29),
            to: new Date(),
        }),
    },
    {
        key: "thisMonth",
        getRange: () => ({
            from: startOfMonth(new Date()),
            to: new Date(),
        }),
    },
    {
        key: "lastMonth",
        getRange: () => {
            const lastMonth = subMonths(new Date(), 1)
            return {
                from: startOfMonth(lastMonth),
                to: endOfMonth(lastMonth),
            }
        },
    },
    {
        key: "thisQuarter",
        getRange: () => ({
            from: startOfQuarter(new Date()),
            to: new Date(),
        }),
    },
    {
        key: "thisYear",
        getRange: () => ({
            from: startOfYear(new Date()),
            to: new Date(),
        }),
    },
]

export function DateRangePicker({
    className,
    value,
    onChange,
    align = "start",
}: DateRangePickerProps) {
    const { t, i18n } = useTranslation()
    const [open, setOpen] = React.useState(false)

    // Internal state for calendar selection before applying
    const [tempRange, setTempRange] = React.useState<DateRange | undefined>(value)

    // Sync tempRange when value changes externally
    React.useEffect(() => {
        setTempRange(value)
    }, [value])

    const handlePresetClick = (preset: Preset) => {
        const range = preset.getRange()
        onChange?.(range)
        setOpen(false)
    }

    const handleCalendarSelect = (range: DateRange | undefined) => {
        setTempRange(range)
        // Auto-close and apply when both dates are selected
        if (range?.from && range?.to) {
            onChange?.(range)
            setOpen(false)
        }
    }

    const formatDateRange = (range: DateRange | undefined) => {
        if (!range?.from) {
            return t("dateRange.placeholder", { defaultValue: "Select date range" })
        }

        const locale = i18n.language === "uz" ? "uz-UZ" : "en-US"
        const formatOptions: Intl.DateTimeFormatOptions = {
            month: "short",
            day: "numeric",
            year: range.from.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
        }

        if (range.to) {
            if (range.from.toDateString() === range.to.toDateString()) {
                return range.from.toLocaleDateString(locale, formatOptions)
            }
            return `${range.from.toLocaleDateString(locale, formatOptions)} - ${range.to.toLocaleDateString(locale, formatOptions)}`
        }

        return range.from.toLocaleDateString(locale, formatOptions)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "justify-start text-left font-normal min-w-[200px]",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange(value)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align={align}>
                <div className="flex flex-col sm:flex-row">
                    {/* Preset buttons */}
                    <div className="flex flex-wrap gap-1 p-3 sm:flex-col sm:border-r border-b sm:border-b-0">
                        {presets.map((preset) => (
                            <Button
                                key={preset.key}
                                variant="ghost"
                                size="sm"
                                className="justify-start text-sm h-8 px-3"
                                onClick={() => handlePresetClick(preset)}
                            >
                                {t(`dateRange.${preset.key}`, { defaultValue: preset.key })}
                            </Button>
                        ))}
                    </div>

                    {/* Calendar */}
                    <div className="p-3">
                        <Calendar
                            mode="range"
                            defaultMonth={tempRange?.from}
                            selected={tempRange}
                            onSelect={handleCalendarSelect}
                            numberOfMonths={2}
                            disabled={{ after: new Date() }}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
