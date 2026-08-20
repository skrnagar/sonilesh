import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground hover:border-accent/35 focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
