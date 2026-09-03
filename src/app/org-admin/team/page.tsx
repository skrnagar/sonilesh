import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  assignMemberScopeAction,
  updateMemberStatusAction,
} from "@/app/actions/hierarchy";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";
import { INVITE_ROLE_CODES } from "@/lib/constants/organization";
import { listOrganizationMembers } from "@/lib/services/invitations";
import { checkLimit } from "@/lib/services/entitlements";

export default async function OrgAdminTeamPage() {
  const access = await requireOrgAdminAccess();

  const [members, limit, { data: sites }, { data: bus }, { data: depts }] =
    await Promise.all([
      listOrganizationMembers(access.supabase, access.organization.id),
      checkLimit(access.supabase, access.organization.id, "max_users", 0),
      access.supabase
        .from("sites")
        .select("id, name")
        .eq("organization_id", access.organization.id)
        .is("deleted_at", null),
      access.supabase
        .from("business_units")
        .select("id, name")
        .eq("organization_id", access.organization.id)
        .is("deleted_at", null),
      access.supabase
        .from("departments")
        .select("id, name")
        .eq("organization_id", access.organization.id)
        .is("deleted_at", null),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[length:var(--text-app-title)] font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            Invite and manage users for the management dashboard. Plan limit:{" "}
            {limit.unlimited || limit.limit == null
              ? "unlimited"
              : `${limit.limit} (remaining ${limit.remaining ?? 0})`}
            .
          </p>
        </div>
        <Button asChild>
          <Link href="/org-admin/team/invite">Invite member</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Scope</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No team members yet.
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const profile = member.profiles as unknown as {
                  full_name?: string;
                  email?: string;
                } | null;
                const roles = (member.member_roles ?? []) as unknown as Array<{
                  scope: string;
                  roles: { code: string; name: string } | null;
                }>;
                const primary = roles[0];
                return (
                  <tr key={member.id} className="border-t border-border align-top">
                    <td className="px-3 py-2 font-medium">
                      {profile?.full_name || "—"}
                      {member.is_owner ? (
                        <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                          owner
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{profile?.email || member.invited_email}</td>
                    <td className="px-3 py-2">{primary?.roles?.name ?? "—"}</td>
                    <td className="px-3 py-2 capitalize">
                      {(primary?.scope ?? "organization").replace("_", " ")}
                    </td>
                    <td className="px-3 py-2 capitalize">{member.status}</td>
                    <td className="px-3 py-2 space-y-2">
                      <ActionForm
                        action={updateMemberStatusAction}
                        className="flex flex-wrap gap-1"
                      >
                        <input type="hidden" name="memberId" value={member.id} />
                        {member.status === "active" ? (
                          <Button
                            type="submit"
                            name="status"
                            value="suspended"
                            size="sm"
                            variant="outline"
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            name="status"
                            value="active"
                            size="sm"
                            variant="outline"
                          >
                            Reactivate
                          </Button>
                        )}
                      </ActionForm>
                      <ActionForm
                        action={assignMemberScopeAction}
                        className="grid max-w-xs gap-1 rounded-lg border border-border p-2"
                      >
                        <input type="hidden" name="memberId" value={member.id} />
                        <Select
                          name="roleCode"
                          defaultValue={primary?.roles?.code ?? "employee"}
                        >
                          {INVITE_ROLE_CODES.map((code) => (
                            <option key={code} value={code}>
                              {code.replace(/_/g, " ")}
                            </option>
                          ))}
                        </Select>
                        <Select name="scope" defaultValue={primary?.scope ?? "organization"}>
                          <option value="organization">Organization</option>
                          <option value="business_unit">Business unit</option>
                          <option value="site">Site</option>
                          <option value="project">Project</option>
                          <option value="department">Department</option>
                          <option value="self">Self</option>
                        </Select>
                        <Select name="businessUnitId" defaultValue="">
                          <option value="">BU (optional)</option>
                          {(bus ?? []).map((bu) => (
                            <option key={bu.id} value={bu.id}>
                              {bu.name}
                            </option>
                          ))}
                        </Select>
                        <Select name="siteId" defaultValue="">
                          <option value="">Site (optional)</option>
                          {(sites ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </Select>
                        <Select name="departmentId" defaultValue="">
                          <option value="">Dept (optional)</option>
                          {(depts ?? []).map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" size="sm">
                          Change role
                        </Button>
                      </ActionForm>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
