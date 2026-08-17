import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getMocMetrics, listMocRequests } from "@/lib/services/moc";

export default async function MocPage() {
  const access = await requireModuleAccess({ featureCode: "moc", permission: "moc.view" });
  if (!access.entitled) return <UpgradeState featureName="Management of Change" />;
  if (!access.permitted) return <ForbiddenState />;

  const [rows, metrics] = await Promise.all([
    listMocRequests(access.supabase, access.organization.id),
    getMocMetrics(access.supabase, access.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Management of Change</h1>
          <p className="text-sm text-muted-foreground">
            Request → risk → approval → implementation → verification → close. Actions use CAPA.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/app/moc/new">New MOC</Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["Total", metrics.total],
          ["Open", metrics.open],
          ["Approval", metrics.approval],
          ["Implementation", metrics.implementation],
          ["Verification", metrics.verification],
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
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No MOC requests.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link href={`/app/moc/${r.id}`} className="font-medium text-accent hover:underline">
                      {r.moc_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">{r.change_type ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className="capitalize">
                      {String(r.status).replace(/_/g, " ")}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
