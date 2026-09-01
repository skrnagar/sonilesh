import { HomeLaunchpad, resolvePersonaTiles } from "@/components/home/launchpad";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";

export default async function HomePage() {
  const { supabase, user, profile, organization } = await requireOrgContext();
  const { roleCodes } = await getRoleCodesForUser(supabase, user.id, organization.id);
  const { persona, tiles } = resolvePersonaTiles(roleCodes);
  const userName = profile?.full_name || profile?.email || user.email || "";

  return (
    <HomeLaunchpad
      persona={persona}
      tiles={tiles}
      organizationName={organization.name}
      userName={userName}
    />
  );
}
