import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireOrgContext } from "@/lib/auth/org-context";
import { hasFeature } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";
import { REPORT_TYPE_CODES, REPORT_TYPE_META } from "@/lib/reporting/types";

export default async function NewReportPage() {
  const ctx = await requireOrgContext();
  const types = await Promise.all(
    REPORT_TYPE_CODES.map(async (code) => {
      const meta = REPORT_TYPE_META[code];
      const [entitled, permitted] = await Promise.all([
        hasFeature(ctx.supabase, ctx.organization.id, meta.featureCode),
        userHasPermission(
          ctx.supabase,
          ctx.organization.id,
          ctx.user.id,
          meta.permissionCreate,
        ),
      ]);
      return { code, meta, entitled, permitted };
    }),
  );

  const available = types.filter((t) => t.entitled && t.permitted);
  if (!types.some((t) => t.entitled)) {
    return <UpgradeState featureName="EHS Reporting" />;
  }
  if (!available.length) return <ForbiddenState />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">What do you want to report?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All report types share one reporting engine — fields and workflows adapt by type.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {types.map(({ code, meta, entitled, permitted }) => {
          const href = `${meta.listPath}/new?type=${code}`;
          const disabled = !entitled || !permitted;
          return (
            <Link
              key={code}
              href={disabled ? "/app/settings/subscription" : href}
              className={
                disabled
                  ? "rounded-2xl border border-dashed border-border p-5 opacity-50"
                  : "rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary"
              }
            >
              <p className="text-lg font-semibold">{meta.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {!entitled
                  ? "Not in your plan — upgrade"
                  : !permitted
                    ? "Missing create permission"
                    : `Opens ${meta.label.toLowerCase()} form`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
