import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getUserPermissions } from "@/lib/services/rbac";

export default async function NcModulePage() {
  const { supabase, organization, user } = await requireOrgContext();
  const permissions = await getUserPermissions(supabase, organization.id, user.id);

  if (!permissions.includes("findings.view")) {
    return (
      <div className="app-page-stagger space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Non-conformance</h1>
        <p className="text-sm text-muted-foreground">You do not have permission to view NC records.</p>
      </div>
    );
  }

  return (
    <div className="app-page-stagger space-y-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Non-conformance (NC)</h1>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Dedicated NC register and workflow is coming soon. Track open audit and inspection findings
        until the full NC module is available.
      </p>
      <Link
        href="/app/findings"
        className="inline-flex text-sm font-semibold text-[var(--raksha-blue-dark)] hover:underline"
      >
        View open findings →
      </Link>
    </div>
  );
}
