import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function FieldChecklistTemplatesPage() {
  return (
    <FieldScaffoldPage
      title="Checklist Template"
      subtitle="Published checklist definitions."
      action="checklist_template"
      body="Template authoring and publishing is managed by EHS on desktop. Field users run published templates from the Checklist tile when assigned."
      webHref="/app/settings/ehs/checklists"
      webLabel="Manage templates"
    />
  );
}
