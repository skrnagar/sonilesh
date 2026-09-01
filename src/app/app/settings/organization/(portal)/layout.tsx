import { OrgAdminShell } from "@/components/organization/org-admin-shell";
import { ForbiddenState } from "@/components/shared/state-panels";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";

export default async function OrganizationAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requireOrgAdminAccess();
  if (!access.permitted) return <ForbiddenState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Organization admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage your tenant profile, team access, subscription, and data policies.
        </p>
      </div>
      <OrgAdminShell organizationName={access.organization.name}>
        {children}
      </OrgAdminShell>
    </div>
  );
}
