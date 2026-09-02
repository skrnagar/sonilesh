import { FieldAllocatedActionListLazy } from "@/components/field/field-allocated-action-list-lazy";
import { FieldDemoBanner, FieldEmpty, FieldPageHeader } from "@/components/field/field-ui";
import { DEMO_ACTION_ROWS, withDemoFallback } from "@/lib/field/demo-fallback";
import { getFieldAllocatedActions } from "@/lib/field/services/actions";
import { requireOrgContext } from "@/lib/auth/org-context";

export default async function FieldActionsPage() {
  const { supabase, user, organization } = await requireOrgContext();

  try {
    const rows = await getFieldAllocatedActions(supabase, organization.id, user.id);
    const { rows: displayRows, isDemoPreview } = withDemoFallback(
      rows,
      DEMO_ACTION_ROWS,
      organization.slug,
    );

    return (
      <div className="space-y-4">
        <FieldPageHeader
          title="Allocated Action List"
          subtitle="Actions and CAPA allocated to you. Update status with evidence when complete."
        />
        {isDemoPreview ? <FieldDemoBanner /> : null}
        <FieldAllocatedActionListLazy rows={displayRows} isDemoPreview={isDemoPreview} />
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
