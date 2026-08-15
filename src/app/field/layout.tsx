import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/org-context";

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, organization } = await requireOrgContext();

  if (organization.status === "suspended") redirect("/app/dashboard");

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#071f2d_0%,#0b3a53_48%,#0a3044_100%)] text-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--mkt-hero)]/85 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/90">
              EHS360 Field
            </p>
            <p className="truncate text-sm font-medium text-white">{organization.name}</p>
          </div>
          <Link
            href="/app/dashboard"
            className="shrink-0 rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
          >
            Desktop
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-32 pt-4">
        <p className="mb-3 text-xs text-slate-400">
          {profile?.full_name || profile?.email || user.email}
        </p>
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[var(--mkt-hero)]/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2 text-[11px]">
          {[
            { href: "/field", label: "Home" },
            { href: "/field/report", label: "Report" },
            { href: "/field/actions", label: "Actions" },
            { href: "/field/permits", label: "Permits" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-3.5 text-center font-semibold uppercase tracking-wide text-slate-200 transition-colors hover:bg-white/5 active:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
