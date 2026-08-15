import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { Accordion } from "@/components/marketing/accordion";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Enterprise",
  description:
    "EHS360 enterprise multi-tenant SaaS — organization isolation, RBAC, entitlements, and configuration.",
};

export default function EnterprisePage() {
  return (
    <>
      <PageHero
        eyebrow="Enterprise"
        title="Multi-tenant SaaS built for portfolios"
        description="Run many organizations and sites on one platform with isolation, plan entitlements, and audited administration."
        primaryHref="/contact"
        primaryLabel="Contact sales"
        secondaryHref="/security"
        secondaryLabel="Security"
      />

      <section className="py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Control plane"
            title="What enterprise buyers evaluate"
            description="Practical tenancy and governance — without theatre."
          />
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Organization isolation"
              body="Tenant-scoped data and clear boundaries between customer environments."
            />
            <FeatureCard
              title="Sites & projects"
              body="Operational scoping that matches how work is actually structured."
            />
            <FeatureCard
              title="RBAC"
              body="Role-based permissions across modules and sensitive actions."
            />
            <FeatureCard
              title="Entitlements"
              body="Plan-driven feature availability and usage-aware packaging."
            />
            <FeatureCard
              title="Platform admin"
              body="SaaS administration for organizations, plans, and support operations."
            />
            <FeatureCard
              title="Audit-oriented trails"
              body="Meaningful history for investigations, CAPA, and administration."
            />
          </div>
        </Container>
      </section>

      <section id="configuration" className="scroll-mt-24 border-y border-border bg-white py-16 md:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <SectionHeader
            eyebrow="Configuration"
            title="Adapt the program without forking the product"
            description="Categories, workflows, and forms can align to your HSE language and process maturity."
          />
          <Accordion
            items={[
              {
                id: "cfg-1",
                title: "Event categories",
                body: "Configure incident, near-miss, hazard, and related taxonomies to match your standards.",
              },
              {
                id: "cfg-2",
                title: "Workflow ownership",
                body: "Keep investigation and CAPA steps explicit with accountable owners and due dates.",
              },
              {
                id: "cfg-3",
                title: "Module packaging",
                body: "Entitle modules per plan so each organization sees the program they purchased.",
              },
            ]}
          />
        </Container>
      </section>

      <CTASection
        title="Talk through enterprise packaging"
        description="Contact sales for multi-site portfolios, entitlement design, and security review support."
        primaryHref="/contact"
        primaryLabel="Contact sales"
        secondaryHref="/request-demo"
        secondaryLabel="Request demo"
      />
    </>
  );
}
