import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { MobilePreview } from "@/components/marketing/mobile-preview";
import { CTASection } from "@/components/marketing/cta-section";
import { Button } from "@/components/ui/button";
import { fieldModuleGroups, myZoneApps } from "@/lib/marketing/content";
import { metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/field-experience");

export default function FieldExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow="Field"
        title="Seventeen EHS modules. One My Zone hub."
        description="Field home is the EHS launchpad. My Zone launches quality, reports, BRSR, and data apps. Desktop unified header and mobile bottom tabs keep Home, Report, Actions, Permits, and Inspect within reach."
        secondaryHref="/product"
        secondaryLabel="Product overview"
      >
        <div className="flex justify-center lg:justify-end">
          <MobilePreview />
        </div>
      </PageHero>

      <section className="mkt-section">
        <Container>
          <SectionHeader
            eyebrow="Field home"
            title="What crews open in the first 30 seconds"
            description="Large tile targets, sticky full-height shell, and faster nav with progress and skeletons — designed for gloves, glare, and time pressure."
          />
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            <FeatureCard
              title="17 EHS module tiles"
              body="Incidents, near misses, hazards, LMRA, permits, inspections, training, PPE, and more — entitled per role on the field home."
            />
            <FeatureCard
              title="Desktop + mobile chrome"
              body="Unified white header on desktop; bottom tabs on mobile for Home, Report, Actions, Permits, and Inspect."
            />
            <FeatureCard
              title="Faster navigation"
              body="Route progress, skeleton loading, and optimistic tab feedback so field users spend less time waiting between screens."
            />
          </div>
        </Container>
      </section>

      <section className="border-y border-border mkt-band mkt-section">
        <Container>
          <SectionHeader
            eyebrow="Module groups"
            title="Field coverage without a desktop IA"
            description="Representative groups from the field home — not a competitor brand catalog."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {fieldModuleGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-border bg-background p-6 md:bg-card"
              >
                <h3 className="font-display text-lg font-semibold text-primary">{group.title}</h3>
                <ul className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--mkt-safety)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="mkt-section">
        <Container>
          <SectionHeader
            eyebrow="My Zone"
            title="Apps beside the EHS launchpad"
            description="My Zone is the in-field app launcher — iQuality, Reports, BRSR, Data Hub, and related tools — without leaving the field shell."
          />
          <div className="mt-10 flex flex-wrap gap-2">
            {myZoneApps.map((app) => (
              <span
                key={app}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
              >
                {app}
              </span>
            ))}
          </div>
          <p className="mt-10 text-sm text-muted-foreground">
            Marketing lives at <code className="text-foreground">/field-experience</code> because{" "}
            <code className="text-foreground">/field</code> and{" "}
            <code className="text-foreground">/field/my-zone</code> are reserved for signed-in users.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/login">Sign in to field app</Link>
            </Button>
            <Button asChild>
              <Link href="/book-a-demo">Book a Demo</Link>
            </Button>
          </div>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
