import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * CSS-only motion (no framer-motion) to keep marketing JS lean.
 * Respects prefers-reduced-motion via globals.css.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("mkt-fade-in", className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mkt-reveal", className)}>{children}</div>;
}
