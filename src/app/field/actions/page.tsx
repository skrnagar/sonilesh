import { requireOrgContext } from "@/lib/auth/org-context";
import {
  completeFieldActionItemAction,
  completeFieldCapaAction,
} from "@/app/actions/field";
import { ActionCompleteCard, CapaCompleteCard } from "@/components/field/field-submit-form";
import { FieldEmpty, FieldPageHeader, FieldSection } from "@/components/field/field-ui";

export default async function FieldActionsPage() {
  const { supabase, user, organization } = await requireOrgContext();
  const [{ data: actions, error: actionError }, { data: capas, error: capaError }] =
    await Promise.all([
      supabase
        .from("action_items")
        .select("id, title, status, due_date")
        .eq("organization_id", organization.id)
        .eq("owner_id", user.id)
        .in("status", ["open", "in_progress"])
        .is("deleted_at", null),
      supabase
        .from("capa_items")
        .select("id, title, status, due_date")
        .eq("organization_id", organization.id)
        .eq("owner_id", user.id)
        .in("status", ["open", "in_progress"])
        .is("deleted_at", null),
    ]);

  if (actionError || capaError) {
    return (
      <div className="space-y-4">
        <FieldPageHeader title="My actions" subtitle="CAPA and assigned actions." />
        <FieldEmpty text={actionError?.message || capaError?.message || "Could not load actions."} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FieldPageHeader title="My actions" subtitle="Complete with a note or photo evidence." />
      <FieldSection title="Action items">
        {(actions ?? []).length ? (
          (actions ?? []).map((a) => (
            <ActionCompleteCard
              key={a.id}
              id={a.id}
              title={a.title}
              meta={`${a.status} · due ${a.due_date ?? "—"}`}
              action={completeFieldActionItemAction}
            />
          ))
        ) : (
          <FieldEmpty text="No open action items." />
        )}
      </FieldSection>
      <FieldSection title="CAPA">
        {(capas ?? []).length ? (
          (capas ?? []).map((c) => (
            <CapaCompleteCard
              key={c.id}
              id={c.id}
              title={c.title}
              meta={`${c.status} · due ${c.due_date ?? "—"}`}
              action={completeFieldCapaAction}
            />
          ))
        ) : (
          <FieldEmpty text="No open CAPA assigned to you." />
        )}
      </FieldSection>
    </div>
  );
}
