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
import { IndustryCard } from "@/components/marketing/industry-card";
import { CTASection } from "@/components/marketing/cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { AdoptionLoop } from "@/components/marketing/adoption-loop";
import { LazyPricingBoard, LazyWorkflowDiagram } from "@/components/marketing/lazy-previews";
import { MobilePreview } from "@/components/marketing/mobile-preview";
import { ResourceCard } from "@/components/marketing/resource-card";
import { ModuleBento } from "@/components/marketing/module-bento";
import { ControlRoomVisuals } from "@/components/marketing/charts/lazy";
import { Reveal, Stagger } from "@/components/marketing/reveal";
import { metadataForPath } from "@/lib/marketing/seo";
import {
  architectureSteps,
  company,
  executionPillars,
  listCanonicalIndustries,
  productFacts,
  resources,
} from "@/lib/marketing/content";

export const metadata = metadataForPath("/");

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section id="mkt-after-hero" className="scroll-mt-16 border-b border-border mkt-band md:scroll-mt-20">
        <Container className="py-8 md:py-10">
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
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
              eyebrow="The problem"
              title="EHS, ESG and compliance break when the stacks don’t connect"
              description="Spreadsheets, WhatsApp trails, and a separate sustainability workbook leave site reality invisible — and filings get re-keyed from numbers nobody can audit back to the event."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
              title="Parallel reporting stacks"
              body="Statutory calendars and ESG questionnaires sit outside the EHS record — two systems, one set of facts."
            />
          </div>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="How teams adopt"
              title="Capture → Own → Verify → Report"
              description="A plain-language loop from workfront logging to leadership-ready reporting — without re-keying into a separate sustainability workbook."
            />
          </Reveal>
          <div className="mt-12">
            <AdoptionLoop />
          </div>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Platform"
              title="Identify → Assess → Control → Act → Comply → Report → Analyze"
              description="One configurable loop from workfront capture to statutory tracking, ESG/BRSR views, and leadership analytics — not three disconnected products."
            />
          </Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-7">
            {architectureSteps.map((step, index) => (
              <li key={step.title} className="bg-background p-5 md:bg-[var(--mkt-band)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 font-display text-lg font-semibold text-primary">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/product">Explore the platform</Link>
            </Button>
          </div>
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
                <p className="mkt-kpi text-primary">{fact.value}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{fact.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{fact.detail}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Product"
              title="Every control, from field to filing"
              description="EHS modules plus compliance tracking and ESG/BRSR — entitled per tenant, governed by role. Contractor management is a company register today, not a full contractor OS."
            />
          </Reveal>
          <div className="mt-10">
            <ModuleBento />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/product">Browse product</Link>
            </Button>
            <Button asChild>
              <Link href="/book-a-demo">Book a Demo</Link>
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
                <Link href="/product">See product</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/product/inspections-audits">Analytics module</Link>
              </Button>
            </div>
          </Reveal>
          <ControlRoomVisuals />
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
                <Link href="/book-a-demo">Book a Demo</Link>
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
          <div className="mt-12">
            <LazyWorkflowDiagram />
          </div>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Why SONIL"
              title="Four pillars of execution"
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
              title="Multi-tenant by design — self-hosting as an option"
              description="Organization isolation, site/project scoping, RBAC, and plan-driven entitlements. Cloud SaaS is the default; a privately operated instance is scoped commercially."
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
                body="Categories, workflows, and forms adapt to how your HSE and compliance program actually runs."
              />
            </div>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/self-hosting">Self-hosting</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal>
            <SectionHeader
              eyebrow="Analytics & AI-ready"
              title="Visibility now. Assistive intelligence when you choose it."
              description="Dashboards for leading and lagging signals. AI is framed as assistive potential — not autonomous EHS or auto-filed BRSR."
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
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2">
            {listCanonicalIndustries().map((industry) => (
              <IndustryCard
                key={industry.slug}
                name={industry.name}
                summary={industry.summary}
                href={`/solutions/${industry.slug}`}
              />
            ))}
          </Stagger>
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
              eyebrow="Pricing"
              title="Commercial packaging, not fake price tags"
              description="Team, Business, and Enterprise — sold through Contact Sales. No invented dollar amounts, logos, or G2 badges."
            />
          </Reveal>
          <div className="mt-10">
            <LazyPricingBoard />
          </div>
        </Container>
      </section>

      <section className="mkt-section border-y border-border mkt-band">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Resources"
              title="Practical tools and guidance for EHS teams"
              description="Published guides, live checkers, glossary, and product documentation — Available only when content or function exists."
            />
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {resources.map((item) => (
              <ResourceCard key={item.id} resource={item} />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/resources">All resources</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/resources/brsr-applicability">Open checker</Link>
            </Button>
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
