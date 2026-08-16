import Link from "next/link";
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
  description = "Request a demo to walk through field capture, investigations, CAPA, and leadership visibility — mapped to your industry.",
  primaryHref = "/request-demo",
  primaryLabel = "Request demo",
  secondaryHref = "/contact",
  secondaryLabel = "Contact sales",
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-primary text-primary-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,rgba(31,111,139,0.45),transparent_45%),radial-gradient(ellipse_at_90%_100%,rgba(15,118,110,0.28),transparent_40%)]"
      />
      <Container className="relative flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center md:py-20">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-200">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="bg-[var(--mkt-safety)] text-white hover:bg-[#0d6b63]"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
