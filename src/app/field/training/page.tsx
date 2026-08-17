import { requireOrgContext } from "@/lib/auth/org-context";
import { completeFieldTrainingAction } from "@/app/actions/field";
import { FieldSubmitForm } from "@/components/field/field-submit-form";
import { FieldCard, FieldEmpty, FieldPageHeader } from "@/components/field/field-ui";

export default async function FieldTrainingPage() {
  const { supabase, user, organization } = await requireOrgContext();
  const { data, error } = await supabase
    .from("training_assignments")
    .select("id, status, due_date, expires_at, training_courses:course_id(title, code)")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .limit(20);

  return (
    <div className="space-y-4">
      <FieldPageHeader title="My training" subtitle="Assigned courses and due dates." />
      {error ? <FieldEmpty text={error.message} /> : null}
      {(data ?? []).map((t) => {
        const course = t.training_courses as { title?: string; code?: string } | null;
        const open = t.status === "assigned" || t.status === "in_progress";
        return (
          <FieldCard key={t.id} className="space-y-3">
            <div>
              <p className="font-medium text-foreground">{course?.title || "Training assignment"}</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {t.status} · due {t.due_date ?? "—"} · expires {t.expires_at ?? "—"}
              </p>
            </div>
            {open ? (
              <div className="space-y-2">
                {t.status === "assigned" ? (
                  <FieldSubmitForm action={completeFieldTrainingAction} submitLabel="Mark started">
                    <input type="hidden" name="assignmentId" value={t.id} />
                    <input type="hidden" name="intent" value="start" />
                  </FieldSubmitForm>
                ) : null}
                <FieldSubmitForm action={completeFieldTrainingAction} submitLabel="Mark complete">
                  <input type="hidden" name="assignmentId" value={t.id} />
                  <input type="hidden" name="intent" value="complete" />
                </FieldSubmitForm>
              </div>
            ) : null}
          </FieldCard>
        );
      })}
      {!data?.length && !error ? <FieldEmpty text="No training assigned." /> : null}
    </div>
  );
}
