import { requireOrgContext } from "@/lib/auth/org-context";
import { greetingForNow } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { filterMyZoneTilesForField } from "@/lib/navigation/myzone-launchpad";
import { MyZoneLaunchpad } from "@/components/field/myzone-launchpad";

export default async function FieldHomePage() {
  const { profile, sites, projects, siteId, projectId, supabase, membershipId } =
    await requireOrgContext();

  const role = await resolveFieldRole(supabase, membershipId);
  const menuTiles = filterMyZoneTilesForField(role);
  const userName = profile?.full_name?.split(" ")[0] || "Field user";
  const siteName =
    sites.find((s) => s.id === siteId)?.name ?? sites[0]?.name ?? "Unassigned site";
  const projectName =
    projects.find((p) => p.id === projectId)?.name ??
    projects.find((p) => ("site_id" in p ? p.site_id === siteId : false))?.name ??
    projects[0]?.name ??
    "—";

  return (
    <MyZoneLaunchpad
      tiles={menuTiles}
      greeting={greetingForNow()}
      userName={userName}
      siteName={siteName}
      projectName={projectName}
    />
  );
}
