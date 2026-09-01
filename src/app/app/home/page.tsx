import { HomeLaunchpad } from "@/components/home/launchpad";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import {
  filterLaunchpadTiles,
  groupLaunchpadBySection,
  LAUNCHPAD_SECTION_ORDER,
  LAUNCHPAD_TILES,
  resolvePersonaLabel,
  selectDashboardTiles,
  type LaunchpadSection,
} from "@/lib/navigation/launchpad";
import { filterRakshaLaunchpadForWeb } from "@/lib/navigation/raksha-launchpad";
import { listEnabledFeatures } from "@/lib/services/entitlements";
import { getUserPermissions } from "@/lib/services/rbac";

export default async function HomePage() {
  const { supabase, user, profile, organization } = await requireOrgContext();
  const [{ roleCodes }, enabledFeatures, permissions] = await Promise.all([
    getRoleCodesForUser(supabase, user.id, organization.id),
    listEnabledFeatures(supabase, organization.id),
    getUserPermissions(supabase, organization.id, user.id),
  ]);

  const persona = resolvePersonaLabel(roleCodes);
  const visible = filterLaunchpadTiles(LAUNCHPAD_TILES, enabledFeatures, permissions);
  const grouped = groupLaunchpadBySection(visible);

  const sections = Object.fromEntries(
    LAUNCHPAD_SECTION_ORDER.map((section) => {
      if (section === "dashboard") {
        return [section, selectDashboardTiles(visible, roleCodes)];
      }
      return [section, grouped[section as LaunchpadSection]];
    }),
  ) as Record<LaunchpadSection, typeof visible>;

  const userName = profile?.full_name || profile?.email || user.email || "";
  const rakshaTiles = filterRakshaLaunchpadForWeb(permissions);

  return (
    <HomeLaunchpad
      persona={persona}
      sections={sections}
      organizationName={organization.name}
      userName={userName}
      rakshaTiles={rakshaTiles}
    />
  );
}
