import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { LazyDashboardPreview } from "@/components/marketing/lazy-previews";
import { FadeIn, ScrollCue } from "@/components/marketing/motion";
import { brand } from "@/lib/marketing/content";

/**
 * Big-SaaS home hero (Linear / Zoho / Atlassian scale):
 * brand-first · one composition · full-bleed product plane · no hero clutter.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-x-clip overflow-hidden border-b border-white/10 bg-[var(--mkt-hero)] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="mkt-hero-glow absolute inset-0" />
        <div className="mkt-hero-aurora absolute inset-0" />
        <div className="mkt-grid-fade absolute inset-0 opacity-[0.32]" />
      </div>

      <Container className="relative pt-14 sm:pt-16 md:pt-20 lg:pt-24">
        <FadeIn className="mx-auto max-w-4xl text-center">
          <p className="mkt-hero-brand">
            <span className="mkt-hero-brand-word">{brand.wordmark}</span>
            <span className="mkt-hero-brand-sep" aria-hidden>
              {" "}
            </span>
            <span className="mkt-hero-brand-product">{brand.product}</span>
          </p>

          <h1 className="mkt-hero-headline mt-5 text-balance sm:mt-6">{brand.tagline}</h1>

          <p className="mkt-hero-support mx-auto mt-5 max-w-xl text-pretty text-white/72 sm:mt-6">
            {brand.heroSupporting}
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              asChild
              size="lg"
              variant="safety"
              className="mkt-hero-cta-primary h-12 min-h-12 px-8 text-[15px] font-semibold sm:h-14 sm:min-h-14 sm:px-9"
            >
              <Link href="/signup">
                Start Free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 min-h-12 border-white/22 bg-white/[0.06] px-7 text-[15px] text-white backdrop-blur-sm hover:bg-white/12 hover:text-white sm:h-14 sm:min-h-14 sm:px-8"
            >
              <Link href="/book-a-demo">Book a Demo</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 min-h-12 px-5 text-[15px] text-white/75 hover:bg-white/10 hover:text-white sm:h-14 sm:min-h-14"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </FadeIn>
      </Container>

      <div className="mkt-hero-visual relative mt-12 w-full sm:mt-14 md:mt-16 lg:mt-[4.5rem]">
        <div className="mkt-hero-visual-inner">
          <ProductScreenshot title="SONIL EHS360 · Operations" stage fullBleed>
            <LazyDashboardPreview />
          </ProductScreenshot>
        </div>
      </div>

      <div className="relative flex justify-center pb-8 pt-5 md:pb-10 md:pt-6">
        <ScrollCue className="hidden sm:inline-flex" />
      </div>
    </section>
  );
}
