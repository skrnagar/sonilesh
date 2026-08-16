import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { FadeIn } from "@/components/marketing/motion";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryHref = "/request-demo",
  primaryLabel = "Request demo",
  secondaryHref,
  secondaryLabel,
  children,
  className,
  compact,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border",
        className,
      )}
    >
      <div aria-hidden className="mkt-page-hero-wash pointer-events-none absolute inset-0" />
      <Container className={cn("relative", compact ? "py-12 md:py-16" : "py-16 md:py-24")}>
        <div
          className={cn(
            "grid gap-10",
            children && "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16",
          )}
        >
          <FadeIn>
            {eyebrow ? (
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--mkt-safety)]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-2xl font-display text-[2.15rem] font-semibold leading-[1.04] tracking-[-0.05em] text-primary sm:text-4xl md:text-[2.9rem] md:leading-[1.05]">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" variant="safety" className="h-12 px-6">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              {secondaryHref && secondaryLabel ? (
                <Button asChild size="lg" variant="outline" className="h-12 px-6">
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              ) : null}
            </div>
          </FadeIn>
          {children}
        </div>
      </Container>
    </section>
  );
}
