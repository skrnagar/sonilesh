import { useId } from "react";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/marketing/content";

type BrandLockupProps = {
  className?: string;
  /** Inverse type for navy / dark chrome. Mark stays ink + teal. */
  inverse?: boolean;
  /** Product chrome: follow sidebar tokens */
  chrome?: boolean;
  size?: "sm" | "md" | "lg";
  /** Hide the type; keep the SVG mark */
  markOnly?: boolean;
  showLegal?: boolean;
};

/**
 * SONIL EHS360 mark — stacked foundation courses (civil EPC), not an eye/iris.
 */
export function BrandMark({
  className,
}: {
  className?: string;
  inverse?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-9 w-9 shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-tile`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0b3a53" />
          <stop offset="1" stopColor="#071f2d" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="8" fill={`url(#${gid}-tile)`} />
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        rx="7.25"
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="0.75"
      />
      <rect x="8" y="9" width="24" height="6" rx="1.25" fill="#5eead4" />
      <rect x="8" y="17" width="17" height="6" rx="1.25" fill="#2dd4bf" />
      <rect x="8" y="25" width="24" height="6" rx="1.25" fill="#0f766e" />
    </svg>
  );
}

export function BrandLockup({
  className,
  inverse = false,
  chrome = false,
  size = "md",
  markOnly = false,
  showLegal = false,
}: BrandLockupProps) {
  const typeSize =
    size === "lg"
      ? "text-[1.2rem]"
      : size === "sm"
        ? "text-[0.8125rem]"
        : "text-[0.98rem]";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark
        className={size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9"}
      />
      {markOnly ? (
        <span className="sr-only">{brand.name}</span>
      ) : (
        <span className={cn("min-w-0 leading-none", chrome && "sidebar-copy")}>
          <span
            className={cn(
              "font-display flex items-baseline gap-1.5 whitespace-nowrap tracking-[0.05em]",
              typeSize,
              chrome
                ? "text-[var(--sidebar-foreground)]"
                : inverse
                  ? "text-white"
                  : "text-primary",
            )}
          >
            <span className="font-semibold">{brand.wordmark}</span>
            <span
              className={cn(
                "font-semibold tabular-nums tracking-[0.08em]",
                chrome
                  ? "text-[var(--mkt-safety)]"
                  : inverse
                    ? "text-teal-200"
                    : "text-[var(--mkt-safety)]",
              )}
            >
              {brand.product}
            </span>
          </span>
          {showLegal ? (
            <span
              className={cn(
                "mt-0.5 block max-w-[16rem] text-[10px] font-medium uppercase tracking-[0.14em]",
                inverse ? "text-white/45" : "text-muted-foreground",
              )}
            >
              {brand.legalName}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
