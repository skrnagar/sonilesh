import { uploadContractorDocumentAction } from "@/app/actions/contractors";
import { ActionForm } from "@/components/shared/action-form";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOrgContext } from "@/lib/auth/org-context";
import { hasFeature } from "@/lib/services/entitlements";
import { UpgradeState } from "@/components/shared/state-panels";

export default async function ContractorPortalDocumentsPage() {
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
    return <p className="text-sm text-muted-foreground">No contractor company is linked to this account.</p>;
  }

  const { data: docs } = await supabase
    .from("contractor_documents")
    .select("title, doc_type, verification_status, expires_on, status")
    .eq("organization_id", organization.id)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          You can upload evidence. Host EHS staff verify documents — you cannot verify your own
          files.
        </p>
      </div>
      <ActionForm action={uploadContractorDocumentAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <input type="hidden" name="companyId" value={companyId} />
        <Label>Title</Label>
        <Input name="title" required />
        <Label>Type</Label>
        <Input name="docType" required placeholder="insurance" />
        <Label>Expires</Label>
        <Input name="expiresOn" type="date" />
        <Label>File</Label>
        <Input name="file" type="file" />
        <Button type="submit">Upload</Button>
      </ActionForm>
      <RecordsTable
        columns={["Title", "Type", "Status", "Verification", "Expires"]}
        empty="No documents."
        rows={(docs ?? []).map((d) => [
          d.title,
          d.doc_type,
          <StatusPill key="s" value={d.status} />,
          <StatusPill key="v" value={d.verification_status} />,
          d.expires_on ?? "—",
        ])}
      />
    </div>
  );
}
