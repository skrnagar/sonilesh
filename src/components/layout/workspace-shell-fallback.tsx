import AppLoading from "@/app/app/loading";

/** Static shell skeleton shown while workspace data loads or revalidates. */
export function WorkspaceShellFallback() {
  return (
    <div className="workspace-shell flex h-dvh overflow-hidden bg-transparent text-foreground">
      <aside
        className="flex h-dvh w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95"
        aria-hidden
      >
        <div className="border-b border-sidebar-border px-3 py-3.5">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-sidebar-accent" />
        </div>
        <div className="space-y-2 px-3 py-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-sidebar-accent/80" />
          ))}
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="app-shell-header sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/80 px-3 shadow-[var(--shadow-header)] sm:px-4 md:h-[4.25rem] md:px-5">
          <div className="h-10 w-10 animate-pulse rounded-[var(--radius-sm)] bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5 lg:flex-none">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="hidden h-3 w-36 animate-pulse rounded bg-muted sm:block" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-10 w-10 animate-pulse rounded-[var(--radius-sm)] bg-muted" />
            <div className="h-10 w-10 animate-pulse rounded-[var(--radius-sm)] bg-muted" />
            <div className="h-10 w-24 animate-pulse rounded-[var(--radius-sm)] bg-muted" />
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-[var(--space-page)] sm:p-4 md:p-6">
          <AppLoading />
        </main>
      </div>
    </div>
  );
}
