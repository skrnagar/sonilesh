import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/compare/vs-rakhsha");

export default function CompareDraftPage() {
  return (
    <>
      <PageHero
        eyebrow="Draft — not indexed"
        title="EHS360 and other EHS vendors"
        description="This comparison is unpublished until every claim can be checked against the live product. We will not ship a feature matrix we cannot defend to a compliance buyer."
        compact
      />
      <section className="pb-20">
        <Container className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <p>
            Typical search intent here is “EHS software India alternatives”. When this page is released it will cover product shape (EHS + ESG + compliance, self-serve tenancy, field app, self-host option) using only capabilities that exist in production.
          </p>
          <p className="mt-4">
            It is excluded from the sitemap, robots, and primary navigation on purpose.
          </p>
        </Container>
      </section>
    </>
  );
}
