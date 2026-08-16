import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { IndustryCard } from "@/components/marketing/industry-card";
import { CTASection } from "@/components/marketing/cta-section";
import { industries } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "SONIL EHS360 industry solutions for construction, EPC, energy, manufacturing, oil & gas, mining, and more.",
};

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Industry-shaped EHS control"
        description="One platform core, configured for construction, EPC packages, power corridors, renewables, plants, and industrial sites — including LMRA at the workfront."
        compact
      />
      <section className="py-12 md:py-16">
        <Container>
          {industries.map((industry) => (
            <IndustryCard
              key={industry.slug}
              name={industry.name}
              summary={industry.summary}
              href={`/solutions/${industry.slug}`}
            />
          ))}
        </Container>
      </section>
      <CTASection />
    </>
  );
}
