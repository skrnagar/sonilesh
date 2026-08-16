import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { DemoForm } from "@/components/marketing/demo-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact SONIL EHS360 sales and product specialists.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the SONIL EHS360 team"
        description="Sales, security reviews, and packaging conversations start here. The form is a front-end placeholder until your inbox/CRM is connected."
        primaryHref="/request-demo"
        primaryLabel="Request demo"
        compact
      />
      <section className="pb-20">
        <Container className="max-w-3xl">
          <DemoForm variant="contact" />
        </Container>
      </section>
    </>
  );
}
