import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { ModuleCard } from "@/components/marketing/module-card";
import { CTASection } from "@/components/marketing/cta-section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { getIndustry, modules } from "@/lib/marketing/content";
import { notFound } from "next/navigation";

export function IndustryPage({ slug }: { slug: string }) {
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const related = modules.filter((m) =>
    (industry.modules as readonly string[]).includes(m.slug),
  );

  return (
    <>
      <PageHero
        eyebrow="Industry solution"
        title={industry.name}
        description={industry.summary}
        secondaryHref="/solutions"
        secondaryLabel="All solutions"
      />
      <section className="py-16 md:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <SectionHeader
            eyebrow="Challenges"
            title={`What ${industry.name} teams wrestle with`}
            description="SONIL EHS360 is designed to replace fragmented tools with one operational control system."
          />
          <ul className="space-y-4">
            {industry.challenges.map((challenge) => (
              <li key={challenge}>
                <FeatureCard title={challenge} />
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section className="border-y border-border bg-white py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Recommended modules"
            title="Start with the controls that matter"
            description="Every deployment is entitlement-aware — modules appear when your plan and roles allow."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {related.map((mod) => (
              <ModuleCard
                key={mod.slug}
                name={mod.name}
                summary={mod.summary}
                href={`/modules/${mod.slug}`}
              />
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Looking for another vertical?{" "}
            <Link href="/solutions" className="font-medium text-accent underline-offset-4 hover:underline">
              Browse all solutions
            </Link>
            .
          </p>
        </Container>
      </section>
      <CTASection
        title={`Run ${industry.name} EHS on one platform`}
        description="Request a demo focused on your sites, contractors, and assurance model."
      />
    </>
  );
}
