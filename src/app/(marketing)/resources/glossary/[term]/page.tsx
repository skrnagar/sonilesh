import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTASection } from "@/components/marketing/cta-section";
import { glossaryEntries } from "@/lib/marketing/glossary";
import { siteUrl } from "@/lib/marketing/seo";

export function generateStaticParams() {
  return glossaryEntries.map((term) => ({ term: term.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const entry = glossaryEntries.find((row) => row.slug === term);
  if (!entry) return {};
  const title = `${entry.title} | EHS360 glossary`;
  const description = entry.body.slice(0, 155).replace(/\s+\S*$/, "") + "…";
  const canonical = `${siteUrl()}/resources/glossary/${entry.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;
  const entry = glossaryEntries.find((row) => row.slug === term);
  if (!entry) notFound();

  return (
    <>
      <PageHero eyebrow="Glossary" title={entry.title} compact />
      <section className="pb-16">
        <Container className="max-w-3xl">
          <p className="text-base leading-relaxed text-foreground/90">{entry.body}</p>
          <p className="mt-6 text-sm">
            Related:{" "}
            <Link href={entry.relatedHref} className="text-accent underline-offset-4 hover:underline">
              {entry.relatedLabel}
            </Link>
            {" · "}
            <Link href="/resources" className="text-accent underline-offset-4 hover:underline">
              All resources
            </Link>
          </p>
        </Container>
      </section>
      <CTASection primaryHref="/book-a-demo" primaryLabel="Book a Demo" />
    </>
  );
}
