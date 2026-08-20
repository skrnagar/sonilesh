import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
