import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { CTASection } from "@/components/marketing/cta-section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { getModule } from "@/lib/marketing/content";
import { getProductPage } from "@/lib/marketing/product-routes";
import { getSeoEntry } from "@/lib/marketing/seo";

const NARRATIVE: Record<string, { problem: string; how: string; capabilities: string[] }> = {
  "contractor-management": {
    problem:
      "Owner–EPC–subcontractor interfaces lose permits, inductions and incidents in WhatsApp groups. Buyers then get sold a ‘contractor OS’ that is really a company list.",
    how: "EHS360 has a contractor company register (name, status, safety score, insurance date) on the same tenant as incidents and permits. Contractor names appear on permit records. That is what ships today. Induction packs, document vaults, blacklists and a contractor field portal are not marketed as complete.",
    capabilities: [
      "Organisation-scoped contractor company records",
      "Status, safety score and insurance expiry on the register",
      "Contractor name on permits and related events",
      "Honest gap: not a full contractor onboarding or gate-pass product yet",
    ],
  },
  "compliance-tracking": {
    problem:
      "Statutory calendars live in legal’s mailbox while incidents live in HSE’s spreadsheet. Filings get missed because the people who see the plant are not the people who own the obligation.",
    how: "EHS360 keeps a compliance profile and obligation tracking in the same organisation as EHS events. Applicability is evaluated from organisation facts — listing, size bands, waste streams, EU export — using the same rule engine as the in-app compliance workspace. This page does not claim we file returns with CPCB or MCA on your behalf.",
    capabilities: [
      "Organisation compliance profile (sector, listing, size, waste streams)",
      "Obligation tracking beside EHS operations",
      "Same tenant isolation and RBAC as the rest of the platform",
      "Entitlement-gated: the module appears when the plan includes it",
    ],
  },
  "esg-brsr-reporting": {
    problem:
      "BRSR and customer ESG questionnaires ask for injury, training and environmental numbers that already exist in EHS — then someone re-keys them into a workbook the assurer does not trust.",
    how: "EHS360’s ESG workspace is built to sit on the same tenant data as incidents and hours, including BRSR-oriented views when entitled. We do not claim SEBI filing, automatic assurance, or a complete GHG inventory from marketing copy. What we claim is one organisation record instead of two stacks.",
    capabilities: [
      "ESG metrics and BRSR-oriented reporting views (when entitled)",
      "Links from operational EHS records rather than a parallel database",
      "Materiality and committee records in the ESG area of the product",
      "Honest gaps: assurance providers and secretarial narrative still sit outside the software",
    ],
  },
};

export function ProductModulePage({ slug }: { slug: string }) {
  const product = getProductPage(slug);
  const seo = getSeoEntry(`/product/${slug}`);
  if (!product || !seo) notFound();

  const primary = product.moduleSlug ? getModule(product.moduleSlug) : null;
  const extra = product.extraModuleSlug ? getModule(product.extraModuleSlug) : null;
  const narrative = NARRATIVE[slug];

  return (
    <>
      <PageHero
        eyebrow="Product"
        title={seo.h1}
        description={seo.description}
        primaryHref="/book-a-demo"
        primaryLabel="Book a Demo"
        secondaryHref="/signup"
        secondaryLabel="Start Free"
      >
        <ProductScreenshot title={`EHS360 · ${product.name}`}>
          <DashboardPreview />
        </ProductScreenshot>
      </PageHero>

      {narrative ? (
        <section className="py-16 md:py-20">
          <Container className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeader eyebrow="Problem" title="What this is for" description={narrative.problem} />
            </div>
            <div>
              <SectionHeader eyebrow="How it works" title="In this platform" description={narrative.how} />
              <ul className="mt-8 space-y-3">
                {narrative.capabilities.map((item) => (
                  <li key={item}>
                    <FeatureCard title={item} />
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      ) : null}

      {primary ? (
        <section className="border-y border-border py-16 md:py-20">
          <Container>
            <SectionHeader
              eyebrow="In the product"
              title={primary.name}
              description={primary.summary}
            />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <FeatureCard title="Field" body={primary.field} />
              <FeatureCard title="Workspace" body={primary.dashboard} />
            </div>
            <ul className="mt-8 grid gap-3 md:grid-cols-2">
              {primary.capabilities.map((item) => (
                <li key={item} className="text-sm text-foreground/80">
                  {item}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {extra ? (
        <section className="py-16 md:py-20">
          <Container>
            <SectionHeader eyebrow="Also in this product area" title={extra.name} description={extra.summary} />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <FeatureCard title="Field" body={extra.field} />
              <FeatureCard title="Workspace" body={extra.dashboard} />
            </div>
          </Container>
        </section>
      ) : null}

      <section className="pb-8">
        <Container className="text-sm text-muted-foreground">
          Related:{" "}
          <Link href="/resources" className="text-accent underline-offset-4 hover:underline">
            Resources
          </Link>
          {" · "}
          <Link href="/product" className="text-accent underline-offset-4 hover:underline">
            All product areas
          </Link>
        </Container>
      </section>
      <CTASection
        title="See this area on your sites"
        description="Book a demo mapped to your industry — we will not invent a case study for a sector we have not walked."
        primaryHref="/book-a-demo"
        primaryLabel="Book a Demo"
        secondaryHref="/signup"
        secondaryLabel="Start Free"
      />
    </>
  );
}
