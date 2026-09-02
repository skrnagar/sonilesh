import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { ModuleCard } from "@/components/marketing/module-card";
import { CTASection } from "@/components/marketing/cta-section";
import { getModule, architectureSteps } from "@/lib/marketing/content";
import { PRODUCT_PAGES } from "@/lib/marketing/product-routes";
import { getSeoEntry, metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/product");

export default function ProductHubPage() {
  const seo = getSeoEntry("/product");
  return (
    <>
      <PageHero
        eyebrow="Product"
        title={seo?.h1 ?? "Product"}
        description={seo?.description}
        primaryHref="/book-a-demo"
        primaryLabel="Book a Demo"
        secondaryHref="/signup"
        secondaryLabel="Start Free"
        compact
      />
      <section className="mkt-section">
        <Container>
          <ol className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {architectureSteps.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
                <p className="mkt-eyebrow text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-3 font-display text-base font-semibold text-primary">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_PAGES.map((page) => {
              const mod = page.moduleSlug ? getModule(page.moduleSlug) : null;
              return (
                <ModuleCard
                  key={page.slug}
                  name={page.name}
                  summary={mod?.summary ?? getSeoEntry(`/product/${page.slug}`)?.description ?? ""}
                  field={mod?.field ?? "Configured per tenant when the feature is entitled."}
                  dashboard={mod?.dashboard ?? "Workspace views stay inside the organisation boundary."}
                  href={`/product/${page.slug}`}
                />
              );
            })}
          </div>
        </Container>
      </section>
      <CTASection primaryHref="/book-a-demo" primaryLabel="Book a Demo" secondaryHref="/signup" secondaryLabel="Start Free" />
    </>
  );
}
