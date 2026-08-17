import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { createFieldToolboxAction } from "@/app/actions/field";
import { FieldSubmitForm } from "@/components/field/field-submit-form";
import {
  FieldCard,
  FieldEmpty,
  FieldPageHeader,
  fieldControlClass,
} from "@/components/field/field-ui";

export default async function FieldToolboxPage() {
  const { supabase, organization, membershipId } = await requireOrgContext();
  const [role, talks] = await Promise.all([
    resolveFieldRole(supabase, membershipId),
    supabase
      .from("toolbox_talks")
      .select("id, talk_number, topic, held_at")
      .eq("organization_id", organization.id)
      .is("deleted_at", null)
      .order("held_at", { ascending: false })
      .limit(10),
  ]);
  const canCreate = canFieldAction(role, "toolbox");
  const { data, error } = talks;

  return (
    <div className="space-y-4">
      <FieldPageHeader title="Toolbox talks" subtitle="Recent talks for this organization." />
      {canCreate ? (
        <FieldCard>
          <p className="mb-3 text-sm font-semibold text-foreground">Log a talk</p>
          <FieldSubmitForm action={createFieldToolboxAction} submitLabel="Save talk">
            <input name="topic" required placeholder="Topic" className={fieldControlClass} />
            <textarea name="notes" rows={2} placeholder="Notes" className={`${fieldControlClass} mt-2`} />
          </FieldSubmitForm>
        </FieldCard>
      ) : null}
      {error ? <FieldEmpty text={error.message} /> : null}
      {(data ?? []).map((t) => (
        <FieldCard key={t.id}>
          <p className="font-medium text-foreground">{t.topic}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.talk_number} · {new Date(t.held_at).toLocaleString()}
          </p>
        </FieldCard>
      ))}
      {!data?.length && !error ? <FieldEmpty text="No toolbox talks yet." /> : null}
    </div>
  );
}
