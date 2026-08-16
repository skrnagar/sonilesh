import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { MobilePreview } from "@/components/marketing/mobile-preview";
import { CTASection } from "@/components/marketing/cta-section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Field Experience",
  description:
    "SONIL EHS360 field experience for fast incident, LMRA, permit, and inspection capture where work happens.",
};

export default function FieldExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow="Field"
        title="Capture that keeps pace with the job"
        description="A focused field experience for supervisors and crews — incident, near miss, and LMRA (last minute risk assessment) capture, clear severity, and less form friction. Product field UI remains at /field for signed-in users."
        secondaryHref="/platform"
        secondaryLabel="Platform overview"
      >
        <div className="flex justify-center lg:justify-end">
          <MobilePreview />
        </div>
      </PageHero>

      <section className="mkt-section">
        <Container>
          <SectionHeader
            eyebrow="Designed for the site"
            title="What field users need in the first 30 seconds"
            description="Fewer screens. Strong defaults. Enough structure for investigations later."
          />
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            <FeatureCard
              title="Field capture paths"
              body="Incident, near miss, LMRA (last minute risk assessment), permit checks, and related inspections without navigating a full desktop IA."
            />
            <FeatureCard
              title="Context that travels"
              body="Location, severity, and evidence attach early so operations can act without re-keying."
            />
            <FeatureCard
              title="Hands-on ergonomics"
              body="Large targets, clear status, and a layout that works under time pressure."
            />
          </div>
          <p className="mt-12 text-sm text-muted-foreground">
            Note: Marketing lives at <code className="text-foreground">/field-experience</code> because{" "}
            <code className="text-foreground">/field</code> is reserved for the authenticated field app.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/login">Sign in to field app</Link>
            </Button>
          </div>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
