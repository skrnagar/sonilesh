export default function OrgAdminLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8" aria-busy="true" aria-label="Loading organization admin">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-muted sm:w-72" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[8.5rem] animate-pulse rounded-2xl border border-border bg-card p-5"
          >
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="mt-4 h-4 w-24 rounded-md bg-muted" />
            <div className="mt-2 h-3 w-full rounded-md bg-muted" />
            <div className="mt-1.5 h-3 w-4/5 max-w-[12rem] rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
