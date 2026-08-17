import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getDocumentMetrics, listDocuments } from "@/lib/services/documents";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage() {
  const access = await requireModuleAccess({
    featureCode: "document_control",
    permission: "documents.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Document control" />;
  if (!access.permitted) return <ForbiddenState />;

  const [rows, metrics] = await Promise.all([
    listDocuments(access.supabase, access.organization.id),
    getDocumentMetrics(access.supabase, access.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Document control</h1>
          <p className="text-sm text-muted-foreground">
            Versions · approval · review · acknowledgement · distribution. Files use signed URLs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/compliance/expiry">Expiry</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/documents/new">New document</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Total", metrics.total],
          ["Draft", metrics.draft],
          ["In review", metrics.inReview],
          ["Published", metrics.published],
          ["Expiring / due", metrics.expiring],
          ["Obsolete", metrics.obsolete],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Expires</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No controlled documents.{" "}
                  <Link href="/app/documents/new" className="text-accent underline">
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const type = r.document_types as { name?: string } | null;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link href={`/app/documents/${r.id}`} className="font-medium text-accent hover:underline">
                        {r.doc_number}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2">{type?.name ?? "—"}</td>
                    <td className="px-3 py-2">{r.current_version ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="capitalize">
                        {String(r.status).replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{formatDate(r.expires_on)}</td>
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
