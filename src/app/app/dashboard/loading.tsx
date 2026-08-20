export default function DashboardLoading() {
  return (
    <div className="min-w-0 space-y-6 animate-pulse">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-72 max-w-full rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-40 rounded-xl bg-muted" />
          <div className="h-9 w-28 rounded-xl bg-muted" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-border bg-card" />
        <div className="h-64 rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}
