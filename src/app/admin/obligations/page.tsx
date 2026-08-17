import { requirePlatformAdmin } from "@/lib/auth/session";

export default async function AdminObligationsPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: rows } = await supabase
    .from("compliance_obligations")
    .select("code, title, frequency, issuing_authority, is_active, compliance_domains:domain_id(name)")
    .order("code");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">Compliance obligation library</h1>
      <p className="text-sm text-muted-foreground">
        Platform-owned master data (starting seed, not 2,000+ laws). Updates are an operations
        process — subscribe to MCA/SEBI/CPCB circulars or a legal-content partner over time.
      </p>
      <div className="overflow-x-auto border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Domain</th>
              <th className="px-3 py-2 text-left">Frequency</th>
              <th className="px-3 py-2 text-left">Authority</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.code} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">
                  {(row.compliance_domains as { name?: string } | null)?.name}
                </td>
                <td className="px-3 py-2">{row.frequency}</td>
                <td className="px-3 py-2">{row.issuing_authority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
