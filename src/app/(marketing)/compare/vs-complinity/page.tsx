import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/compare/vs-complinity");

export default function CompareComplinityDraftPage() {
  return (
    <>
      <PageHero
        eyebrow="Draft — not indexed"
        title="EHS360 and statutory-compliance vendors"
        description="Complinity-class buyers often search for secretarial and statutory tracking. This draft stays unpublished until we can describe overlap and difference without overclaiming EHS360’s compliance module."
        compact
      />
      <section className="pb-20">
        <Container className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <p>
            Directionally, EHS360 is an EHS operations system with ESG/BRSR and obligation tracking in the same tenant — not a full secretarial compliance suite. The public comparison will say that plainly when it ships.
          </p>
          <p className="mt-4">Excluded from navigation and search indexing until reviewed.</p>
        </Container>
      </section>
    </>
  );
}
