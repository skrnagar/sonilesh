import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listRegulations } from "@/lib/services/legal-register";

export default async function RegulationsPage() {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await listRegulations(access.supabase, access.organization.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Regulations catalog</h1>
        <p className="text-sm text-muted-foreground">
          Metadata linked to configured obligations. Titles in this list are not evaluated as hard-coded
          statute logic — applicability comes from JSON rules on the obligation.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Authority</th>
              <th className="px-3 py-2 text-left">Jurisdiction</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">{row.issuing_authority}</td>
                <td className="px-3 py-2">
                  {(row.jurisdictions as { code?: string } | null)?.code ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
