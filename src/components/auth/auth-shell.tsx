import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";

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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(31,111,139,0.55),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(15,118,110,0.28),transparent_45%)]"
        />
        <div aria-hidden className="mkt-grid-fade pointer-events-none absolute inset-0 opacity-60" />
        <Link href="/" className="relative inline-flex">
          <BrandLockup inverse size="lg" />
        </Link>
        <div className="relative max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/80">
            Enterprise EHS
          </p>
          <p className="font-display mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-[2.35rem]">
            One platform. Complete EHS control — from field to boardroom.
          </p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75">
            Secure tenant isolation, configurable roles, subscription entitlements, and
            audit-ready reporting workflows for high-risk operations.
          </p>
        </div>
        <p className="relative text-xs text-white/50">Professional EHS SaaS foundation</p>
      </div>
      <div className="flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex md:hidden">
            <BrandLockup />
          </Link>
          <div className="rounded-xl border border-border bg-card p-7 shadow-[var(--shadow-md)]">
            <h1 className="text-xl font-semibold tracking-tight text-primary">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
