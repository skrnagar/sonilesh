import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTASection } from "@/components/marketing/cta-section";
import { ResourceCard } from "@/components/marketing/resource-card";
import { listResourcePosts } from "@/lib/marketing/mdx";
import { glossaryEntries } from "@/lib/marketing/glossary";
import { resourceCategories, resourcesForCategory } from "@/lib/marketing/content";
import { getSeoEntry, metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/resources");

export default function ResourcesPage() {
  const seo = getSeoEntry("/resources");
  const posts = listResourcePosts();

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title={seo?.h1 ?? "Resources"}
        description={
          seo?.description ??
          "Practical tools and guidance for EHS teams — only what is implemented in the product today."
        }
        compact
      />
      <section className="py-12 md:py-16">
        <Container className="space-y-12">
          {resourceCategories.map((category) => {
            const items = resourcesForCategory(category);
            if (!items.length) return null;
            return (
              <div key={category}>
                <h2 className="font-display text-lg font-semibold">{category}</h2>
                <ul className="mt-4 grid gap-4 md:grid-cols-2">
                  {items.map((resource) => (
                    <li key={resource.id}>
                      <ResourceCard resource={resource} variant="hub" />
                    </li>
                  ))}
                </ul>
                {category === "Guides" && !posts.length ? (
                  <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                    Long-form pillar guides will publish here as they are written. We will not fill this
                    grid with placeholder whitepapers.
                  </p>
                ) : null}
              </div>
            );
          })}

          {posts.length ? (
            <div>
              <h2 className="font-display text-lg font-semibold">Published guides</h2>
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {posts.map((post) => (
                  <li key={post.slug} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mkt-safety)]">
                      {post.category}
                    </p>
                    <Link
                      href={`/resources/${post.slug}`}
                      className="mt-2 block font-display text-xl font-semibold text-primary"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {post.readingMinutes} min · {post.author}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h2 id="glossary" className="scroll-mt-28 font-display text-lg font-semibold">
              Glossary terms
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Short, distinct definitions for terms buyers actually search — not mail-merged stubs.
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
