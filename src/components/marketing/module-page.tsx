import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { CTASection } from "@/components/marketing/cta-section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { getModule, modules } from "@/lib/marketing/content";
import { notFound } from "next/navigation";

export function ModulePage({ slug }: { slug: string }) {
  const mod = getModule(slug);
  if (!mod) notFound();

  const related = modules.filter((m) => m.slug !== mod.slug).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow="Module"
        title={mod.name}
        description={mod.summary}
        secondaryHref="/modules"
        secondaryLabel="All modules"
      >
        <ProductScreenshot title={`SONIL EHS360 · ${mod.name}`}>
          <DashboardPreview />
        </ProductScreenshot>
      </PageHero>
      <section className="py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Capabilities"
            title={`What ${mod.name} delivers`}
            description="Configured per tenant, entitled by plan, and governed by role-based access."
          />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {mod.capabilities.map((cap) => (
              <FeatureCard key={cap} title={cap} body="Available in the customer workspace when entitled." />
            ))}
          </div>
        </Container>
      </section>
      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <SectionHeader
            eyebrow="Related"
            title="Works better as a system"
            description="EHS control compounds when modules share ownership, evidence, and closure."
          />
          <ul className="mt-8 grid gap-3 md:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/modules/${item.slug}`}
                  className="block rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-primary transition-colors hover:border-accent/40 hover:bg-muted/40"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
