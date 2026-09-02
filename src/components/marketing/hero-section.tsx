import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { LazyDashboardPreview } from "@/components/marketing/lazy-previews";
import { MobilePreview } from "@/components/marketing/mobile-preview";
import { ScrollCue } from "@/components/marketing/motion";
import { SocialProofStrip } from "@/components/marketing/social-proof-strip";
import { brand, heroHighlights } from "@/lib/marketing/content";

export function HeroSection() {
  return (
    <section className="relative overflow-x-clip overflow-hidden border-b border-white/10 bg-[var(--mkt-hero)] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="mkt-hero-glow absolute inset-0" />
        <div className="mkt-grid-fade absolute inset-0 opacity-50" />
      </div>
      <Container className="relative grid items-start gap-8 py-10 md:gap-10 md:py-14 lg:min-h-[min(72vh,720px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:py-20">
        <div className="max-w-xl min-w-0">
          <p className="mkt-eyebrow text-teal-200/90">{brand.eyebrow}</p>
          <h1 className="mkt-h1 mt-4 sm:mt-5">{brand.tagline}</h1>
          <p className="mkt-lead mt-4 text-white/78 sm:mt-5">{brand.supporting}</p>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <Button asChild size="lg" variant="safety" className="h-12 min-h-12 px-6 text-[15px] shadow-[0_8px_24px_-8px_rgba(15,118,110,0.55)]">
              <Link href="/signup">
                Start Free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 min-h-12 border-white/20 bg-white/5 px-6 text-[15px] text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <Link href="/book-a-demo">Book a Demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/55">
            <Link
              href="/resources/brsr-applicability"
              className="font-medium text-teal-200/90 underline-offset-4 transition-colors hover:text-teal-100 hover:underline"
            >
              Check BRSR applicability
            </Link>
            {" · "}
            No credit card · Self-serve signup
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
            {heroHighlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-teal-300/80" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <ScrollCue className="mt-8 hidden sm:inline-flex" />
        </div>
        <div className="relative min-w-0">
          <div className="relative pb-4 lg:pb-8 lg:pl-8 xl:pl-14">
            <ProductScreenshot title="SONIL EHS360 · Control board" stage>
              <LazyDashboardPreview />
            </ProductScreenshot>
            <div className="pointer-events-none relative z-10 mx-auto mt-5 w-fit lg:absolute lg:bottom-0 lg:left-0 lg:mx-0 lg:mt-0">
              <MobilePreview className="scale-[0.92] shadow-[var(--shadow-lg)] lg:origin-bottom-left lg:scale-[0.78] xl:scale-[0.86]" />
            </div>
          </div>
        </div>
      </Container>
      <SocialProofStrip variant="hero" />
    </section>
  );
}
