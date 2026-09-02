import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { buyerAudiences, productFacts, trustSignals } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

type SocialProofStripProps = {
  variant?: "hero" | "band";
  className?: string;
};

export function SocialProofStrip({ variant = "band", className }: SocialProofStripProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "border-t",
        isHero ? "border-white/10 bg-white/[0.03]" : "border-border bg-[var(--mkt-band)]",
        className,
      )}
    >
      <Container className={cn("py-6 md:py-8", isHero && "py-5 md:py-6")}>
        <p
          className={cn(
            "text-center text-[11px] font-semibold uppercase tracking-[0.2em]",
            isHero ? "text-white/45" : "text-muted-foreground",
          )}
        >
          Built for teams running critical operations
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {buyerAudiences.map((name) => (
            <span
              key={name}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                isHero
                  ? "border-white/12 bg-white/[0.06] text-white/80"
                  : "border-border bg-card text-foreground",
              )}
            >
              {name}
            </span>
          ))}
        </div>
        <div
          className={cn(
            "mt-6 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4",
            isHero ? "border-white/10 bg-white/10" : "border-border bg-border",
          )}
        >
          {productFacts.map((fact) => (
            <div
              key={fact.label}
              className={cn(
                "px-4 py-3 text-center sm:px-5 sm:py-4",
                isHero ? "bg-[var(--mkt-hero)]" : "bg-[var(--mkt-band)]",
              )}
            >
              <p
                className={cn(
                  "font-display text-xl font-semibold tracking-tight sm:text-2xl",
                  isHero ? "text-white" : "text-primary",
                )}
              >
                {fact.value}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs font-semibold sm:text-sm",
                  isHero ? "text-white/85" : "text-foreground",
                )}
              >
                {fact.label}
              </p>
            </div>
          ))}
        </div>
        {!isHero ? (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {trustSignals.join(" · ")}{" "}
            <Link href="/about" className="font-medium text-accent underline-offset-4 hover:underline">
              About SONIL Buildcon
            </Link>
          </p>
        ) : null}
      </Container>
    </div>
  );
}
