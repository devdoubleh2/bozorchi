"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
    value: string
    onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined)

const useRadioGroup = () => {
    const context = React.useContext(RadioGroupContext)
    if (!context) {
        throw new Error("useRadioGroup must be used within RadioGroup")
    }
    return context
}

interface RadioGroupProps {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    className?: string
    children: React.ReactNode
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
    ({ value, defaultValue, onValueChange, className, children, ...props }, ref) => {
        const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
        const currentValue = value ?? internalValue

        const handleValueChange = React.useCallback(
            (newValue: string) => {
                if (onValueChange) {
                    onValueChange(newValue)
                } else {
                    setInternalValue(newValue)
                }
            },
            [onValueChange]
        )

        return (
            <RadioGroupContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
                <div ref={ref} role="radiogroup" className={cn("grid gap-2", className)} {...props}>
                    {children}
                </div>
            </RadioGroupContext.Provider>
        )
    }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.HTMLAttributes<HTMLButtonElement> {
    value: string
    disabled?: boolean
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
    ({ value, disabled, className, ...props }, ref) => {
        const context = useRadioGroup()
        const isSelected = context.value === value

        return (
            <button
                ref={ref}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                className={cn(
                    "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                onClick={() => !disabled && context.onValueChange(value)}
                {...props}
            >
                {isSelected && (
                    <div className="flex items-center justify-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                )}
            </button>
        )
    }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
