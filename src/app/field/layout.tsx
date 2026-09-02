import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, User } from "lucide-react";
import { FieldDesktopNav } from "@/components/field/field-desktop-nav";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import {
  FieldMark,
  FieldPageSkeleton,
  fieldDesktopHeaderBtnClass,
  fieldHeaderBtnClass,
  fieldHeaderInitials,
} from "@/components/field/field-ui";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { FIELD_SHELL_CLASS } from "@/lib/field/nav";
import { requireOrgContext } from "@/lib/auth/org-context";
import { countFieldUnread } from "@/lib/field/unread";
import { cn } from "@/lib/utils";

async function FieldHeaderGreeting() {
  const { profile } = await requireOrgContext();
  const name = profile?.full_name?.split(" ")[0] || "there";
  return (
    <span className="hidden text-sm text-muted-foreground lg:inline">
      Hi, <span className="font-medium text-foreground">{name}</span>
    </span>
  );
}

async function FieldHeaderAvatar() {
  const { profile } = await requireOrgContext();
  const initials = fieldHeaderInitials(profile?.full_name);
  return (
    <>
      <Link
        href="/field/profile"
        prefetch
        aria-label="Profile and settings"
        className={cn(fieldHeaderBtnClass, "lg:hidden")}
      >
        <User className="h-4 w-4" />
      </Link>
      <Link
        href="/field/profile"
        prefetch
        aria-label="Profile and settings"
        className={cn(fieldDesktopHeaderBtnClass, "hidden lg:inline-flex")}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </span>
      </Link>
    </>
  );
}

async function FieldUnreadBell() {
  const { supabase, user, organization } = await requireOrgContext();
  const unreadCount = await countFieldUnread(supabase, organization.id, user.id);
  const ariaLabel =
    unreadCount > 0
      ? `Allocated actions, ${unreadCount} notifications`
      : "Allocated action list";

  return (
    <>
      <Link
        href="/field/actions"
        prefetch={false}
        aria-label={ariaLabel}
        className={cn(fieldHeaderBtnClass, "lg:hidden")}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        ) : null}
      </Link>
      <Link
        href="/field/actions"
        prefetch={false}
        aria-label={ariaLabel}
        className={cn(fieldDesktopHeaderBtnClass, "hidden lg:inline-flex")}
      >
        <Bell className="h-[1.125rem] w-[1.125rem]" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-white" />
        ) : null}
      </Link>
    </>
  );
}

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const { organization } = await requireOrgContext();

  if (organization.status === "suspended") redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-transparent text-foreground">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <header className="field-shell-header sticky top-0 z-20 shrink-0 border-b border-border/80 pt-[env(safe-area-inset-top)] shadow-[var(--shadow-header)] lg:shadow-none">
        <div className={FIELD_SHELL_CLASS}>
          <div className="flex h-12 items-center gap-2 lg:h-14 lg:gap-3">
            <div className="flex min-w-0 shrink-0 items-center gap-2">
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
            <FieldDesktopNav />
            <div className="ml-auto flex shrink-0 items-center gap-1 lg:gap-2">
              <Suspense fallback={null}>
                <FieldHeaderGreeting />
              </Suspense>
              <Suspense
                fallback={
                  <>
                    <Link
                      href="/field/actions"
                      prefetch={false}
                      aria-label="Allocated action list"
                      className={cn(fieldHeaderBtnClass, "lg:hidden")}
                    >
                      <Bell className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/field/actions"
                      prefetch={false}
                      aria-label="Allocated action list"
                      className={cn(fieldDesktopHeaderBtnClass, "hidden lg:inline-flex")}
                    >
                      <Bell className="h-[1.125rem] w-[1.125rem]" />
                    </Link>
                  </>
                }
              >
                <FieldUnreadBell />
              </Suspense>
              <Suspense
                fallback={
                  <>
                    <Link
                      href="/field/profile"
                      prefetch
                      aria-label="Profile and settings"
                      className={cn(fieldHeaderBtnClass, "lg:hidden")}
                    >
                      <User className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/field/profile"
                      prefetch
                      aria-label="Profile and settings"
                      className={cn(fieldDesktopHeaderBtnClass, "hidden lg:inline-flex")}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        U
                      </span>
                    </Link>
                  </>
                }
              >
                <FieldHeaderAvatar />
              </Suspense>
            </div>
          </div>
        </div>
      </header>
      <main
        className={`app-page ${FIELD_SHELL_CLASS} min-h-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] pt-4 lg:pb-8`}
      >
        <Suspense fallback={<FieldPageSkeleton />}>{children}</Suspense>
      </main>
      <footer className="hidden shrink-0 border-t border-border/60 bg-card/80 py-2 text-center text-[11px] text-muted-foreground lg:block">
        Copyright © 2026 SONIL EHS360
      </footer>
      <FieldTabBar />
    </div>
  );
}
