import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { DemoForm } from "@/components/marketing/demo-form";
import { getSeoEntry, metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/book-a-demo");

export default function BookADemoPage() {
  const seo = getSeoEntry("/book-a-demo");
  return (
    <>
      <PageHero
        eyebrow="Demo"
        title={seo?.h1 ?? "Book a Demo"}
        description={seo?.description}
        primaryHref="/contact"
        primaryLabel="Contact sales"
        compact
      />
      <section className="pb-20 pt-2 md:pb-28">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--mkt-safety)]">
              What to expect
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary">
              A working product, mapped to your sites
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Commercial conversation — not a webinar. Bring industry, site count, and whether you care most about EHS operations, ESG/BRSR, or statutory tracking.
            </p>
          </div>
          <DemoForm variant="demo" />
        </Container>
      </section>
    </>
  );
}
