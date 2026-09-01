import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, User } from "lucide-react";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import { FieldMark, FieldPageSkeleton, fieldHeaderBtnClass } from "@/components/field/field-ui";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { requireOrgContext } from "@/lib/auth/org-context";
import { countFieldUnread } from "@/lib/field/unread";

async function FieldHeaderGreeting() {
  const { profile } = await requireOrgContext();
  const name = profile?.full_name?.split(" ")[0] || "there";
  return (
    <span className="hidden text-sm text-muted-foreground sm:inline">
      Hi, <span className="font-medium text-foreground">{name}</span>
    </span>
  );
}

async function FieldUnreadBell() {
  const { supabase, user, organization } = await requireOrgContext();
  const unreadCount = await countFieldUnread(supabase, organization.id, user.id);

  return (
    <Link
      href="/field/actions"
      prefetch={false}
      aria-label={
        unreadCount > 0
          ? `Allocated actions, ${unreadCount} notifications`
          : "Allocated action list"
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
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <header className="app-shell-header sticky top-0 z-20 border-b border-border/80 pt-[env(safe-area-inset-top)] shadow-[var(--shadow-header)]">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-2 px-3">
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
            <Suspense fallback={null}>
              <FieldHeaderGreeting />
            </Suspense>
            <Suspense
              fallback={
                <Link
                  href="/field/actions"
                  prefetch={false}
                  aria-label="Allocated action list"
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
      <main className="app-page mx-auto max-w-5xl px-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] pt-4 sm:px-4">
        <Suspense fallback={<FieldPageSkeleton />}>{children}</Suspense>
      </main>
      <footer className="border-t border-border/60 bg-card/80 py-2 text-center text-[11px] text-muted-foreground">
        Copyright © 2026 SONIL EHS360
      </footer>
      <FieldTabBar />
    </div>
  );
}
