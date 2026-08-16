import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTASection } from "@/components/marketing/cta-section";
import { resources } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "SONIL EHS360 resources and guides — placeholders for implementation, field adoption, CAPA, and analytics content.",
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Practical guides as the library grows"
        description="These are intentional placeholders — not fabricated whitepapers or case studies. Request a demo if you need a live walkthrough now."
        compact
      />
      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((item) => (
              <article
                id={item.id}
                key={item.id}
                className="scroll-mt-28 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]"
              >
                <p className="inline-flex rounded-full bg-[var(--mkt-safety)]/12 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">
                  {item.status}
                </p>
                <h2 className="mt-3 font-display text-xl font-semibold text-primary">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <CTASection
        title="Prefer a live walkthrough?"
        description="Request a demo and we’ll focus on the modules and industry context that matter to you."
      />
    </>
  );
}
