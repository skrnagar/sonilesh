"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{error.message || "Unexpected application error."}</p>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded-md border border-border px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
