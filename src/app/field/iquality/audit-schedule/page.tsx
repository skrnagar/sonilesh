import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function AuditSchedulePage() {
  return (
    <FieldScaffoldPage
      title="Audit Schedule"
      subtitle="Planned quality audits"
      action="my_zone"
      body="Audit scheduling for quality programs is coming soon. Planned audits and assignments will appear here."
      webHref="/app/audits"
      webLabel="Open audit program on desktop"
    />
  );
}
