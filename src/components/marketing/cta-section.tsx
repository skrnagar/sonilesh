import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/utils";

type CTASectionProps = {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  align?: "left" | "center";
};

export function CTASection({
  title = "See SONIL EHS360 on your operations.",
  description = "Walk field safety, risk, regulatory tracking, ESG/BRSR reporting and leadership analytics — mapped to your sites. Start Free creates an account; commercial terms are not a public free-forever trial.",
  primaryHref = "/book-a-demo",
  primaryLabel = "Book a Demo",
  secondaryHref = "/signup",
  secondaryLabel = "Start Free",
  align = "center",
}: CTASectionProps) {
  const centered = align === "center";

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[var(--mkt-hero)] text-white">
      <div aria-hidden className="mkt-hero-glow pointer-events-none absolute inset-0 opacity-80" />
      <Container
        className={cn(
          "relative py-16 md:py-24",
          centered
            ? "flex flex-col items-center text-center"
            : "flex flex-col items-start justify-between gap-8 md:flex-row md:items-end md:gap-12",
        )}
      >
        <div className={cn("max-w-xl", centered && "mx-auto")}>
          <h2 className="mkt-h2">{title}</h2>
          <p className="mkt-lead mt-4 text-white/72">{description}</p>
        </div>
        <div
          className={cn(
            "flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap",
            centered && "justify-center",
          )}
        >
          <Button asChild size="lg" variant="safety" className="h-12 px-6 shadow-[0_8px_24px_-8px_rgba(15,118,110,0.55)]">
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-white/20 bg-white/5 px-6 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
