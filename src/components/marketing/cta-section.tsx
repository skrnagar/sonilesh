import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";

type CTASectionProps = {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CTASection({
  title = "See SONIL EHS360 on your operations.",
  description = "Walk field safety, risk, regulatory tracking, ESG/BRSR reporting and leadership analytics — mapped to your sites. Start Free creates an account; commercial terms are not a public free-forever trial.",
  primaryHref = "/book-a-demo",
  primaryLabel = "Book a Demo",
  secondaryHref = "/signup",
  secondaryLabel = "Start Free",
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[var(--mkt-hero)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(15,118,110,0.28),transparent_48%),radial-gradient(ellipse_at_88%_100%,rgba(31,111,139,0.22),transparent_42%)]"
      />
      <Container className="relative flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-end md:gap-12 md:py-24">
        <div className="max-w-xl">
          <h2 className="mkt-h2">
            {title}
          </h2>
          <p className="mkt-body mt-4 text-base text-white/75">
            {description}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button asChild size="lg" variant="safety" className="h-12 px-6">
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
