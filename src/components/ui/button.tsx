import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium tracking-tight transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 active:translate-y-0 active:scale-[0.99] motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary !text-white shadow-[var(--shadow-sm)] hover:bg-primary/90 hover:!text-white hover:shadow-[var(--shadow-md)] dark:!text-[#071f2d] dark:hover:!text-[#071f2d]",
        safety:
          "bg-[var(--mkt-safety)] text-[var(--mkt-safety-ink)] shadow-[var(--shadow-sm)] hover:bg-[var(--mkt-safety-hover)] hover:text-[var(--mkt-safety-ink)] hover:shadow-[var(--shadow-md)]",
        secondary: "bg-muted text-foreground hover:bg-muted/80 hover:text-foreground",
        outline:
          "border border-border bg-card text-foreground shadow-[var(--shadow-sm)] hover:bg-muted hover:border-border hover:text-foreground",
        ghost: "text-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 hover:text-white",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-[var(--radius-sm)] px-6 text-[0.9375rem]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
