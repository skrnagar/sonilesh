import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function ToolboxTalksPage() {
  const access = await requireModuleAccess({ featureCode: "toolbox_talks", permission: "toolbox.view" });
  if (!access.entitled || !access.permitted) {
    return <ModuleShell title="Toolbox Talks" description="Toolbox talks" featureCode="toolbox_talks" permission="toolbox.view" />;
  }
  const { data: rows } = await access.supabase
    .from("toolbox_talks")
    .select("talk_number, topic, held_at")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("held_at", { ascending: false });
  return (
    <ModuleShell title="Toolbox Talks" description="Topic, presenter, attendance, photos, follow-ups" featureCode="toolbox_talks" permission="toolbox.view">
      <RecordsTable
        columns={["Number", "Topic", "Held"]}
        empty="No toolbox talks yet."
        rows={(rows ?? []).map((r) => [r.talk_number, r.topic, new Date(r.held_at).toLocaleString()])}
      />
    </ModuleShell>
  );
}
