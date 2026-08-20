import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, User } from "lucide-react";
import { FieldTabBar } from "@/components/field/field-tab-bar";
import { FieldMark, fieldHeaderBtnClass } from "@/components/field/field-ui";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import { isContractorPortalOnly } from "@/lib/auth/personas";
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
  const { user, profile, organization, supabase } = await requireOrgContext();
  const { roleCodes } = await getRoleCodesForUser(supabase, user.id, organization.id);

  if (isContractorPortalOnly(roleCodes) && !profile?.is_platform_admin) {
    redirect("/contractor");
  }

  if (organization.status === "suspended") redirect("/field/login");

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
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
      <main className="mx-auto max-w-lg px-3 pb-[calc(3.75rem+env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>
      <FieldTabBar />
    </div>
  );
}
