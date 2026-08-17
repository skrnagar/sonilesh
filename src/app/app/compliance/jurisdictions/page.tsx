import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listJurisdictions } from "@/lib/services/legal-register";

export default async function JurisdictionsPage() {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await listJurisdictions(access.supabase, access.organization.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Jurisdictions</h1>
        <p className="text-sm text-muted-foreground">
          Catalog used by configured applicability rules. Presence of a country here is not a legal
          opinion that any statute applies.
        </p>
      </div>
      <ul className="divide-y rounded-2xl border border-border bg-card">
        {rows.map((row) => (
          <li key={row.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
            <span>
              <span className="font-mono text-xs">{row.code}</span> · {row.name}
            </span>
            <span className="text-muted-foreground">
              {row.level}
              {row.organization_id ? " · org" : " · catalog"}
            </span>
          </li>
        ))}
        {!rows.length ? <li className="px-4 py-6 text-sm text-muted-foreground">No jurisdictions configured.</li> : null}
      </ul>
    </div>
  );
}
