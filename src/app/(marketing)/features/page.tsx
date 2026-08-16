import type { Metadata } from "next";
import {
  ClipboardCheck,
  Gauge,
  Layers3,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { CTASection } from "@/components/marketing/cta-section";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";

export const metadata: Metadata = {
  title: "Features",
  description:
    "SONIL EHS360 features spanning field capture, investigations, CAPA, RBAC, analytics, and multi-tenant administration.",
};

const features = [
  {
    icon: Smartphone,
    title: "Field-first capture",
    body: "Report incidents, near misses, hazards, and checks quickly from the field experience.",
  },
  {
    icon: ClipboardCheck,
    title: "Investigation & CAPA",
    body: "Move from event to owned actions with verification — not orphaned findings.",
  },
  {
    icon: Layers3,
    title: "Modular entitlements",
    body: "Turn capabilities on per plan and organization without forking the product.",
  },
  {
    icon: Users,
    title: "RBAC that matches reality",
    body: "Roles and permissions govern what people can see and change across sites.",
  },
  {
    icon: Gauge,
    title: "Operational analytics",
    body: "Dashboards for open work, overdue actions, severity, and site performance.",
  },
  {
    icon: Shield,
    title: "Enterprise tenancy",
    body: "Organization isolation with admin controls for plans, usage, and support.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Capabilities across the EHS lifecycle"
        description="A practical feature set for programs that need control — not another dashboard wallpaper."
        secondaryHref="/modules"
        secondaryLabel="Browse modules"
      >
        <ProductScreenshot>
          <DashboardPreview />
        </ProductScreenshot>
      </PageHero>
      <section className="py-16 md:py-20">
        <Container>
          <SectionHeader
            eyebrow="Capability map"
            title="What teams use every week"
            description="Designed for HSE, operations, and leadership — with density over decoration."
          />
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
