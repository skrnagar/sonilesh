"use client";

import { recommendPlan, type PlanFitAnswers, type PlanName } from "@/lib/marketing/plan-fit";
import { cn } from "@/lib/utils";

const SITE_OPTIONS: Array<{ value: PlanFitAnswers["sites"]; label: string }> = [
  { value: "one", label: "One site" },
  { value: "several", label: "Several sites" },
  { value: "portfolio", label: "Complex portfolio" },
];

export function PlanFit({
  value,
  onChange,
}: {
  value: PlanFitAnswers;
  onChange: (next: PlanFitAnswers) => void;
}) {
  const fit: PlanName = recommendPlan(value);

  return (
    <div id="plan-fit" className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--mkt-safety)]">
        Which plan fits
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Three questions using the packaging already on this page — not a quote, not new entitlements.
      </p>
      <fieldset className="mt-5">
        <legend className="text-sm font-medium">How do you operate sites?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SITE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...value, sites: option.value })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                value.sites === option.value
                  ? "border-[var(--mkt-safety)] bg-[color-mix(in_srgb,var(--mkt-safety)_12%,transparent)]"
                  : "border-border bg-background",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Need compliance tracking and ESG/BRSR on the same tenant?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: false, label: "Not yet" },
            { value: true, label: "Yes, when entitled" },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange({ ...value, esgCompliance: option.value })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                value.esgCompliance === option.value
                  ? "border-[var(--mkt-safety)] bg-[color-mix(in_srgb,var(--mkt-safety)_12%,transparent)]"
                  : "border-border bg-background",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Deployment</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: false, label: "Cloud SaaS" },
            { value: true, label: "Private instance option" },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange({ ...value, privateInstance: option.value })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                value.privateInstance === option.value
                  ? "border-[var(--mkt-safety)] bg-[color-mix(in_srgb,var(--mkt-safety)_12%,transparent)]"
                  : "border-border bg-background",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="mt-5 text-sm">
        Highlighted card: <span className="font-semibold text-primary">{fit}</span>
        <span className="text-muted-foreground"> — Contact Sales for commercial terms.</span>
      </p>
    </div>
  );
}
