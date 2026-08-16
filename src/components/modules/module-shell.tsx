import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";

export async function ModuleShell({
  title,
  description,
  featureCode,
  permission,
  children,
}: {
  title: string;
  description: string;
  featureCode?: string;
  permission?: string;
  children?: React.ReactNode;
}) {
  const access = await requireModuleAccess({ featureCode, permission });

  if (!access.entitled && featureCode) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-primary">{title}</h1>
        <UpgradeState featureName={title} />
      </div>
    );
  }

  if (!access.permitted) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-primary">{title}</h1>
        <ForbiddenState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-primary">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children ?? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
          Module shell ready. Full CRUD arrives in later phases. Navigation, entitlement and
          permission gates are already enforced.
        </div>
      )}
    </div>
  );
}
