"use client";

import { ErrorState } from "@/components/shared/state-panels";

export default function FieldError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Field could not load"
      description={error.message || "Try again. Your organization data is still tenant-scoped."}
      onRetry={reset}
    />
  );
}
