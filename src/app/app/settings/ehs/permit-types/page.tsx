import Link from "next/link";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function PermitTypesSettingsPage() {
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.configure",
  });
  if (!access.entitled) return <UpgradeState featureName="Permit to Work" />;
  if (!access.permitted) {
    // Fall back: allow settings.manage as configure proxy for tenant admins without new perm yet
    const admin = await requireModuleAccess({ permission: "settings.manage" });
    if (!admin.permitted) return <ForbiddenState />;
  }

  const orgId = access.organization.id;
  const { data: types } = await access.supabase
    .from("permit_types")
    .select(
      "id, code, name, description, is_system, is_active, sort_order, default_validity_hours, requires_risk_assessment, requires_isolation, number_prefix, organization_id",
    )
    .or(`organization_id.eq.${orgId},organization_id.is.null`)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Permit types</h1>
        <p className="text-sm text-muted-foreground">
          System seeds are examples (Hot Work, Confined Space, …). Organizations can add, edit,
          deactivate, and reorder types — never hard-coded in business logic.
        </p>
      </div>
      <SettingsNav current="/app/settings/ehs/permit-types" />

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Prefix</th>
              <th className="px-3 py-2">Validity (h)</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Isolation</th>
              <th className="px-3 py-2">Scope</th>
            </tr>
          </thead>
          <tbody>
            {(types ?? []).map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{t.code}</td>
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2">{t.number_prefix ?? "—"}</td>
                <td className="px-3 py-2">{t.default_validity_hours}</td>
                <td className="px-3 py-2">{t.requires_risk_assessment ? "Required" : "Optional"}</td>
                <td className="px-3 py-2">{t.requires_isolation ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  {t.organization_id ? "Organization" : "System seed"}
                  {!t.is_active ? " · inactive" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Checklist templates and approval rules are seeded per type in migration{" "}
        <code>00026</code>. Full visual type editor (create/edit/reorder) can extend this page
        without changing the PTW engine services.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/app/permits">Back to permits</Link>
      </Button>
    </div>
  );
}
