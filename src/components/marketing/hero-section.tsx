import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { LazyDashboardPreview } from "@/components/marketing/lazy-previews";
import { FadeIn, ScrollCue } from "@/components/marketing/motion";
import { brand } from "@/lib/marketing/content";

/**
 * Zoho/Atlassian-quality home hero: brand-first, one composition,
 * full-bleed product visual — no floating badges or inset card clutter.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-x-clip overflow-hidden border-b border-white/10 bg-[var(--mkt-hero)] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="mkt-hero-glow absolute inset-0" />
        <div className="mkt-grid-fade absolute inset-0 opacity-40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--mkt-hero)] to-transparent" />
      </div>

      <Container className="relative flex min-h-[min(88vh,820px)] flex-col justify-center pb-10 pt-12 md:pb-14 md:pt-16 lg:min-h-[min(92vh,880px)] lg:pb-16 lg:pt-20">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="font-display text-sm font-semibold tracking-[0.08em] text-teal-200/95 sm:text-base">
            {brand.name}
          </p>
          <h1 className="mkt-h1 mt-4 text-balance sm:mt-5">{brand.tagline}</h1>
          <p className="mkt-lead mx-auto mt-5 max-w-2xl text-pretty text-white/78">
            {brand.supporting}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              asChild
              size="lg"
              variant="safety"
              className="h-12 min-h-12 px-7 text-[15px] shadow-[0_8px_24px_-8px_rgba(15,118,110,0.55)]"
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
              className="h-12 min-h-12 border-white/20 bg-white/5 px-7 text-[15px] text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <Link href="/book-a-demo">Book a Demo</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 min-h-12 px-5 text-[15px] text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-white/50">
            Self-serve signup · No credit card ·{" "}
            <Link
              href="/resources/brsr-applicability"
              className="font-medium text-teal-200/85 underline-offset-4 transition-colors hover:text-teal-100 hover:underline"
            >
              Check BRSR applicability
            </Link>
          </p>
        </FadeIn>

        <FadeIn delay={0.12} className="relative mx-auto mt-10 w-full max-w-5xl md:mt-14">
          <ProductScreenshot title="SONIL EHS360 · Operations" stage>
            <LazyDashboardPreview />
          </ProductScreenshot>
        </FadeIn>

        <ScrollCue className="mx-auto mt-8 hidden sm:inline-flex" />
      </Container>
    </section>
  );
}
