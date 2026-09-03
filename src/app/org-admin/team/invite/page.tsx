import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { inviteUserAction } from "@/app/actions/hierarchy";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";
import { INVITE_ROLE_CODES } from "@/lib/constants/organization";
import { checkLimit } from "@/lib/services/entitlements";

export default async function OrgAdminTeamInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; token?: string }>;
}) {
  const params = await searchParams;
  const access = await requireOrgAdminAccess();

  const [limit, { data: sites }, { data: bus }, { data: depts }] = await Promise.all([
    checkLimit(access.supabase, access.organization.id, "max_users", 1),
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

  const acceptUrl =
    params.token && typeof process.env.NEXT_PUBLIC_APP_URL === "string"
      ? `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${params.token}`
      : params.token
        ? `/invite/accept?token=${params.token}`
        : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--text-app-title)] font-semibold tracking-tight">Invite team member</h1>
        <p className="text-sm text-muted-foreground">
          Secure token invitations with configurable expiry (default{" "}
          {process.env.INVITE_EXPIRY_DAYS ?? "7"} days).
        </p>
      </div>

      <p className="text-sm">
        <Link className="underline" href="/org-admin/team">
          ← Back to team
        </Link>
      </p>

      {!limit.allowed ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          Your current plan allows {limit.limit ?? 0} users.{" "}
          <Link className="underline" href="/org-admin/plan">
            View plan
          </Link>{" "}
          or contact sales.
        </div>
      ) : null}

      {params.sent && acceptUrl ? (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          Invitation created. Share this accept link (token shown once):{" "}
          <code className="break-all text-xs">{acceptUrl}</code>
        </div>
      ) : null}

      <ActionForm
        action={inviteUserAction}
        className="grid max-w-2xl gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2"
      >
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fullName">Name</Label>
          <Input id="fullName" name="fullName" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="roleCode">Role</Label>
          <Select id="roleCode" name="roleCode" defaultValue="ehs_officer">
            {INVITE_ROLE_CODES.map((code) => (
              <option key={code} value={code}>
                {code.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="scope">Scope</Label>
          <Select id="scope" name="scope" defaultValue="organization">
            <option value="organization">Organization</option>
            <option value="business_unit">Business unit</option>
            <option value="site">Site</option>
            <option value="project">Project</option>
            <option value="department">Department</option>
            <option value="self">Self</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="businessUnitId">Business unit</Label>
          <Select id="businessUnitId" name="businessUnitId" defaultValue="">
            <option value="">Optional</option>
            {(bus ?? []).map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId" defaultValue="">
            <option value="">Optional</option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="departmentId">Department</Label>
          <Select id="departmentId" name="departmentId" defaultValue="">
            <option value="">Optional</option>
            {(depts ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="w-fit md:col-span-2" disabled={!limit.allowed}>
          Send invitation
        </Button>
      </ActionForm>
    </div>
  );
}
