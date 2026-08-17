import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { CTASection } from "@/components/marketing/cta-section";
import { metadataForPath } from "@/lib/marketing/seo";
import { brand, company } from "@/lib/marketing/content";

export const metadata = metadataForPath("/about");

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={brand.name}
        description={`${brand.tagline} ${brand.supporting}`}
        compact
      />
      <section className="py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Parent company"
            title="From SONIL Buildcon’s execution culture"
            description="Public facts from sonilbuildcon.com. We do not invent awards, customer logos, or certifications."
          />
          <div className="mt-10 max-w-3xl space-y-4 text-base leading-relaxed text-foreground/85">
            <p>
              {company.legalEntity} is a specialized civil and foundation EPC subcontracting company
              headquartered in {company.hq} ({company.pin}). Public positioning covers transmission
              corridors, substations, solar and renewable civil works, telecom infrastructure, industrial
              civil, and operation & maintenance — including 132kV–765kV tower foundations, utility-scale
              solar civil (piling, MMS, BOP), AIS substations, and tower/OFC civil.
            </p>
            <p>
              Their published HSE language is practical: toolbox talks, PPE, and a zero-harm culture on
              every site. SONIL EHS360 is the multi-tenant EHS, ESG and compliance product from the same
              group — so LMRA, permits, incidents, CAPA and reporting match how infrastructure work actually runs.
            </p>
            <p className="text-sm text-muted-foreground">
              Operating presence listed publicly: {company.operatingStates.join(", ")}.
            </p>
            <p>
              <Link
                href={company.website}
                className="font-semibold text-accent underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Visit SONIL Buildcon
              </Link>
            </p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {company.sectors.map((sector) => (
              <p
                key={sector}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-[var(--shadow-sm)]"
              >
                {sector}
              </p>
            ))}
          </div>
        </Container>
      </section>
      <section className="border-y border-border mkt-band py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Principles"
            title="How we design the product"
            description="Enterprise density, field realism, and honest marketing."
          />
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <FeatureCard
              title="System of record"
              body="Incidents, LMRA, risk, permits, inspections, CAPA, statutory tracking, and ESG/BRSR views belong in one governed platform."
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
