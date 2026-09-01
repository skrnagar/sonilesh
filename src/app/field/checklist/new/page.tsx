import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function FieldNewChecklistPage() {
  return (
    <FieldScaffoldPage
      title="New Checklist"
      subtitle="Start an ad-hoc inspection assignment."
      action="new_checklist"
      body="Assigned checklists appear under Checklist on the launchpad. Supervisors can schedule new inspections from desktop; field execution uses the checklist runner."
      webHref="/app/inspections/new"
      webLabel="Create inspection on desktop"
    />
  );
}
