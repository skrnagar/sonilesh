import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listCurrentSds } from "@/lib/services/chemicals";
import { formatDate } from "@/lib/utils";

export default async function SdsRegisterPage() {
  const access = await requireModuleAccess({
    featureCode: "chemical_sds",
    permission: "chemicals.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Chemical / SDS" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await listCurrentSds(access.supabase, access.organization.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Current SDS register</h1>
        <p className="text-sm text-muted-foreground">
          Current uploaded files only. Open a chemical to view the signed SDS — nothing is extracted automatically.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Chemical</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Expires</th>
              <th className="px-3 py-2">File</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No current SDS files.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const chem = r.chemicals as { id?: string; name?: string; cas_number?: string } | null;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      {chem?.id ? (
                        <Link href={`/app/chemicals/${chem.id}`} className="text-accent hover:underline">
                          {chem.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">{r.version}</td>
                    <td className="px-3 py-2">{formatDate(r.expires_on)}</td>
                    <td className="px-3 py-2">{r.file_name ?? "Uploaded file"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
