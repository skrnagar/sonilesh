import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTASection } from "@/components/marketing/cta-section";
import { getResourcePost, listResourcePosts } from "@/lib/marketing/mdx";
import { siteUrl } from "@/lib/marketing/seo";

export function generateStaticParams() {
  return listResourcePosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getResourcePost(slug);
  if (!post || post.draft) return { robots: { index: false, follow: false } };
  const canonical = `${siteUrl()}/resources/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    openGraph: { title: post.title, description: post.description, url: canonical, type: "article" },
  };
}

export default async function ResourcePostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getResourcePost(slug);
  if (!post || post.draft) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": "Organization", name: post.author },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow={post.category}
        title={post.title}
        description={post.description}
        compact
      />
      <article className="pb-16">
        <Container className="prose prose-neutral max-w-3xl dark:prose-invert">
          <p className="text-xs text-muted-foreground">
            {post.publishedAt} · {post.readingMinutes} min read · {post.author}
          </p>
          <MDXRemote source={post.content} />
        </Container>
      </article>
      <CTASection primaryHref="/book-a-demo" primaryLabel="Book a Demo" />
    </>
  );
}
