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
        <h1 className="font-display text-[length:var(--text-app-title)] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <UpgradeState featureName={title} />
      </div>
    );
  }

  if (!access.permitted) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-[length:var(--text-app-title)] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <ForbiddenState />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="font-display text-[length:var(--text-app-title)] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children ?? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-card/80 p-6 text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
          Module shell ready. Full CRUD arrives in later phases. Navigation, entitlement and
          permission gates are already enforced.
        </div>
      )}
    </div>
  );
}
