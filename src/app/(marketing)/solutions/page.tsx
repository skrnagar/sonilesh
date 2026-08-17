import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { IndustryCard } from "@/components/marketing/industry-card";
import { CTASection } from "@/components/marketing/cta-section";
import { listCanonicalIndustries } from "@/lib/marketing/content";
import { getSeoEntry, metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/solutions");

export default function SolutionsPage() {
  const seo = getSeoEntry("/solutions");
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title={seo?.h1 ?? "Solutions"}
        description={seo?.description}
        compact
      />
      <section className="py-12 md:py-16">
        <Container>
          {listCanonicalIndustries().map((industry) => (
            <IndustryCard
              key={industry.slug}
              name={industry.name}
              summary={industry.summary}
              href={`/solutions/${industry.slug}`}
            />
          ))}
        </Container>
      </section>
      <CTASection primaryHref="/book-a-demo" primaryLabel="Book a Demo" />
    </>
  );
}
