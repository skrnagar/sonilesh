import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { ModuleCard } from "@/components/marketing/module-card";
import { CTASection } from "@/components/marketing/cta-section";
import { modules } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Modules",
  description:
    "SONIL EHS360 modules for incidents, risk, permits, inspections, audits, CAPA, training, contractors, PPE, documents, and analytics.",
};

export default function ModulesHubPage() {
  return (
    <>
      <PageHero
        eyebrow="Modules"
        title="Compose a complete EHS program"
        description="Modules are entitlement-aware and role-governed — available in each tenant only when your plan and permissions allow."
        compact
      />
      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <ModuleCard
                key={mod.slug}
                name={mod.name}
                summary={mod.summary}
                href={`/modules/${mod.slug}`}
              />
            ))}
          </div>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
