import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { PricingBoard } from "@/components/marketing/pricing-board";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { CTASection } from "@/components/marketing/cta-section";
import { metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/pricing");

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Packaged for programs, priced through conversation"
        description="No invented price tags. Choose a packaging direction, then Contact Sales for commercial terms that match your sites, modules, and governance needs."
        primaryHref="/contact"
        primaryLabel="Contact sales"
        secondaryHref="/book-a-demo"
        secondaryLabel="Book a Demo"
        compact
      />

      <section className="mkt-section">
        <Container>
          <PricingBoard />
        </Container>
      </section>

      <section id="compare" className="mkt-section scroll-mt-28 border-y border-border mkt-band">
        <Container>
          <SectionHeader
            eyebrow="Compare"
            title="Capability direction by package"
            description="Illustrative packaging — final entitlements are confirmed commercially."
          />
          <div className="mt-10">
            <ComparisonTable />
          </div>
        </Container>
      </section>

      <CTASection
        title="Get a commercial proposal"
        description="Tell us about sites, modules, and rollout timing — we’ll respond with packaging options."
        primaryHref="/contact"
        primaryLabel="Contact sales"
      />
    </>
  );
}
