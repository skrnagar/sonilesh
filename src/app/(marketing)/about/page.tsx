import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { CTASection } from "@/components/marketing/cta-section";
import { brand } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "About SONIL EHS360 — an enterprise multi-tenant EHS SaaS platform from field capture to boardroom visibility.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={brand.name}
        description={`${brand.tagline} ${brand.supporting} We build operational software for Environment, Health & Safety programs that need real control — not slideware.`}
        compact
      />
      <section className="py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Principles"
            title="How we design the product"
            description="Enterprise density, field realism, and honest marketing."
          />
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <FeatureCard
              title="System of record"
              body="Incidents, risk, permits, inspections, and CAPA belong in one governed platform."
            />
            <FeatureCard
              title="SaaS seriousness"
              body="Multi-tenant isolation, entitlements, and admin tooling are product requirements — not afterthoughts."
            />
            <FeatureCard
              title="No fake proof"
              body="We don’t invent logos, certifications, or case studies to look bigger than we are."
            />
          </div>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
