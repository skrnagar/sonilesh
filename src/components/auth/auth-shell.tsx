import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { authSignupPillars } from "@/lib/marketing/content";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1.15fr_0.85fr]">
      <div className="relative hidden overflow-hidden bg-[var(--mkt-hero)] p-10 text-white md:flex md:flex-col md:justify-between">
        <div aria-hidden className="mkt-hero-glow pointer-events-none absolute inset-0 opacity-90" />
        <div aria-hidden className="mkt-grid-fade pointer-events-none absolute inset-0 opacity-50" />
        <Link href="/" className="relative inline-flex">
          <BrandLockup inverse size="lg" />
        </Link>
        <div className="relative max-w-lg">
          <p className="mkt-eyebrow text-teal-200/80">SONIL EHS360</p>
          <p className="mt-4 font-display text-3xl font-semibold leading-[1.08] tracking-tight md:text-[2.35rem]">
            One record from field capture to audit-ready reporting.
          </p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/72">
            Multi-tenant isolation, RBAC, plan entitlements, and workflows built for EPC and industrial sites in India.
          </p>
          <ul className="mt-8 space-y-3">
            {authSignupPillars.map((pillar) => (
              <li
                key={pillar.name}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-sm font-semibold text-white/92">{pillar.name}</p>
                <p className="mt-0.5 text-xs text-white/58">{pillar.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-white/55">
            <Link href="/book-a-demo" className="font-medium text-teal-200/90 underline-offset-4 hover:text-teal-100 hover:underline">
              Book a demo
            </Link>
            {" · "}
            Field · My Zone · Workspace · Org Admin · Honest marketing
          </p>
        </div>
        <p className="relative text-xs text-white/45">India-first EHS + ESG + compliance SaaS</p>
      </div>
      <div className="flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex md:hidden">
              <BrandLockup />
            </Link>
            <div className="ml-auto">
              <ThemeToggle compact />
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border/90 bg-card p-7 shadow-[var(--shadow-md)]">
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
