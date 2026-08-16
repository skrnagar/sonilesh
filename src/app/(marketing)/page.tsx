import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  Lock,
  Radar,
  Settings2,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { ModuleCard } from "@/components/marketing/module-card";
import { IndustryCard } from "@/components/marketing/industry-card";
import { CTASection } from "@/components/marketing/cta-section";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { MobilePreview } from "@/components/marketing/mobile-preview";
import { WorkflowDiagram } from "@/components/marketing/workflow-diagram";
import { PricingCard } from "@/components/marketing/pricing-card";
import { FadeIn, Reveal } from "@/components/marketing/motion";
import {
  brand,
  industries,
  modules,
  platformPillars,
  pricingTiers,
  resources,
  trustIndustries,
} from "@/lib/marketing/content";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[var(--mkt-hero)] text-white">
        <div aria-hidden className="mkt-hero-wash pointer-events-none absolute inset-0" />
        <div aria-hidden className="mkt-grid-fade pointer-events-none absolute inset-0 opacity-80" />
        <Container className="relative grid min-h-[min(88vh,840px)] items-center gap-10 pb-20 pt-24 md:gap-12 md:pb-28 md:pt-28 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16 lg:pb-32">
          <FadeIn className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200/85">
              {brand.name} · Enterprise EHS SaaS
            </p>
            <h1 className="font-display mt-5 text-[2.35rem] font-semibold leading-[0.96] tracking-[-0.05em] sm:text-5xl md:text-[3.75rem] md:leading-[0.94]">
              {brand.tagline}
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80 md:text-xl">
              {brand.supporting} Unify incidents, risk, permits, CAPA, and analytics in one multi-tenant system of record.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="mkt-btn-safety h-12 px-6">
                <Link href="/request-demo">
                  Request demo
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/platform">Explore platform</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-white/65 sm:grid-cols-3 sm:gap-4">
              <li>Field capture to boardroom</li>
              <li>Multi-tenant by design</li>
              <li>No invented certifications</li>
            </ul>
          </FadeIn>
          <FadeIn delay={0.1} className="relative min-w-0">
            <ProductScreenshot title="SONIL EHS360 · Control board" stage>
              <DashboardPreview />
            </ProductScreenshot>
            <div className="pointer-events-none absolute -bottom-10 -left-2 hidden lg:block xl:-left-8">
              <MobilePreview className="scale-[0.88] shadow-[var(--shadow-lg)]" />
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="border-b border-border mkt-band">
        <Container className="py-8 md:py-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Built for high-risk industries
          </p>
          <div className="-mx-1 mt-5 flex gap-x-6 gap-y-2 overflow-x-auto px-1 pb-1 text-sm font-medium text-foreground/75 md:flex-wrap md:justify-center md:overflow-visible">
            {trustIndustries.map((name) => (
              <span key={name} className="shrink-0 whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section className="mkt-section">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="The problem"
              title="EHS control breaks when tools don’t connect"
              description="Spreadsheets, inbox trails, and disconnected apps leave field reality invisible to leadership — and CAPA rarely closes cleanly."
            />
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
            <FeatureCard
              icon={AlertTriangle}
              title="Fragmented capture"
              body="Incidents, near misses, and hazards live in different channels — so trends arrive late."
            />
            <FeatureCard
              icon={Workflow}
              title="Open loops"
              body="Findings don’t reliably become owned actions with verification of effectiveness."
            />
            <FeatureCard
              icon={Building2}
              title="Weak enterprise grip"
              body="Sites, contractors, and entitlements are hard to govern without a multi-tenant core."
            />
          </div>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Platform map"
              title="One system from field to boardroom"
              description="SONIL EHS360 connects capture, operations, risk, assurance, and leadership visibility."
            />
          </Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-5">
            {platformPillars.map((pillar, index) => (
              <li key={pillar.title} className="bg-background p-5 md:bg-[var(--mkt-band)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 font-display text-lg font-semibold text-primary">{pillar.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pillar.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/platform">Explore the platform</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="mkt-section">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeader
              eyebrow="Product"
              title="Operational dashboards that stay dense and useful"
              description="Track open incidents, overdue CAPA, active permits, and risk posture without toy card grids."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/features">See features</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/modules/analytics">Analytics module</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal>
            <ProductScreenshot title="SONIL EHS360 · Analytics" stage>
              <DashboardPreview />
            </ProductScreenshot>
          </Reveal>
        </Container>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-[var(--mkt-hero)] py-16 text-white md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(15,118,110,0.26),transparent_48%)]"
        />
        <Container className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeader
              tone="inverse"
              eyebrow="Field experience"
              title="Built for the people doing the work"
              description="Quick report paths for incidents, near misses, hazards, and permit checks — designed for gloves, glare, and time pressure."
            />
            <div className="mt-8">
              <Button asChild className="mkt-btn-safety h-12 px-6">
                <Link href="/field-experience">
                  Explore field
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal>
            <div className="flex justify-center lg:justify-end">
              <MobilePreview />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="mkt-section">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Lifecycle"
              title="Report → Investigate → CAPA → Verify → Close"
              description="A closed loop with ownership, evidence, and an auditable trail."
            />
          </Reveal>
          <Reveal>
            <div className="mt-12">
              <WorkflowDiagram />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container className="grid gap-16 lg:grid-cols-2">
          <Reveal>
            <SectionHeader
              eyebrow="Enterprise"
              title="Multi-tenant by design"
              description="Organization isolation, site/project scoping, RBAC, and plan-driven entitlements — ready for portfolios, not single-site tools."
            />
            <div className="mt-8 grid gap-6">
              <FeatureCard
                icon={Lock}
                title="Tenant isolation"
                body="Customer data is scoped for SaaS operations with clear admin boundaries."
              />
              <FeatureCard
                icon={Settings2}
                title="Configuration without chaos"
                body="Categories, workflows, and forms adapt to how your HSE program actually runs."
              />
            </div>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/enterprise">Enterprise overview</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal>
            <SectionHeader
              eyebrow="Analytics & AI-ready"
              title="Visibility now. Assistive intelligence when you choose it."
              description="Dashboards for leading and lagging signals. AI is framed as assistive potential — not autonomous EHS."
            />
            <div className="mt-8 grid gap-6">
              <FeatureCard
                icon={Radar}
                title="Leadership-ready analytics"
                body="Filter by site, severity, and status. Export-oriented reporting paths for reviews."
              />
              <FeatureCard
                icon={Sparkles}
                title="AI-ready foundation"
                body="Structured records and workflows create a clean base for future assistive features — without overclaiming today."
              />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="mkt-section">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Security"
              title="Serious controls. No fake certifications."
              description="Authentication, role-based access, tenant scoping, and audit-oriented trails. We don’t invent SOC 2 / ISO badges on this site."
            />
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/security">Security posture</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Solutions"
              title="Industry-shaped control"
              description="Same platform core — configured for the risks your sector actually faces."
            />
          </Reveal>
          <div className="mt-10">
            {industries.slice(0, 5).map((industry) => (
              <IndustryCard
                key={industry.slug}
                name={industry.name}
                summary={industry.summary}
                href={`/solutions/${industry.slug}`}
              />
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/solutions">View all industries</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="mkt-section">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Modules"
              title="Compose the program you need"
              description="Modules appear in each workspace only when permitted by role and entitled by subscription."
            />
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {modules.slice(0, 6).map((mod) => (
              <ModuleCard
                key={mod.slug}
                name={mod.name}
                summary={mod.summary}
                href={`/modules/${mod.slug}`}
              />
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/modules">Browse all modules</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Pricing"
              title="Commercial packaging, not fake price tags"
              description="Plans are sold through Contact Sales / Custom Enterprise engagement. No invented dollar amounts."
            />
          </Reveal>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <PricingCard key={tier.name} {...tier} />
            ))}
          </div>
        </Container>
      </section>

      <section className="mkt-section">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Resources"
              title="Guides as the product matures"
              description="Placeholder library for implementation and adoption content — no fabricated whitepapers."
            />
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {resources.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/40 motion-reduce:transition-none"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.status}
                </p>
                <h3 className="mt-2 font-display text-base font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/resources">Resources</Link>
            </Button>
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
