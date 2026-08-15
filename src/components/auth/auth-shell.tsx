import Link from "next/link";

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
        <Link href="/" className="relative inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-sm font-bold">
            E
          </span>
          <span className="text-xl font-semibold tracking-tight">EHS360</span>
        </Link>
        <div className="relative max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/80">
            Enterprise EHS
          </p>
          <p className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-[2.15rem]">
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
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-primary md:hidden"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              E
            </span>
            <span className="text-lg font-semibold tracking-tight">EHS360</span>
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
