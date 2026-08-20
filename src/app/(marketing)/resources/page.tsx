import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTASection } from "@/components/marketing/cta-section";
import { ResourceCard } from "@/components/marketing/resource-card";
import { glossaryEntries } from "@/lib/marketing/glossary";
import { resourceCategories, resourcesForCategory } from "@/lib/marketing/content";
import { getSeoEntry, metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/resources");

function categoryAnchor(category: string) {
  return category.toLowerCase().replace(/\s+/g, "-");
}

export default function ResourcesPage() {
  const seo = getSeoEntry("/resources");

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title={seo?.h1 ?? "Resources"}
        description={
          seo?.description ??
          "Guides, tools, glossary, and product documentation — Available only when content or function exists."
        }
        compact
      />
      <section className="py-12 md:py-16">
        <Container className="space-y-14">
          {resourceCategories.map((category) => {
            const items = resourcesForCategory(category);
            if (!items.length) return null;
            const anchor = categoryAnchor(category);
            return (
              <div key={category} id={anchor} className="scroll-mt-28">
                <h2 className="font-display text-lg font-semibold">{category}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {category === "Guides"
                    ? "Implementation, field adoption, CAPA, and leadership analytics — published playbooks only."
                    : null}
                  {category === "Tools"
                    ? "Interactive checkers backed by the same rules as the product engine."
                    : null}
                  {category === "Glossary"
                    ? "Short definitions for terms buyers actually search."
                    : null}
                  {category === "Product Documentation"
                    ? "Live product surfaces and posture pages. Enterprise API docs arrive in Phase 16B."
                    : null}
                </p>
                <ul className="mt-4 grid gap-4 md:grid-cols-2">
                  {items.map((resource) => (
                    <li key={resource.id}>
                      <ResourceCard resource={resource} variant="hub" />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div id="glossary-terms" className="scroll-mt-28">
            <h2 className="font-display text-lg font-semibold">Glossary terms</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Distinct definitions — not mail-merged stubs. Also linked from the Glossary cards above.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {glossaryEntries.map((term) => (
                <li key={term.slug}>
                  <Link
                    href={`/resources/glossary/${term.slug}`}
                    className="inline-flex rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    {term.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
      <CTASection primaryHref="/book-a-demo" primaryLabel="Book a Demo" />
    </>
  );
}
