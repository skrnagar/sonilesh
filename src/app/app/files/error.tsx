"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function FilesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[files]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-xl font-semibold">Files & Data error</h1>
      <p className="text-sm text-muted-foreground">{error.message || "Something went wrong."}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          Try again
        </button>
        <Link href="/app/files" className="rounded-md border border-border px-4 py-2 text-sm">
          Files home
        </Link>
      </div>
    </div>
  );
}
