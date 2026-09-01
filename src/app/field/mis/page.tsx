import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function FieldMisPage() {
  return (
    <FieldScaffoldPage
      title="EHS MIS Report"
      subtitle="Management information submissions."
      action="ehs_mis"
      body="MIS period entry, submission, and approval run on desktop. Field users with MIS permissions can review status and open the full MIS workspace on web."
      webHref="/app/mis"
      webLabel="Open EHS MIS"
    />
  );
}
