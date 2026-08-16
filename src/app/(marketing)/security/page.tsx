import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { Accordion } from "@/components/marketing/accordion";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Security",
  description:
    "SONIL EHS360 security posture: authentication, RBAC, tenant isolation, and audit trails — without fake certification badges.",
};

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Controls you can inspect — claims we won’t invent"
        description="SONIL EHS360 emphasizes authentication, authorization, tenant scoping, and auditable operations. This page does not display fake SOC 2, ISO, or GDPR certification badges."
        primaryHref="/contact"
        primaryLabel="Contact sales"
        secondaryHref="/enterprise"
        secondaryLabel="Enterprise"
      />

      <section className="py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Posture"
            title="What we focus on in the product"
            description="Security language tied to real platform mechanisms — not marketing stickers."
          />
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Authentication"
              body="Signed-in access to workspace, admin, and field surfaces through the existing auth flows."
            />
            <FeatureCard
              title="Authorization"
              body="Role-based access so sensitive modules and actions stay appropriately gated."
            />
            <FeatureCard
              title="Tenant scoping"
              body="Organization isolation as a first-class SaaS concern across customer data."
            />
            <FeatureCard
              title="Operational auditability"
              body="Records and administrative actions designed to leave a meaningful trail."
            />
            <FeatureCard
              title="Least privilege packaging"
              body="Entitlements and roles help limit what each user can reach."
            />
            <FeatureCard
              title="Responsible disclosure path"
              body="Use Contact to reach the team for security conversations and reviews."
            />
          </div>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container className="grid gap-10 lg:grid-cols-2">
          <SectionHeader
            eyebrow="Clarity"
            title="Questions buyers usually ask"
            description="Straight answers without certificate theatre."
          />
          <Accordion
            items={[
              {
                id: "sec-1",
                title: "Do you list SOC 2 / ISO badges here?",
                body: "No. We will not publish certification claims on the marketing site unless and until they are real and approved for public use.",
              },
              {
                id: "sec-2",
                title: "How is customer data separated?",
                body: "The platform is multi-tenant with organization-scoped access patterns. Detailed architecture discussions are available through sales/security review.",
              },
              {
                id: "sec-3",
                title: "Can we review controls?",
                body: "Yes — contact sales to schedule a security-oriented walkthrough appropriate to your procurement process.",
              },
            ]}
          />
        </Container>
      </section>

      <CTASection
        primaryHref="/contact"
        primaryLabel="Contact sales"
        secondaryHref="/request-demo"
        secondaryLabel="Request demo"
      />
    </>
  );
}
