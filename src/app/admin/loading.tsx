export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading admin">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}
