import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  name: string;
  audience: string;
  points: readonly string[];
  cta: string;
  href: string;
  featured?: boolean;
};

export function PricingCard({
  name,
  audience,
  points,
  cta,
  href,
  featured,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-6 transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none",
        featured
          ? "border-[var(--mkt-safety)]/50 shadow-[var(--shadow-md)]"
          : "border-border hover:border-accent/30 hover:shadow-[var(--shadow-sm)]",
      )}
    >
      {featured ? (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--mkt-safety),transparent)]"
        />
      ) : null}
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--mkt-safety)]">
        {featured ? "Most requested" : "Plan"}
      </p>
      <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{audience}</p>
      <p className="mt-6 text-sm font-medium text-primary">Custom commercial packaging</p>
      <ul className="mt-6 flex-1 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mkt-safety)]" aria-hidden />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        className="mt-8"
        variant={featured ? "safety" : "outline"}
      >
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
