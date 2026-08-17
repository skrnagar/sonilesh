"use client";

export default function FieldError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card px-4 py-6 text-center">
      <p className="text-sm font-semibold text-destructive">Field could not load</p>
      <p className="text-sm text-muted-foreground">
        {error.message || "Try again. Your organization data is still tenant-scoped."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold"
      >
        Retry
      </button>
    </div>
  );
}
