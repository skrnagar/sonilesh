import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignTrainingAction,
  createTrainingCourseAction,
} from "@/app/actions/supporting";

export default async function TrainingPage() {
  const access = await requireModuleAccess({ featureCode: "training", permission: "training.view" });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="Training"
        description="Training & competency"
        featureCode="training"
        permission="training.view"
      />
    );
  }

  const [{ data: courses }, { data: assignments }] = await Promise.all([
    access.supabase
      .from("training_courses")
      .select("id, code, title, validity_days")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .limit(50),
    access.supabase
      .from("training_assignments")
      .select("id, status, due_date, expires_at, course_id")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .limit(50),
  ]);

  return (
    <ModuleShell
      title="Training & Competency"
      description="Courses, assignments, certificates, expiry & renewal"
      featureCode="training"
      permission="training.view"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionForm
          action={createTrainingCourseAction}
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <p className="text-sm font-semibold">New course</p>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validityDays">Validity (days)</Label>
            <Input id="validityDays" name="validityDays" type="number" min={0} />
          </div>
          <Button type="submit">Create course</Button>
        </ActionForm>
        <ActionForm
          action={assignTrainingAction}
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <p className="text-sm font-semibold">Assign to me</p>
          <div className="space-y-2">
            <Label htmlFor="courseId">Course</Label>
            <select
              id="courseId"
              name="courseId"
              required
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select course
              </option>
              {(courses ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} · {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <Button type="submit" variant="outline">
            Assign
          </Button>
        </ActionForm>
      </div>
      <RecordsTable
        columns={["Assignment", "Status", "Due", "Expires"]}
        empty="No training assignments."
        rows={(assignments ?? []).map((row) => [
          row.id.slice(0, 8),
          <StatusPill key="s" value={row.status} />,
          row.due_date ?? "—",
          row.expires_at ?? "—",
        ])}
      />
    </ModuleShell>
  );
}
