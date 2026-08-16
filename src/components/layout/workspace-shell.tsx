"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, PanelLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function WorkspaceShell({
  sidebar,
  title,
  userLabel,
  signOut,
  children,
}: {
  sidebar: React.ReactNode;
  title: string;
  userLabel: string;
  signOut: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchId = useId();

  useEffect(() => {
    setCollapsed(localStorage.getItem("sonil-sidebar-collapsed") === "1");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  return (
    <div
      className={cn(
        "workspace-shell flex min-h-screen bg-background",
        collapsed && "is-collapsed",
      )}
    >
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-shell-header sticky top-0 z-20 flex h-[4.25rem] items-center gap-3 border-b border-border px-4 md:px-5">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="hidden min-w-0 sm:block">
            <p className="font-display text-sm font-semibold tracking-tight text-foreground">
              {title}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userLabel}</p>
          </div>
          <label
            htmlFor={searchId}
            className="relative ml-auto hidden min-w-0 flex-1 max-w-md md:block"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              id={searchId}
              type="search"
              placeholder="Search records…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-12 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </label>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Notifications"
                aria-expanded={notesOpen}
                onClick={() => {
                  setNotesOpen((v) => !v);
                  setUserOpen(false);
                }}
              >
                <Bell className="h-4 w-4" />
              </button>
              {notesOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-lg)]">
                  <p className="font-display text-sm font-semibold">Notifications</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No new EHS alerts for this workspace.
                  </p>
                </div>
              ) : null}
            </div>
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card pl-1.5 pr-2.5 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-56 rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-lg)]">
                  <p className="truncate px-2 py-2 text-xs text-muted-foreground">{userLabel}</p>
                  <div className="px-1 pb-1">{signOut}</div>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
