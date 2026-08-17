import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTASection } from "@/components/marketing/cta-section";
import { BrsrApplicabilityForm } from "@/components/marketing/brsr-applicability-form";
import { getSeoEntry, metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/resources/brsr-applicability");

export default function BrsrApplicabilityPage() {
  const seo = getSeoEntry("/resources/brsr-applicability");
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title={seo?.h1 ?? "BRSR applicability"}
        description={seo?.description}
        primaryHref="/product/esg-brsr-reporting"
        primaryLabel="ESG & BRSR product"
        secondaryHref="/book-a-demo"
        secondaryLabel="Book a Demo"
        compact
      />
      <section className="pb-20">
        <Container className="space-y-8">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            This page uses the same applicability rules as the in-app compliance profile. The library here is the sample set shipped with that engine (BRSR, CSR-2, EPR, Factories Act, CBAM, CCTS, and a few baseline filings). It does not file with SEBI, MCA or CPCB.
          </p>
          <BrsrApplicabilityForm />
        </Container>
      </section>
      <CTASection
        title="See how this sits next to EHS records"
        description="The checker is orientation. A demo walks the entitled ESG and compliance workspaces on a real tenant."
        primaryHref="/book-a-demo"
        primaryLabel="Book a Demo"
      />
    </>
  );
}
