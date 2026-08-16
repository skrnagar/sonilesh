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
  buyerAudiences,
  company,
  executionPillars,
  industries,
  modules,
  platformPillars,
  pricingTiers,
  productFacts,
  resources,
} from "@/lib/marketing/content";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[var(--mkt-hero)] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mkt-hero-wash absolute inset-0" />
          <div className="mkt-grid-fade absolute inset-0 opacity-80" />
        </div>
        <Container className="relative grid items-start gap-8 py-14 md:gap-10 md:py-20 lg:min-h-[min(78vh,760px)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:py-24">
          <FadeIn className="max-w-xl min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200 sm:tracking-[0.22em]">
              {brand.name} · From SONIL Buildcon, Indore
            </p>
            <h1 className="font-display mt-4 text-[2.05rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:mt-5 sm:text-5xl sm:leading-[0.96] md:text-[3.75rem] md:leading-[0.94]">
              {brand.tagline}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 sm:mt-5 sm:text-lg md:text-xl">
              {brand.supporting} Incidents, LMRA, permits, inspections, CAPA, and analytics in one system of record — field crews and HSE leads on the same data.
            </p>
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg" variant="safety" className="h-12 min-h-12 px-6">
                <Link href="/request-demo">
                  Request demo
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 min-h-12 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/platform">Explore platform</Link>
              </Button>
            </div>
            <ul className="mt-7 grid gap-2 text-sm text-white/75 sm:mt-8 sm:grid-cols-3 sm:gap-4">
              <li>LMRA at the workfront</li>
              <li>CAPA that actually closes</li>
              <li>No invented certifications</li>
            </ul>
          </FadeIn>
          <FadeIn delay={0.1} className="relative min-w-0">
            <div className="relative pb-4 lg:pb-8 lg:pl-10 xl:pl-16">
              <ProductScreenshot title="SONIL EHS360 · Control board" stage>
                <DashboardPreview />
              </ProductScreenshot>
              <div className="pointer-events-none relative z-10 mx-auto mt-5 w-fit lg:absolute lg:bottom-0 lg:left-0 lg:mx-0 lg:mt-0">
                <MobilePreview className="scale-[0.92] shadow-[var(--shadow-lg)] lg:origin-bottom-left lg:scale-[0.78] xl:scale-[0.86]" />
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="border-b border-border mkt-band">
        <Container className="py-8 md:py-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Built beside civil EPC execution — not a generic office-safety template
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {buyerAudiences.map((name) => (
              <span
                key={name}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-6 mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            Parent company {company.parent} ({company.legalEntity}) executes transmission, substation, solar civil, telecom, and industrial foundations from {company.hq}. Public site: toolbox talks, PPE, and a zero-harm HSE culture — the same work SONIL EHS360 is built to record.{" "}
            <Link href="/about" className="font-medium text-accent underline-offset-4 hover:underline">
              About the company
            </Link>
          </p>
        </Container>
      </section>

      <section className="mkt-section">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="At a glance"
              title="A product you can actually operate"
              description="Facts about SONIL EHS360 — not invented injury rates, customer logos, or certifications."
            />
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {productFacts.map((fact) => (
              <div key={fact.label} className="bg-background p-6 md:bg-[var(--mkt-band)]">
                <p className="font-display text-3xl font-semibold tracking-tight text-primary">{fact.value}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{fact.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{fact.detail}</p>
              </div>
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
              description="Spreadsheets, WhatsApp trails, and disconnected apps leave site reality invisible to leadership — and CAPA rarely closes with verified effectiveness."
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
              title="One system from workfront to control room"
              description="SONIL EHS360 connects field capture, operations, risk, assurance, and leadership visibility — the same loop commercial EHS programs expect."
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
              eyebrow="Control room"
              title="Dashboards that match site reality"
              description="Open incidents, overdue CAPA, active permits, and risk posture — dense enough for HSE, clear enough for package leadership."
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
              description="Incidents, near misses, hazards, LMRA, and permit checks — designed for gloves, glare, and time pressure on transmission, solar, and plant sites."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="mkt-btn-safety h-12 px-6">
                <Link href="/field-experience">
                  Explore field
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/request-demo">Request demo</Link>
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
              eyebrow="How control executes"
              title="Report → Investigate → CAPA → Verify → Close"
              description="A closed loop with ownership, evidence, and an auditable trail — from LMRA at the task to verified CAPA in the workspace."
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
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Why SONIL"
              title="Four pillars of EHS execution"
              description="Software language aligned to SONIL Buildcon’s execution culture — safety, discipline, depth, and transparency — without copying their site or inventing proof."
            />
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {executionPillars.map((pillar) => (
              <FeatureCard key={pillar.title} title={pillar.title} body={pillar.body} />
            ))}
          </div>
        </Container>
      </section>

      <section className="mkt-section">
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
              title="Shaped for India’s critical sectors"
              description="Same multi-tenant core — configured for construction, EPC packages, power corridors, renewables, plants, and industrial sites."
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
              title="Every control, from field to dashboard"
              description="Professional EHS modules — incidents, LMRA and risk, e-PTW, inspections, CAPA, contractors — entitled per tenant, governed by role."
            />
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {modules.slice(0, 6).map((mod) => (
              <ModuleCard
                key={mod.slug}
                name={mod.name}
                summary={mod.summary}
                field={mod.field}
                dashboard={mod.dashboard}
                href={`/modules/${mod.slug}`}
              />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/modules">Browse all modules</Link>
            </Button>
            <Button asChild>
              <Link href="/request-demo">Request a walkthrough</Link>
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
              description="Team, Business, and Enterprise — sold through Contact Sales. No invented dollar amounts, logos, or G2 badges."
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
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition-colors hover:border-accent/40 motion-reduce:transition-none"
              >
                <p className="inline-flex rounded-full bg-[var(--mkt-safety)]/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--mkt-safety)]">
                  {item.status}
                </p>
                <h3 className="mt-3 font-display text-base font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm text-foreground/80">{item.body}</p>
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
