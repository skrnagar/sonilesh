import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { DemoForm } from "@/components/marketing/demo-form";
import { company } from "@/lib/marketing/content";
import { metadataForPath } from "@/lib/marketing/seo";

export const metadata = metadataForPath("/contact");

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the SONIL EHS360 team"
        description="Sales, security reviews, and packaging conversations. Company contact details below are the public numbers published on sonilbuildcon.com."
        primaryHref="/book-a-demo"
        primaryLabel="Book a Demo"
        compact
      />
      <section className="pb-20">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <aside className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--mkt-safety)]">
              {company.parent}
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold text-primary">{company.legalEntity}</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-foreground">Office</dt>
                <dd className="mt-1 text-foreground/80">
                  {company.hq} — {company.pin}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Phone</dt>
                <dd className="mt-1">
                  <a className="text-accent underline-offset-4 hover:underline" href={`tel:${company.phone.replace(/\s/g, "")}`}>
                    {company.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Email</dt>
                <dd className="mt-1">
                  <a className="text-accent underline-offset-4 hover:underline" href={`mailto:${company.email}`}>
                    {company.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Hours</dt>
                <dd className="mt-1 text-foreground/80">{company.hours}</dd>
              </div>
            </dl>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              The form is a front-end placeholder until your inbox/CRM is connected. Use the published phone
              or email for a live conversation.
            </p>
          </aside>
          <DemoForm variant="contact" />
        </Container>
      </section>
    </>
  );
}
