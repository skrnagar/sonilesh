import { upsertContractorCategoryAction, upsertContractorSettingsAction } from "@/app/actions/contractors";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { SettingsNav } from "@/components/organization/settings-nav";
import { ActionForm } from "@/components/shared/action-form";
import { RecordsTable } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  getContractorSettings,
  listContractorCategories,
} from "@/lib/services/contractors";

export default async function ContractorCategoriesSettingsPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.manage",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const [categories, settings] = await Promise.all([
    listContractorCategories(access.supabase, access.organization.id),
    getContractorSettings(access.supabase, access.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Contractor settings</h1>
        <p className="text-sm text-muted-foreground">
          Example categories (civil, electrical, …) are templates — not legal classifications.
          Thresholds are blank until you set them.
        </p>
      </div>
      <SettingsNav current="/app/settings/contractors/categories" />
      <ContractorsNav current="/app/settings/contractors/categories" />

      <ActionForm
        action={upsertContractorSettingsAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2"
      >
        <div className="space-y-1">
          <Label>Prequal pass %</Label>
          <Input
            name="prequalPassPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={settings.prequal_pass_percent ?? ""}
            placeholder="Not set"
          />
        </div>
        <div className="space-y-1">
          <Label>Prequal conditional %</Label>
          <Input
            name="prequalConditionalPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={settings.prequal_conditional_percent ?? ""}
            placeholder="Not set"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Mandatory document types (comma-separated)</Label>
          <Input
            name="mandatoryDocTypes"
            defaultValue={settings.mandatory_doc_types.join(", ")}
            placeholder="insurance, labour_license"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enforceMandatoryDocs" defaultChecked={settings.enforce_mandatory_docs} />
          Expired/missing mandatory docs block readiness
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="inductionRequired" defaultChecked={settings.induction_required} />
          Induction required for worker readiness
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="ptwEnforceReadiness" defaultChecked={settings.ptw_enforce_readiness} />
          Enforce contractor readiness on PTW (off = advisory only)
        </label>
        <Button type="submit">Save settings</Button>
      </ActionForm>

      <ActionForm
        action={upsertContractorCategoryAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4"
      >
        <Input name="code" placeholder="code" required />
        <Input name="name" placeholder="Name" required />
        <Input name="description" placeholder="Description" />
        <Button type="submit">Add org category</Button>
      </ActionForm>

      <RecordsTable
        columns={["Code", "Name", "Source"]}
        empty="No categories."
        rows={categories.map((c) => [
          c.code,
          c.name,
          c.organization_id ? "This organization" : "Example template",
        ])}
      />
    </div>
  );
}
