"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[onboarding]", error);
  }, [error]);

  const message = error.message || "Something went wrong during onboarding.";
  const needsSetup =
    /fetch failed|schema cache|Could not find the table|Could not find the function|PGRST20/i.test(
      message,
    );

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-xl font-semibold text-primary">Onboarding interrupted</h1>
      <p className="text-sm text-muted-foreground">
        {needsSetup
          ? "Supabase is unreachable or the database schema is not applied yet."
          : message}
      </p>
      <div className="flex flex-wrap gap-3">
        {needsSetup ? (
          <Link
            href="/setup?reason=schema"
            className="rounded-md bg-primary px-4 py-2 text-sm text-white"
          >
            Open setup
          </Link>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
