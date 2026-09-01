import { FieldPageHeader } from "@/components/field/field-ui";

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-md)] bg-muted/70 ${className ?? ""}`} />;
}

export default function FieldEhsScoreLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading EHS score dashboard">
      <FieldPageHeader
        title="BU/Region Wise EHS Score"
        subtitle="Loading assessment data…"
      />
      <Block className="h-36" />
      <div className="flex gap-2">
        <Block className="h-9 w-28 rounded-full" />
        <Block className="h-9 w-36 rounded-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Block className="h-64" />
        <Block className="h-64" />
      </div>
      <Block className="h-48" />
    </div>
  );
}
