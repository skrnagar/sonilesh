import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { FadeIn } from "@/components/marketing/motion";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
  align?: "left" | "center";
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryHref = "/book-a-demo",
  primaryLabel = "Book a Demo",
  secondaryHref,
  secondaryLabel,
  children,
  className,
  compact,
  align = "left",
}: PageHeroProps) {
  const centered = align === "center" && !children;

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border",
        className,
      )}
    >
      <div aria-hidden className="mkt-page-hero-wash pointer-events-none absolute inset-0" />
      <Container className={cn("relative", compact ? "py-14 md:py-20" : "py-20 md:py-28")}>
        <div
          className={cn(
            "grid gap-10",
            children && "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16",
            centered && "mx-auto max-w-3xl text-center",
          )}
        >
          <FadeIn className={centered ? "flex flex-col items-center" : undefined}>
            {eyebrow ? (
              <p className="mkt-eyebrow mb-4 text-[var(--mkt-safety)]">{eyebrow}</p>
            ) : null}
            <h1 className={cn("mkt-h1-page text-primary", centered ? "max-w-2xl" : "max-w-2xl")}>
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "mkt-lead mt-5 text-muted-foreground",
                  centered && "mx-auto",
                )}
              >
                {description}
              </p>
            ) : null}
            <div
              className={cn(
                "mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap",
                centered && "justify-center",
              )}
            >
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
