import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function PpePage() {
  const access = await requireModuleAccess({ featureCode: "ppe_management", permission: "ppe.view" });
  if (!access.entitled || !access.permitted) {
    return <ModuleShell title="PPE" description="PPE management" featureCode="ppe_management" permission="ppe.view" />;
  }
  const [{ data: items }, { data: issuances }] = await Promise.all([
    access.supabase.from("ppe_items").select("name, sku, inventory_qty").eq("organization_id", access.organization.id).is("deleted_at", null),
    access.supabase.from("ppe_issuances").select("status, issued_at, expires_on").eq("organization_id", access.organization.id).limit(50),
  ]);
  return (
    <ModuleShell title="PPE Management" description="Categories, requirements, issuance, inventory, expiry" featureCode="ppe_management" permission="ppe.view">
      <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
        Inventory items: {(items ?? []).length ? (items ?? []).map((i) => `${i.name} (${i.inventory_qty})`).join(", ") : "None"}
      </div>
      <RecordsTable
        columns={["Status", "Issued", "Expires"]}
        empty="No PPE issuances."
        rows={(issuances ?? []).map((r) => [<StatusPill key="s" value={r.status} />, new Date(r.issued_at).toLocaleDateString(), r.expires_on ?? "—"])}
      />
    </ModuleShell>
  );
}
