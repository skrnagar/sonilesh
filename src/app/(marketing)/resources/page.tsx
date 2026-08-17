import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTASection } from "@/components/marketing/cta-section";
import { listResourcePosts } from "@/lib/marketing/mdx";
import { glossaryEntries } from "@/lib/marketing/glossary";
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
        description={seo?.description}
        compact
      />
      <section className="py-12 md:py-16">
        <Container className="space-y-12">
          <div>
            <h2 className="font-display text-lg font-semibold">Tools</h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              <li className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mkt-safety)]">
                  Checker
                </p>
                <Link href="/resources/brsr-applicability" className="mt-2 block font-display text-xl font-semibold text-primary">
                  BRSR applicability
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">
                  Same listed-company rules as the in-app engine. Orientation, not legal advice.
                </p>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Guides</h2>
            {posts.length ? (
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {posts.map((post) => (
                  <li key={post.slug} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mkt-safety)]">
                      {post.category}
                    </p>
                    <Link href={`/resources/${post.slug}`} className="mt-2 block font-display text-xl font-semibold text-primary">
                      {post.title}
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {post.readingMinutes} min · {post.author}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Pillar guides will publish here as they are written (BRSR, EHS checklists, indicators). We will not fill this grid with placeholder whitepapers.
              </p>
            )}
          </div>
          <div>
            <h2 id="glossary" className="scroll-mt-28 font-display text-lg font-semibold">Glossary</h2>
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
