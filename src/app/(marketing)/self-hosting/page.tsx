import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { FeatureCard } from "@/components/marketing/feature-card";
import { CTASection } from "@/components/marketing/cta-section";
import { getSeoEntry, metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/self-hosting");

export default function SelfHostingPage() {
  const seo = getSeoEntry("/self-hosting");
  return (
    <>
      <PageHero
        eyebrow="Enterprise deployment"
        title={seo?.h1 ?? "Self-hosting"}
        description={seo?.description}
        primaryHref="/book-a-demo"
        primaryLabel="Talk to sales"
        secondaryHref="/security"
        secondaryLabel="Security"
      />
      <section className="py-16">
        <Container className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Cloud SaaS"
            body="The default: one EHS360 codebase, many organisations, plan entitlements, and tenant isolation in the hosted environment."
          />
          <FeatureCard
            title="Privately operated instance"
            body="EHS360 supports a self-hosted deployment mode for enterprises that must run the application in infrastructure they control. This is scoped commercially — there is no public one-click installer on this website."
          />
          <FeatureCard
            title="What we will not claim"
            body="We do not publish fake uptime SLAs, unnamed ‘air-gapped certifications’, or a self-serve marketplace listing. If you need private deployment, book a demo and we will talk architecture honestly."
          />
        </Container>
      </section>
      <CTASection
        title="Discuss enterprise deployment"
        description="Cloud or privately operated — same product model, different operating envelope."
        primaryHref="/book-a-demo"
        primaryLabel="Book a Demo"
      />
    </>
  );
}
