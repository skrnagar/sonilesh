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
 * SONIL EHS360 mark — nested 360° arcs + control node.
 * Geometric SaaS tile. Not a shield, helmet, or government crest.
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
        <linearGradient id={`${gid}-tile`} x1="6" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a1c26" />
          <stop offset="1" stopColor="#051015" />
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
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="0.75"
      />
      {/* Outer 360 sweep — gap at 12 o’clock */}
      <path
        d="M27.4 11.2 A11.5 11.5 0 1 1 12.6 11.2"
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="2.2"
        strokeLinecap="square"
      />
      {/* Inner counter-arc */}
      <path
        d="M13.8 25.6 A7.15 7.15 0 1 1 26.2 25.6"
        fill="none"
        stroke="rgba(248,250,252,0.38)"
        strokeWidth="1.45"
        strokeLinecap="square"
      />
      {/* Control node in the 360 gap */}
      <rect x="17.15" y="6.35" width="5.7" height="5.7" fill="#f8fafc" />
      {/* Platform core */}
      <rect x="18.35" y="18.35" width="3.3" height="3.3" fill="#2dd4bf" />
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
        <span className="min-w-0 leading-none">
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
            <span className="font-semibold">{brand.legalName}</span>
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
                "mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em]",
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
