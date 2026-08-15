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
        "flex flex-col rounded-lg border bg-card p-6 transition-shadow",
        featured
          ? "border-accent shadow-[0_0_0_1px_var(--accent),var(--shadow-md)]"
          : "border-border hover:shadow-[var(--shadow-sm)]",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">
        {featured ? "Most requested" : "Plan"}
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-primary">{name}</h3>
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
        className={cn(
          "mt-8",
          featured && "bg-[var(--mkt-safety)] text-white hover:bg-[#0d6b63]",
        )}
        variant={featured ? "default" : "outline"}
      >
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
