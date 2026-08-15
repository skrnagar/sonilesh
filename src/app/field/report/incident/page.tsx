import { QuickReportForm } from "@/components/field/quick-report-form";
import { submitFieldReportAction } from "@/app/actions/field";

export default function FieldIncidentPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Report incident</h1>
      <QuickReportForm mode="incident" action={submitFieldReportAction} />
    </div>
  );
}
