import { useId } from "react";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/marketing/content";

type BrandLockupProps = {
  className?: string;
  /** Inverse colors for navy / dark chrome */
  inverse?: boolean;
  /** Product chrome: follow sidebar tokens */
  chrome?: boolean;
  size?: "sm" | "md" | "lg";
  /** Hide the type; keep the SVG mark */
  markOnly?: boolean;
  showLegal?: boolean;
};

/**
 * SONIL EHS360 lockup.
 * EHS is the industry acronym (Environment, Health & Safety) — not “ESH”.
 */
export function BrandMark({
  className,
  inverse = false,
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
        <linearGradient id={`${gid}-fill`} x1="8" y1="4" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor={inverse ? "#0f766e" : "#0b3a53"} />
          <stop offset="1" stopColor={inverse ? "#0b3a53" : "#071f2d"} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gid}-fill)`} />
      {/* 360° orbit — incomplete ring */}
      <circle
        cx="20"
        cy="20"
        r="12.25"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.35"
      />
      <path
        d="M20 7.75 A12.25 12.25 0 1 1 7.75 20"
        fill="none"
        stroke="#5eead4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Shield: three EHS layers */}
      <path
        d="M20 11.2 L28.2 14.4 V21.4 C28.2 26.1 20 30.1 20 30.1 C20 30.1 11.8 26.1 11.8 21.4 V14.4 Z"
        fill="rgba(255,255,255,0.08)"
        stroke="white"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="M14.6 20.2 H25.4 M16.1 17.15 H23.9 M17.4 23.2 H22.6"
        stroke="#99f6e4"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.95"
      />
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
      ? "text-xl"
      : size === "sm"
        ? "text-[0.8125rem]"
        : "text-[0.95rem]";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark
        inverse={inverse}
        className={size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9"}
      />
      {markOnly ? (
        <span className="sr-only">{brand.name}</span>
      ) : (
        <span className="min-w-0 leading-none">
          <span
            className={cn(
              "font-display flex items-baseline gap-1.5 whitespace-nowrap tracking-[-0.04em]",
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
                "font-medium",
                chrome
                  ? "text-[var(--mkt-safety)]"
                  : inverse
                    ? "text-teal-200/90"
                    : "text-[var(--mkt-safety)]",
              )}
            >
              {brand.product}
            </span>
          </span>
          {showLegal ? (
            <span
              className={cn(
                "mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em]",
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
