import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function AttendancePage() {
  return (
    <FieldScaffoldPage
      title="My Attendance"
      subtitle="Attendance and training records"
      action="training"
      body="Attendance tracking for field users will be available here. Training assignments and completion status are available in the Training module today."
      webHref="/field/training"
      webLabel="Open training"
    />
  );
}
