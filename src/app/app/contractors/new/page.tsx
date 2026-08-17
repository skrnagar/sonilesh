import Link from "next/link";
import { createContractorCompanyAction } from "@/app/actions/contractors";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listContractorCategories } from "@/lib/services/contractors";

export default async function NewContractorPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.create",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const categories = await listContractorCategories(access.supabase, access.organization.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Register contractor</h1>
          <p className="text-sm text-muted-foreground">
            Legal identifiers are optional data fields — not claimed as statutory requirements.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/contractors">Cancel</Link>
        </Button>
      </div>

      <ActionForm action={createContractorCompanyAction} className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="legalName">Legal name</Label>
            <Input id="legalName" name="legalName" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="categoryId">Category (examples)</Label>
            <Select id="categoryId" name="categoryId" defaultValue="">
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.organization_id ? "" : " (template)"}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input id="gstin" name="gstin" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pan">PAN</Label>
            <Input id="pan" name="pan" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <Button type="submit">Create contractor</Button>
      </ActionForm>
    </div>
  );
}
