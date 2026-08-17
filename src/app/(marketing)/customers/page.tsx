import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTASection } from "@/components/marketing/cta-section";
import { getSeoEntry, metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/customers");

export default function CustomersPage() {
  const seo = getSeoEntry("/customers");
  return (
    <>
      <PageHero
        eyebrow="Customers"
        title={seo?.h1 ?? "Customers"}
        description={seo?.description}
        primaryHref="/book-a-demo"
        primaryLabel="Book a Demo"
        compact
      />
      <section className="pb-16">
        <Container className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <p>
            Named logos, quotes and case studies will appear here only when a customer has given permission. We will not invent a social-proof row to look like a larger SaaS company.
          </p>
          <p className="mt-4">
            Until then, evaluate the live product: field capture, tenant isolation, entitlements, compliance profile, and ESG views — and talk to us about your sites.
          </p>
        </Container>
      </section>
      <CTASection primaryHref="/book-a-demo" primaryLabel="Book a Demo" />
    </>
  );
}
