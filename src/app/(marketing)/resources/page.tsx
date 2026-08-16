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
        description="These are intentional placeholders — not fabricated whitepapers or case studies."
        compact
      />
      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((item) => (
              <article key={item.title} className="border border-border bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {item.status}
                </p>
                <h2 className="mt-3 text-xl font-semibold text-primary">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
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
