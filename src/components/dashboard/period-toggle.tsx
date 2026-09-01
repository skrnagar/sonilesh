"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  function setRange(next: DashboardRange) {
    if (next === selected) return;
    setSelected(next);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", next);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Dashboard period"
      aria-busy={pending}
      className="inline-flex w-full min-w-0 rounded-[var(--radius-sm)] border border-border/90 bg-card p-1 shadow-[var(--shadow-sm)] sm:w-auto"
    >
      {OPTIONS.map((option) => {
        const active = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={pending && !active}
            className={cn(
              "min-h-11 flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-[background-color,color,box-shadow,opacity] duration-150 sm:flex-none sm:px-3",
              active
                ? "bg-primary text-white shadow-[var(--shadow-sm)] dark:text-[#071f2d]"
                : "text-foreground hover:bg-muted/60 hover:text-foreground",
              pending && !active && "opacity-60",
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
