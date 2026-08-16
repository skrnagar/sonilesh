import Link from "next/link";
import {
  AlertTriangle,
  ClipboardCheck,
  ClockAlert,
  Eye,
  FileBadge,
  FileSearch,
  FolderOpen,
  GraduationCap,
  Grid2x2,
  HardHat,
  ListChecks,
  ShieldAlert,
  Siren,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/sparkline";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  ClipboardCheck,
  ClockAlert,
  Eye,
  FileBadge,
  FileSearch,
  FolderOpen,
  GraduationCap,
  Grid2x2,
  HardHat,
  ListChecks,
  ShieldAlert,
  Siren,
};

const ACCENT: Record<string, string> = {
  navy: "bg-primary/10 text-primary",
  blue: "bg-accent/12 text-accent",
  green: "bg-[var(--success-soft)] text-[var(--success-ink)]",
  amber: "bg-[var(--warning-soft)] text-[var(--warning-ink)]",
  red: "bg-[var(--danger-soft)] text-[var(--danger-ink)]",
  slate: "bg-muted text-foreground",
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  href,
  icon,
  accent = "navy",
  trend,
  polarity = "higher-is-worse",
  spark,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "good" | "watch" | "critical";
  href?: string;
  icon?: string;
  accent?: "navy" | "blue" | "green" | "amber" | "red" | "slate";
  trend?: number | null;
  polarity?: "higher-is-worse" | "higher-is-better";
  spark?: number[];
}) {
  const Icon = icon ? ICONS[icon] : null;
  const up = typeof trend === "number" && trend > 0;
  const down = typeof trend === "number" && trend < 0;
  const favorable =
    typeof trend === "number" &&
    ((polarity === "higher-is-better" && up) || (polarity === "higher-is-worse" && down) || trend === 0);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <span
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                ACCENT[accent],
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
        </div>
        {hint ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              tone === "good" && "bg-[var(--success-soft)] text-[var(--success-ink)]",
              tone === "watch" && "bg-[var(--warning-soft)] text-[var(--warning-ink)]",
              tone === "critical" && "bg-[var(--danger-soft)] text-[var(--danger-ink)]",
              tone === "neutral" && "bg-muted text-muted-foreground",
            )}
          >
            {hint}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">
          {value}
        </p>
        {spark && spark.length > 1 ? <Sparkline values={spark} /> : null}
      </div>
      {typeof trend === "number" ? (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium",
            favorable ? "text-[var(--success-ink)]" : "text-[var(--danger-ink)]",
          )}
        >
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : null}
          {down ? <TrendingDown className="h-3.5 w-3.5" /> : null}
          {trend === 0 ? "No change vs prior" : `${Math.abs(trend)}% vs prior period`}
        </p>
      ) : href ? (
        <p className="mt-2 text-xs text-muted-foreground">Vs selected period</p>
      ) : null}
    </>
  );

  const className =
    "block min-w-0 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-colors hover:border-accent/40";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
