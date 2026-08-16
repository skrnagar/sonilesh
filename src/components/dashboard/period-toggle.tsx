"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DashboardRange } from "@/lib/dashboard/aggregates";

const OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function PeriodToggle({ value }: { value: DashboardRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setRange(next: DashboardRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div
      role="tablist"
      aria-label="Dashboard period"
      className="inline-flex rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-sm)]"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-[var(--sidebar-active)] text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setRange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
