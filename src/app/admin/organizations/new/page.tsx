import { CreateOrgWizard } from "@/components/admin/create-org-wizard";
import { requirePlatformPermission } from "@/lib/auth/session";

export default async function AdminCreateOrganizationPage() {
  const { supabase } = await requirePlatformPermission("saas.organizations.create");
  const [{ data: plans }, { data: features }] = await Promise.all([
    supabase.from("plans").select("id, name, code, plan_type, price_monthly_cents, is_custom").eq("is_active", true).order("sort_order"),
    supabase.from("features").select("id, code, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Create organization</h1>
        <p className="text-sm text-muted-foreground">
          Company → plan → commercial terms → owner. Custom contracts use overrides, not a new codebase.
        </p>
      </div>
      <CreateOrgWizard plans={plans ?? []} features={features ?? []} />
    </div>
  );
}
