import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { DemoForm } from "@/components/marketing/demo-form";

export const metadata: Metadata = {
  title: "Request Demo",
  description:
    "Request an EHS360 demo focused on your industry, sites, and modules.",
};

export default function RequestDemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Demo"
        title="Request a product walkthrough"
        description="Tell us about your industry, sites, and modules of interest. We’ll tailor the conversation from field capture to leadership visibility."
        primaryHref="/contact"
        primaryLabel="Contact sales"
        compact
      />
      <section className="pb-20">
        <Container className="max-w-3xl">
          <DemoForm variant="demo" />
        </Container>
      </section>
    </>
  );
}
