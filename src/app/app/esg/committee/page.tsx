import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveCommitteeMemberAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function EsgCommitteePage() {
  const access = await requireModuleAccess({
    featureCode: "esg_reporting",
    permission: "esg.view",
  });
  if (!access.entitled) return <UpgradeState featureName="ESG / BRSR reporting" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: members }, { data: people }] = await Promise.all([
    access.supabase
      .from("esg_committee")
      .select("id, role, member_user_id, profiles:member_user_id(full_name, email)")
      .eq("organization_id", access.organization.id),
    access.supabase
      .from("organization_members")
      .select("user_id, profiles:user_id(full_name, email)")
      .eq("organization_id", access.organization.id)
      .eq("status", "active"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ESG / Sustainability Committee</h1>
        <p className="text-sm text-muted-foreground">
          Governance foundation for BRSR Section A. Committee members review; officers enter data.
        </p>
      </div>
      <ul className="space-y-2 text-sm">
        {(members ?? []).map((row) => {
          const profile = row.profiles as { full_name?: string; email?: string } | null;
          return (
            <li key={row.id} className="rounded-xl border border-border bg-card px-4 py-3">
              {profile?.full_name || profile?.email} — {row.role}
            </li>
          );
        })}
      </ul>
      <ActionForm action={saveCommitteeMemberAction} className="max-w-lg space-y-3 rounded-2xl border border-border bg-card p-4">
        <select name="memberUserId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required>
          <option value="">Select member</option>
          {(people ?? []).map((row) => {
            const profile = row.profiles as { full_name?: string; email?: string } | null;
            return (
              <option key={row.user_id} value={row.user_id}>
                {profile?.full_name || profile?.email}
              </option>
            );
          })}
        </select>
        <Input name="role" placeholder="Role (Chair / Member / Invitee)" required />
        <Button type="submit">Add / update</Button>
      </ActionForm>
    </div>
  );
}
