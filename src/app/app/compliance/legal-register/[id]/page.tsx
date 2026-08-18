import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getLegalRegisterDrilldown } from "@/lib/services/legal-register";

export default async function LegalRegisterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requireModuleAccess({
    featureCode: "legal_register",
    permission: "legal_register.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Legal register" />;
  if (!access.permitted) return <ForbiddenState />;

  const { id } = await params;
  const bundle = await getLegalRegisterDrilldown(
    access.supabase,
    access.organization.id,
    id,
    access.siteId,
  );
  if (!bundle) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Legal register entry</h1>
        <p className="text-sm text-muted-foreground">Not found in this organization or site scope.</p>
        <Link className="text-sm underline" href="/app/compliance/legal-register">
          Back
        </Link>
      </div>
    );
  }

  const regulation = bundle.entry.regulations as { code?: string; title?: string } | null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">
          <Link href="/app/compliance/legal-register" className="underline">
            Legal register
          </Link>
        </p>
        <h1 className="text-xl font-semibold">{bundle.entry.title}</h1>
        <p className="text-sm text-muted-foreground">
          {regulation ? `${regulation.code} — ${regulation.title}` : "No catalog regulation"} ·{" "}
          {bundle.entry.applicability_status} · {bundle.entry.status}. Snapshots on assessments are
          frozen. Not legal advice.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Requirements</h2>
        <ul className="divide-y rounded-2xl border border-border bg-card">
          {bundle.requirements.map((req) => (
            <li key={req.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{req.title}</p>
              <p className="text-xs text-muted-foreground">
                {req.frequency} · {req.status}
                {req.training_course_id ? " · training linked" : ""}
                {req.contractor_company_id ? " · contractor linked" : ""}
                {req.moc_request_id ? " · MOC linked" : ""}
                {req.risk_assessment_id ? " · risk linked" : ""}
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {bundle.assessments
                  .filter((asmt) => asmt.requirement_id === req.id)
                  .map((asmt) => (
                    <li key={asmt.id}>
                      Assessment {asmt.period_label} · {asmt.status}
                      {asmt.score_percent != null ? ` · ${asmt.score_percent}%` : ""}
                      {asmt.checklist_assignment_id ? (
                        <>
                          {" "}
                          <Link className="underline" href={`/app/inspections/${asmt.checklist_assignment_id}`}>
                            checklist
                          </Link>
                        </>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
          {!bundle.requirements.length ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">No requirements on this entry.</li>
          ) : null}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Findings → CAPA</h2>
        <ul className="divide-y rounded-2xl border border-border bg-card">
          {bundle.findings.map((finding) => {
            const capa = bundle.capas.find((row) => row.id === finding.capa_id);
            return (
              <li key={finding.id} className="px-4 py-3 text-sm">
                <Link className="font-medium underline" href="/app/findings">
                  {finding.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {finding.status}
                  {capa ? (
                    <>
                      {" "}
                      →{" "}
                      <Link className="underline" href="/app/capa">
                        {capa.title} ({capa.status})
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            );
          })}
          {!bundle.findings.length ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">No findings from assessments yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
