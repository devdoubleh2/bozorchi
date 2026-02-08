import * as React from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input"; // Import the existing Input component

interface CurrencyInputProps extends Omit<NumericFormatProps, "customInput"> {
  className?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <NumericFormat
        getInputRef={ref}
        thousandSeparator={true}
        decimalScale={2}
        fixedDecimalScale={true}
        allowNegative={false}
        customInput={Input} // Use the existing Input component for styling
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
