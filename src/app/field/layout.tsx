import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireOrgContext } from "@/lib/auth/org-context";

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const { organization } = await requireOrgContext();

  if (organization.status === "suspended") redirect("/app/dashboard");

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
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
              className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Desktop
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5">
        {children}
      </main>
      <FieldTabBar />
    </div>
  );
}
