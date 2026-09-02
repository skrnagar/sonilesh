import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { filterIQualityTilesForField } from "@/lib/navigation/iquality-launchpad";
import { IQualityLaunchpad } from "@/components/field/myzone-launchpad";

export default async function IQualityHubPage() {
  const { supabase, membershipId } = await requireOrgContext();
  const role = await resolveFieldRole(supabase, membershipId);
  const tiles = filterIQualityTilesForField(role);

  return <IQualityLaunchpad tiles={tiles} />;
}
