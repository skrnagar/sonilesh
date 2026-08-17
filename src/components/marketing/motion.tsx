import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * CSS-only page-load fade (no framer-motion) to keep marketing JS lean.
 * Scroll reveals live in reveal.tsx and are IO-based.
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

export function ScrollCue({
  href = "#mkt-after-hero",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <a href={href} className={cn("mkt-scroll-cue", className)} aria-label="Scroll to next section">
      <span className="mkt-scroll-cue-line" aria-hidden />
      <span className="mkt-scroll-cue-chevron" aria-hidden />
    </a>
  );
}
