import * as React from "react";

import { cn } from "@/lib/utils";
import { badgeVariants } from "./variants";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants[variant], className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
