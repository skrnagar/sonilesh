import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { WorkflowDiagram } from "@/components/marketing/workflow-diagram";
import { CTASection } from "@/components/marketing/cta-section";
import { Accordion } from "@/components/marketing/accordion";
import { Button } from "@/components/ui/button";
import { platformPillars } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "EHS360 platform overview — field capture, operations workspace, risk, assurance, and leadership analytics.",
};

export default function PlatformPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform"
        title="Complete EHS control on one SaaS foundation"
        description="From mobile field capture to multi-tenant administration and leadership analytics — without stitching five tools together."
        secondaryHref="/field-experience"
        secondaryLabel="Field experience"
      >
        <ProductScreenshot>
          <DashboardPreview />
        </ProductScreenshot>
      </PageHero>

      <section className="py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Architecture of work"
            title="Five connected planes"
            description="Each plane shares identity, entitlements, and evidence — so closure is real."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {platformPillars.map((p) => (
              <FeatureCard key={p.title} title={p.title} body={p.body} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-white py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Lifecycle"
            title="Closed-loop by default"
            description="Reporting is only the start. Investigation, CAPA, verification, and closure stay in one system of record."
          />
          <div className="mt-10">
            <WorkflowDiagram />
          </div>
        </Container>
      </section>

      <section id="ai-ready" className="scroll-mt-24 py-16 md:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <SectionHeader
            eyebrow="AI-ready"
            title="Assistive potential on structured data"
            description="EHS360 keeps records structured and workflows explicit so assistive features can be introduced responsibly. We do not claim autonomous safety decisions."
          />
          <Accordion
            items={[
              {
                id: "ai-1",
                title: "What “AI-ready” means here",
                body: "Clean event schemas, ownership, and evidence create a foundation for future summarization or triage assistance — always under human control.",
              },
              {
                id: "ai-2",
                title: "What we will not claim",
                body: "No promises that AI replaces HSE judgment, automatically closes investigations, or certifies compliance on its own.",
              },
              {
                id: "ai-3",
                title: "Where to go next",
                body: "Review Security for access controls and Enterprise for tenancy, RBAC, and configuration depth.",
              },
            ]}
          />
        </Container>
        <Container className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/security">Security</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/enterprise">Enterprise</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/modules">Modules</Link>
          </Button>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
