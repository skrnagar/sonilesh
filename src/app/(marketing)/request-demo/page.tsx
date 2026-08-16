import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { DemoForm } from "@/components/marketing/demo-form";

export const metadata: Metadata = {
  title: "Request Demo",
  description:
    "Request a SONIL EHS360 demo focused on your industry, sites, and modules.",
};

export default function RequestDemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Demo"
        title="Request a product walkthrough"
        description="Tell us about your industry, sites, and modules of interest. We’ll map field LMRA and capture through CAPA and leadership dashboards."
        primaryHref="/contact"
        primaryLabel="Contact sales"
        compact
      />
      <section className="pb-20 pt-2 md:pb-28">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--mkt-safety)]">
              What to expect
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary md:text-[1.85rem]">
              A working product, mapped to your sites
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              This is a commercial conversation — not a generic webinar. Come with the modules and operating model you care about.
            </p>
            <ol className="mt-8 space-y-5">
              {[
                ["01", "Context", "Industry, sites, contractors, and the modules you actually need."],
                ["02", "Field", "LMRA, incident, near-miss, and permit capture on a phone."],
                ["03", "Control room", "Investigations, CAPA, and leadership dashboards on the same records."],
                ["04", "Fit", "Tenancy, roles, and packaging — without invented price tags."],
              ].map(([n, title, body]) => (
                <li key={n} className="border-l border-[var(--mkt-safety)]/70 pl-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {n}
                  </p>
                  <p className="mt-1 font-display text-base font-semibold text-primary">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
          <DemoForm variant="demo" />
        </Container>
      </section>
    </>
  );
}
