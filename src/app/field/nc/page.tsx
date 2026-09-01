import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function FieldNcPage() {
  return (
    <FieldScaffoldPage
      title="Non-conformance (NC)"
      subtitle="Track NC records and link to CAPA."
      action="nc"
      body="The NC register is being rolled out. Raise findings from inspections or audits today; a dedicated NC workflow will appear here in a future release."
      webHref="/app/findings"
      webLabel="View open findings"
    />
  );
}
