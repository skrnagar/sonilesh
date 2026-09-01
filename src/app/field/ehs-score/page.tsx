import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function FieldEhsScorePage() {
  return (
    <FieldScaffoldPage
      title="EHS Score Card"
      subtitle="Dimensional EHS performance scoring."
      action="ehs_score"
      body="Live scorecard dimensions and trends are calculated on desktop. Open the scorecard to view planning, compliance, and operational scores for your scope."
      webHref="/app/ehs-score"
      webLabel="Open EHS Scorecard"
    />
  );
}
