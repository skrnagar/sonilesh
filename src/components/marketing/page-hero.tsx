import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
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
        "relative overflow-hidden border-b border-border bg-white",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(31,111,139,0.14),transparent_42%),radial-gradient(ellipse_at_100%_0%,rgba(15,118,110,0.08),transparent_36%),linear-gradient(180deg,#ffffff_0%,#f4f6f8_100%)]"
      />
      <Container className={cn("relative", compact ? "py-14 md:py-16" : "py-16 md:py-20")}>
        <div
          className={cn(
            "grid gap-10",
            children && "lg:grid-cols-[1.1fr_0.9fr] lg:items-center",
          )}
        >
          <div>
            {eyebrow ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mkt-safety)]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-primary md:text-[2.75rem] md:leading-[1.12]">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-[1.05rem]">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[var(--mkt-safety)] text-white hover:bg-[#0d6b63]"
              >
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
              {secondaryHref && secondaryLabel ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              ) : null}
            </div>
          </div>
          {children}
        </div>
      </Container>
    </section>
  );
}
