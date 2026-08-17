"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Admin error</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button type="button" onClick={reset} className="rounded-md border border-border px-3 py-1.5 text-sm">
        Try again
      </button>
    </div>
  );
}
