import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { installMarketplaceItemAction } from "@/app/actions/integrations";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/catalog";

export default async function MarketplacePage() {
  const access = await requireModuleAccess({
    featureCode: "marketplace",
    permission: "marketplace.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Marketplace" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: catalog }, { data: installs }] = await Promise.all([
    access.supabase
      .from("marketplace_catalog_items")
      .select("id, code, kind, name, description, feature_code")
      .eq("is_active", true)
      .order("name"),
    access.supabase
      .from("marketplace_installs")
      .select("catalog_item_id, status")
      .eq("organization_id", access.organization.id),
  ]);

  const installed = new Set((installs ?? []).map((row) => row.catalog_item_id));
  const items = catalog?.length ? catalog : MARKETPLACE_CATALOG;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Admin-only template and connector catalog. Install attaches an entitlement or workflow template —
          not a primary app entry point.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const code = "code" in item ? item.code : "";
          const id = "id" in item ? item.id : null;
          return (
            <div key={code} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">{item.kind}</p>
              <p className="mt-1 font-medium">{item.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              {id && installed.has(id) ? (
                <p className="mt-3 text-xs font-semibold text-muted-foreground">Installed</p>
              ) : (
                <ActionForm action={installMarketplaceItemAction} className="mt-3">
                  <input type="hidden" name="code" value={code} />
                  <Button type="submit" size="sm" variant="outline">
                    Install
                  </Button>
                </ActionForm>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
