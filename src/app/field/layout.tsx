import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireOrgContext } from "@/lib/auth/org-context";

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, organization } = await requireOrgContext();

  if (organization.status === "suspended") redirect("/app/dashboard");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <BrandLockup chrome size="sm" />
            <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
              Field · {organization.name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle compact />
            <Link
              href="/app/dashboard"
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Desktop
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-32 pt-4">
        <p className="mb-3 text-xs text-muted-foreground">
          {profile?.full_name || profile?.email || user.email}
        </p>
        {children}
      </main>
      <FieldTabBar />
    </div>
  );
}
