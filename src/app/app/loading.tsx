export default function AppLoading() {
  return (
    <div className="space-y-4 p-1" aria-busy="true" aria-label="Loading workspace">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
