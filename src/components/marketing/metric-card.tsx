import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "critical";
  className?: string;
};

const toneClass = {
  default: "text-primary",
  success: "text-[var(--mkt-safety)]",
  warning: "text-warning",
  critical: "text-destructive",
} as const;

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: MetricCardProps) {
  return (
    <div className={cn("border border-border bg-card px-4 py-3", className)}>
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", toneClass[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
