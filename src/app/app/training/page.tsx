import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function TrainingPage() {
  const access = await requireModuleAccess({ featureCode: "training", permission: "training.view" });
  if (!access.entitled || !access.permitted) {
    return <ModuleShell title="Training" description="Training & competency" featureCode="training" permission="training.view" />;
  }
  const [{ data: courses }, { data: assignments }] = await Promise.all([
    access.supabase.from("training_courses").select("code, title, validity_days").eq("organization_id", access.organization.id).is("deleted_at", null).limit(50),
    access.supabase.from("training_assignments").select("id, status, due_date, expires_at, course_id").eq("organization_id", access.organization.id).is("deleted_at", null).limit(50),
  ]);
  return (
    <ModuleShell title="Training & Competency" description="Courses, assignments, certificates, expiry & renewal" featureCode="training" permission="training.view">
      <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
        Courses: {(courses ?? []).length ? (courses ?? []).map((c) => c.title).join(", ") : "None yet"}
      </div>
      <RecordsTable
        columns={["Assignment", "Status", "Due", "Expires"]}
        empty="No training assignments."
        rows={(assignments ?? []).map((r) => [r.id.slice(0, 8), <StatusPill key="s" value={r.status} />, r.due_date ?? "—", r.expires_at ?? "—"])}
      />
    </ModuleShell>
  );
}
