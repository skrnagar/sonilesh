import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import { isFieldOnlyRoles } from "@/lib/auth/personas";
import { countUnreadNotifications } from "@/lib/services/notifications";

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, supabase } = await requireOrgContext();

  if (organization.status === "suspended") redirect("/login");

  const { roleCodes } = await getRoleCodesForUser(supabase, user.id, organization.id);
  const fieldOnly = isFieldOnlyRoles(roleCodes);
  const unreadCount = await countUnreadNotifications(supabase, organization.id, user.id);

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
            <Link
              href="/field/notifications"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              ) : null}
            </Link>
            <ThemeToggle compact />
            {fieldOnly ? null : (
              <Link
                href="/app/dashboard"
                className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Desktop
              </Link>
            )}
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
