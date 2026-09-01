import { requireOrgContext } from "@/lib/auth/org-context";
import { FieldAllocatedActionList } from "@/components/field/field-allocated-action-list";
import { FieldEmpty, FieldPageHeader } from "@/components/field/field-ui";
import { getFieldAllocatedActions } from "@/lib/field/allocated-actions";

export default async function FieldActionsPage() {
  const { supabase, user, organization } = await requireOrgContext();

  try {
    const rows = await getFieldAllocatedActions(supabase, organization.id, user.id);

    return (
      <div className="space-y-4">
        <FieldPageHeader
          title="Allocated Action List"
          subtitle="Actions and CAPA allocated to you. Update status with evidence when complete."
        />
        <FieldAllocatedActionList rows={rows} />
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load actions.";
    return (
      <div className="space-y-4">
        <FieldPageHeader title="Allocated Action List" />
        <FieldEmpty text={message} />
      </div>
    );
  }
}
