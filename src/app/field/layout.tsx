import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, User } from "lucide-react";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import { FieldMark, FieldPageSkeleton, fieldHeaderBtnClass } from "@/components/field/field-ui";
import { requireOrgContext } from "@/lib/auth/org-context";
import { countFieldUnread } from "@/lib/field/unread";

async function FieldUnreadBell() {
  const { supabase, user, organization } = await requireOrgContext();
  const unreadCount = await countFieldUnread(supabase, organization.id, user.id);

  return (
    <Link
      href="/field/notifications"
      prefetch={false}
      aria-label={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      className={fieldHeaderBtnClass}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 ? (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
      ) : null}
    </Link>
  );
}

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const { organization } = await requireOrgContext();

  if (organization.status === "suspended") redirect("/login");

  return (
    <div className="min-h-dvh overflow-x-clip bg-transparent text-foreground">
      <header className="app-shell-header sticky top-0 z-20 border-b border-border/80 pt-[env(safe-area-inset-top)] shadow-[var(--shadow-header)]">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <FieldMark />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight tracking-tight text-foreground">
                SONIL Field
              </p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {organization.name}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Suspense
              fallback={
                <Link
                  href="/field/notifications"
                  prefetch={false}
                  aria-label="Notifications"
                  className={fieldHeaderBtnClass}
                >
                  <Bell className="h-4 w-4" />
                </Link>
              }
            >
              <FieldUnreadBell />
            </Suspense>
            <Link
              href="/field/profile"
              prefetch
              aria-label="Profile and settings"
              className={fieldHeaderBtnClass}
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>
      <main className="app-page mx-auto max-w-lg px-3 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-4">
        <Suspense fallback={<FieldPageSkeleton />}>{children}</Suspense>
      </main>
      <FieldTabBar />
    </div>
  );
}
