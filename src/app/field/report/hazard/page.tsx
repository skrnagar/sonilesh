import { QuickReportForm } from "@/components/field/quick-report-form";
import { submitFieldReportAction } from "@/app/actions/field";

export default function FieldHazardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Report hazard</h1>
      <QuickReportForm mode="hazard" action={submitFieldReportAction} />
    </div>
  );
}
