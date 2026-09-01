export default function FilesLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading files">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
