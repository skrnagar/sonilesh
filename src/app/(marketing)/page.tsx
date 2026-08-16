import Link from "next/link";
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
      {/* Hero — brand-first, one composition, full-bleed visual plane */}
      <section className="relative overflow-hidden bg-[var(--mkt-hero)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,rgba(31,111,139,0.5),transparent_48%),radial-gradient(ellipse_at_92%_18%,rgba(15,118,110,0.3),transparent_42%),linear-gradient(180deg,#071f2d_0%,#0b3a53_58%,#0a3044_100%)]"
        />
        <div aria-hidden className="mkt-grid-fade pointer-events-none absolute inset-0 opacity-70" />
        <Container className="relative grid min-h-[min(92vh,920px)] items-center gap-12 py-16 lg:grid-cols-[1fr_1.08fr] lg:gap-14 lg:py-20">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">
              Enterprise EHS SaaS
            </p>
            <h1 className="font-display mt-5">
              <span className="block text-[2.65rem] font-semibold leading-[0.95] tracking-[-0.045em] md:text-7xl">
                {brand.legalName}
              </span>
              <span className="mt-2 block text-[2rem] font-medium leading-none tracking-[-0.04em] text-teal-200/95 md:text-5xl">
                {brand.product}
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-xl font-medium leading-snug text-white/95 md:text-2xl">
              {brand.tagline}
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
              {brand.supporting}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[var(--mkt-safety)] text-white hover:bg-[#0d6b63]"
              >
                <Link href="/request-demo">Request demo</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </FadeIn>
          <FadeIn delay={0.12} className="relative">
            <ProductScreenshot title="SONIL EHS360 · Control board" className="lg:translate-y-2">
              <DashboardPreview />
            </ProductScreenshot>
            <div className="pointer-events-none absolute -bottom-8 -left-4 hidden md:block lg:-left-10">
              <MobilePreview className="scale-90 shadow-[var(--shadow-lg)]" />
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Trust strip — industries as text */}
      <section className="border-b border-border bg-white">
        <Container className="py-9">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Built for high-risk industries
          </p>
          <p className="mt-4 text-center text-sm leading-relaxed text-foreground/80 md:text-base">
            {trustIndustries.join(" · ")}
          </p>
        </Container>
      </section>

      {/* Problem */}
      <section className="py-16 md:py-24">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="The problem"
              title="EHS control breaks when tools don’t connect"
              description="Spreadsheets, inbox trails, and disconnected apps leave field reality invisible to leadership — and CAPA rarely closes cleanly."
            />
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
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

      {/* Platform overview map */}
      <section className="border-y border-border bg-white py-16 md:py-24">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Platform map"
              title="One system from field to boardroom"
              description="SONIL EHS360 connects capture, operations, risk, assurance, and leadership visibility."
            />
          </Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5">
            {platformPillars.map((pillar, index) => (
              <li key={pillar.title} className="bg-background p-5 md:bg-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-lg font-semibold text-primary">{pillar.title}</p>
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

      {/* Product showcases */}
      <section className="py-16 md:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
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
            <ProductScreenshot title="SONIL EHS360 · Analytics">
              <DashboardPreview />
            </ProductScreenshot>
          </Reveal>
        </Container>
      </section>

      {/* Field experience */}
      <section className="relative overflow-hidden border-y border-border bg-[#0b3a53] py-16 text-white md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(15,118,110,0.28),transparent_45%)]"
        />
        <Container className="relative grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeader
              tone="inverse"
              eyebrow="Field experience"
              title="Built for the people doing the work"
              description="Quick report paths for incidents, near misses, hazards, and permit checks — designed for gloves, glare, and time pressure."
            />
            <div className="mt-8">
              <Button
                asChild
                className="bg-[var(--mkt-safety)] text-white hover:bg-[#0d6b63]"
              >
                <Link href="/field-experience">Explore field</Link>
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

      {/* Workflow lifecycle */}
      <section className="py-16 md:py-24">
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

      {/* Multi-tenant + configuration */}
      <section className="border-y border-border bg-white py-16 md:py-24">
        <Container className="grid gap-12 lg:grid-cols-2">
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

      {/* Security */}
      <section className="py-16 md:py-24">
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

      {/* Industries */}
      <section className="border-y border-border bg-white py-16 md:py-24">
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

      {/* Modules teaser */}
      <section className="py-16 md:py-24">
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

      {/* Pricing teaser */}
      <section className="border-y border-border bg-white py-16 md:py-24">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Pricing"
              title="Commercial packaging, not fake price tags"
              description="Plans are sold through Contact Sales / Custom Enterprise engagement. No invented dollar amounts."
            />
          </Reveal>
          <div className="mt-10 grid gap-3 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <PricingCard key={tier.name} {...tier} />
            ))}
          </div>
        </Container>
      </section>

      {/* Resources teaser */}
      <section className="py-16 md:py-24">
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
                className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent/40"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {item.status}
                </p>
                <h3 className="mt-2 text-base font-semibold text-primary">{item.title}</h3>
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
