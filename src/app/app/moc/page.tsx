import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function MocPage() {
  const access = await requireModuleAccess({ featureCode: "moc", permission: "moc.view" });
  if (!access.entitled || !access.permitted) {
    return <ModuleShell title="MOC" description="Management of Change" featureCode="moc" permission="moc.view" />;
  }
  const { data: rows } = await access.supabase
    .from("moc_requests")
    .select("moc_number, title, status")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (
    <ModuleShell title="Management of Change" description="Change request → risk review → approval → implementation → verification → close" featureCode="moc" permission="moc.view">
      <RecordsTable
        columns={["Number", "Title", "Status"]}
        empty="No MOC requests."
        rows={(rows ?? []).map((r) => [r.moc_number, r.title, <StatusPill key="s" value={r.status} />])}
      />
    </ModuleShell>
  );
}
