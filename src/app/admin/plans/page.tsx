import {
  adminArchivePlanAction,
  adminCreatePlanAction,
  adminDuplicatePlanAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { canManagePlans } from "@/lib/auth/platform";
import { requirePlatformPermission } from "@/lib/auth/session";

export default async function AdminPlansPage() {
  const { supabase, platformRole } = await requirePlatformPermission("saas.plans.view");
  const { data: plans } = await supabase.from("plans").select("*").order("sort_order");
  const canEdit = canManagePlans(platformRole);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Plans</h1>
        <p className="text-sm text-muted-foreground">
          Catalog is database-driven. Application logic never branches on plan names.
        </p>
      </div>
      {canEdit ? (
        <form action={adminCreatePlanAction} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>Code</Label>
            <Input name="code" placeholder="optional" />
          </div>
          <div>
            <Label>Type</Label>
            <Select name="planType" defaultValue="standard">
              <option value="trial">trial</option>
              <option value="standard">standard</option>
              <option value="enterprise">enterprise</option>
              <option value="custom">custom</option>
            </Select>
          </div>
          <div>
            <Label>Monthly $</Label>
            <Input name="priceMonthly" type="number" step="0.01" defaultValue="0" />
          </div>
          <div>
            <Label>Yearly $</Label>
            <Input name="priceYearly" type="number" step="0.01" defaultValue="0" />
          </div>
          <label className="flex items-center gap-2 text-xs md:col-span-2">
            <input type="checkbox" name="isPublic" value="true" /> Public
          </label>
          <div className="md:col-span-6">
            <Label>Description</Label>
            <Input name="description" />
          </div>
          <div className="md:col-span-6">
            <Button type="submit">Create plan</Button>
          </div>
        </form>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Monthly</th>
              <th className="px-3 py-2 text-left">Yearly</th>
              <th className="px-3 py-2 text-left">Public</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(plans ?? []).map((plan) => (
              <tr key={plan.id} className="border-t border-border">
                <td className="px-3 py-2">{plan.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{plan.code}</td>
                <td className="px-3 py-2">{plan.plan_type ?? "standard"}</td>
                <td className="px-3 py-2">${(plan.price_monthly_cents / 100).toFixed(2)}</td>
                <td className="px-3 py-2">${(plan.price_yearly_cents / 100).toFixed(2)}</td>
                <td className="px-3 py-2">{plan.is_public ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{plan.is_active ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  {canEdit ? (
                    <div className="flex gap-1">
                      <form action={adminDuplicatePlanAction}>
                        <input type="hidden" name="planId" value={plan.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Duplicate
                        </Button>
                      </form>
                      <form action={adminArchivePlanAction}>
                        <input type="hidden" name="planId" value={plan.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Archive
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
