export default function OrgAdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading organization admin">
      <div className="h-7 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-96 animate-pulse rounded-lg bg-muted" />
      <div className="mt-4 h-64 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
