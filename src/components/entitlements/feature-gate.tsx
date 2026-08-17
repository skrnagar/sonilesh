import { EmptyState, UpgradeState } from "@/components/shared/state-panels";
import { hasFeature } from "@/lib/services/entitlements";
import { requireOrgContext } from "@/lib/auth/org-context";

export async function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { supabase, organization } = await requireOrgContext();
  const allowed = await hasFeature(supabase, organization.id, feature);
  if (allowed) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return (
    <UpgradeState featureName={feature.replaceAll("_", " ")} />
  );
}

export function LockedFeatureState({ featureName }: { featureName: string }) {
  return (
    <EmptyState
      title={`${featureName} is not included in your current plan`}
      description="Explore an upgrade with your administrator, or ask SONIL EHS360 support to enable a customer-specific override."
    />
  );
}
