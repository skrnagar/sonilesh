import { FieldListSkeleton } from "@/components/field/field-ui";

export default function FieldActionsLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading allocated actions">
      <div className="h-8 w-56 animate-pulse rounded bg-muted/70" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted/50" />
      <FieldListSkeleton rows={6} />
    </div>
  );
}
