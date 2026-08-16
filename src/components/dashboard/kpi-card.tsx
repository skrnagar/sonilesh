import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "good" | "watch" | "critical";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
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
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
