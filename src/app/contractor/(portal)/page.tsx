import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireOrgContext } from "@/lib/auth/org-context";
import { hasFeature } from "@/lib/services/entitlements";
import { UpgradeState } from "@/components/shared/state-panels";

export default async function ContractorPortalHomePage() {
  const { supabase, user, organization } = await requireOrgContext();
  const entitled = await hasFeature(supabase, organization.id, "contractor_management");
  if (!entitled) return <UpgradeState featureName="Contractor portal" />;

  const { data: member } = await supabase
    .from("organization_members")
    .select("contractor_company_id")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const companyId = member?.contractor_company_id;
  if (!companyId) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        This account is not linked to a contractor company. Ask the host EHS team to send a portal
        invite.
      </div>
    );
  }

  const [{ data: company }, { data: projects }, { data: docs }] = await Promise.all([
    supabase
      .from("contractor_companies")
      .select("id, name, status")
      .eq("id", companyId)
      .eq("organization_id", organization.id)
      .maybeSingle(),
    supabase
      .from("contractor_project_assignments")
      .select("status, projects:project_id(name)")
      .eq("organization_id", organization.id)
      .eq("company_id", companyId),
    supabase
      .from("contractor_documents")
      .select("title, doc_type, verification_status, expires_on")
      .eq("organization_id", organization.id)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{company?.name ?? "Contractor home"}</h1>
        <p className="text-sm text-muted-foreground">
          Assigned projects and document status only. This is not the internal EHS admin.
        </p>
      </div>
      <RecordsTable
        columns={["Project", "Access"]}
        empty="No project assignments yet."
        rows={(projects ?? []).map((p) => [
          (p.projects as { name?: string } | null)?.name ?? "—",
          <StatusPill key="s" value={p.status} />,
        ])}
      />
      <RecordsTable
        columns={["Document", "Type", "Verification", "Expires"]}
        empty="No documents uploaded."
        rows={(docs ?? []).map((d) => [
          d.title,
          d.doc_type,
          <StatusPill key="v" value={d.verification_status} />,
          d.expires_on ?? "—",
        ])}
      />
    </div>
  );
}
