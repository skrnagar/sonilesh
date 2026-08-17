import { requireOrgContext } from "@/lib/auth/org-context";
import { FieldCard, FieldEmpty, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { hasFeature } from "@/lib/services/entitlements";
import { listPpeIssuances } from "@/lib/services/ppe";
import { formatDate } from "@/lib/utils";

export default async function FieldPpePage() {
  const { supabase, user, organization } = await requireOrgContext();
  const entitled = await hasFeature(supabase, organization.id, "ppe_management");
  if (!entitled) return <FieldForbidden />;

  const rows = await listPpeIssuances(supabase, organization.id, { userId: user.id });

  return (
    <div className="space-y-4">
      <FieldPageHeader title="My PPE" subtitle="Issued equipment assigned to you." />
      {rows.length === 0 ? (
        <FieldEmpty text="No PPE issued to you." />
      ) : (
        rows.map((r) => {
          const item = r.ppe_items as { name?: string } | null;
          return (
            <FieldCard key={r.id} className="space-y-1">
              <p className="font-medium">{item?.name ?? "PPE"}</p>
              <p className="text-xs text-muted-foreground">
                {r.status} · expires {formatDate(r.expires_on)}
              </p>
            </FieldCard>
          );
        })
      )}
    </div>
  );
}
