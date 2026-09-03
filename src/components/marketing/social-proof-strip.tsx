import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { productFacts, trustSignals } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

type SocialProofStripProps = {
  className?: string;
};

/** Compact trust band — sits below the hero, not inside the first-viewport composition. */
export function SocialProofStrip({ className }: SocialProofStripProps) {
  return (
    <div className={cn("border-b border-border bg-[var(--mkt-band)]", className)}>
      <Container className="py-8 md:py-10">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {productFacts.map((fact) => (
            <div key={fact.label} className="bg-background px-5 py-5 text-center md:bg-[var(--mkt-band)] md:py-6">
              <p className="font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                {fact.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{fact.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {fact.detail}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {trustSignals.join(" · ")}{" "}
          <Link href="/about" className="font-medium text-accent underline-offset-4 hover:underline">
            About SONIL Buildcon
          </Link>
        </p>
      </Container>
    </div>
  );
}
