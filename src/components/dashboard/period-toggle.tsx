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
      className="inline-flex w-full min-w-0 rounded-[var(--radius-sm)] border border-border/90 bg-card p-1 shadow-[var(--shadow-sm)] sm:w-auto"
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
              "min-h-11 flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 sm:flex-none sm:px-3",
              active
                ? "bg-primary text-white shadow-[var(--shadow-sm)] dark:text-[#071f2d]"
                : "text-foreground hover:bg-muted/60 hover:text-foreground",
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
