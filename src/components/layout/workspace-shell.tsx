"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, PanelLeft, Search } from "lucide-react";
import { NotificationDropdown } from "@/components/layout/notification-inbox";
import type { NotificationRow } from "@/lib/services/notifications";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function WorkspaceShell({
  sidebar,
  title,
  userLabel,
  signOut,
  notificationCount = 0,
  notifications = [],
  contextSlot,
  children,
}: {
  sidebar: React.ReactNode;
  title: string;
  userLabel: string;
  signOut: React.ReactNode;
  notificationCount?: number;
  notifications?: NotificationRow[];
  contextSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  // Local notification state so badge updates when the dropdown marks items read client-side.
  const [localNotifications, setLocalNotifications] = useState<NotificationRow[]>(notifications);
  const searchRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const searchId = useId();

  // Sync if server passes fresh notifications (e.g. after revalidation-driven re-render).
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const localUnread = localNotifications.filter((n) => !n.read_at).length;
  // Fall back to the server-provided count when local list hasn't loaded yet.
  const badgeCount = localNotifications.length > 0 ? localUnread : notificationCount;

  useEffect(() => {
    setCollapsed(localStorage.getItem("sonil-sidebar-collapsed") === "1");
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setNotesOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setMobileNavOpen(false);
        setNotesOpen(false);
        setUserOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setNotesOpen(false);
        setUserOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sonil-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  const initials = userLabel
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const headerBtn =
    "inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-border/80 bg-card/90 text-foreground shadow-[var(--shadow-sm)] transition-[background-color,border-color,box-shadow] duration-200 hover:bg-muted hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div
      className={cn(
        "workspace-shell flex h-dvh overflow-hidden bg-transparent text-foreground",
        collapsed && "is-collapsed",
        mobileNavOpen && "is-mobile-nav-open",
      )}
    >
      {sidebar}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[var(--mkt-hero)]/45 backdrop-blur-[2px] lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          ref={headerRef}
          className="app-shell-header sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/80 px-3 shadow-[var(--shadow-header)] sm:gap-3 sm:px-4 md:h-[4.25rem] md:px-5"
        >
          <button
            type="button"
            className={cn(headerBtn, "h-11 w-11 min-h-11 min-w-11 lg:hidden")}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={cn(headerBtn, "hidden h-10 w-10 lg:inline-flex")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1 lg:flex-none">
            <p className="truncate font-display text-sm font-semibold tracking-tight text-foreground">
              {title}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{userLabel}</p>
          </div>
          {contextSlot}
          <form
            action="/app/search"
            method="get"
            className="relative hidden min-w-0 flex-1 max-w-md md:block"
          >
            <label htmlFor={searchId} className="sr-only">
              Search workspace
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              id={searchId}
              name="q"
              type="search"
              placeholder="Search workspace…"
              className="h-10 w-full rounded-[var(--radius-sm)] border border-border/80 bg-card/90 pl-9 pr-12 text-sm shadow-[var(--shadow-sm)] outline-none ring-offset-background placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 hover:border-accent/35 focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </form>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 md:ml-0">
            <div className="relative">
              <button
                type="button"
                className={cn(headerBtn, "relative h-11 w-11 min-h-11 min-w-11")}
                aria-label={
                  badgeCount > 0
                    ? `Notifications, ${badgeCount} unread`
                    : "Notifications"
                }
                aria-expanded={notesOpen}
                onClick={() => {
                  setNotesOpen((v) => !v);
                  setUserOpen(false);
                }}
              >
                <Bell className="h-4 w-4" />
                {badgeCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
                ) : null}
              </button>
              {notesOpen ? (
                <NotificationDropdown
                  items={localNotifications}
                  unreadCount={badgeCount}
                  onUpdate={setLocalNotifications}
                />
              ) : null}
            </div>
            <ThemeToggle className="min-h-11 min-w-11" />
            <div className="relative">
              <button
                type="button"
                className={cn(headerBtn, "h-11 min-h-11 gap-2 pl-1.5 pr-2.5 text-sm")}
                aria-expanded={userOpen}
                onClick={() => {
                  setUserOpen((v) => !v);
                  setNotesOpen(false);
                }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initials || "U"}
                </span>
                <span className="hidden max-w-[9rem] truncate text-xs font-medium lg:inline">
                  {userLabel}
                </span>
              </button>
              {userOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-56 max-w-[calc(100vw-1.5rem)] rounded-[var(--radius-md)] border border-border bg-card p-2 shadow-[var(--shadow-lg)]">
                  <p className="truncate px-2 py-2 text-xs text-muted-foreground">{userLabel}</p>
                  <div className="px-1 pb-1">{signOut}</div>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-[var(--space-page)] sm:p-4 md:p-6">
          <div key={pathname} className="app-page min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
