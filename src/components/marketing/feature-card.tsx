import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  body?: string;
  icon?: LucideIcon;
  className?: string;
};

export function FeatureCard({ title, body, icon: Icon, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--mkt-safety)_10%,var(--card))] text-[var(--mkt-safety)] ring-1 ring-[color-mix(in_srgb,var(--mkt-safety)_18%,transparent)]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      ) : null}
      <h3 className="font-display text-base font-semibold tracking-tight text-foreground">{title}</h3>
      {body ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      ) : null}
    </div>
  );
}
