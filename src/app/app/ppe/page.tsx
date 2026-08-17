import { createPpeItemAction, issuePpeAction, returnPpeAction, schedulePpeInspectionAction } from "@/app/actions/ppe";
import { ActionForm } from "@/components/shared/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  getPpeMetrics,
  listPpeCategories,
  listPpeIssuances,
  listPpeItems,
} from "@/lib/services/ppe";
import { formatDate } from "@/lib/utils";

export default async function PpePage() {
  const access = await requireModuleAccess({
    featureCode: "ppe_management",
    permission: "ppe.view",
  });
  if (!access.entitled) return <UpgradeState featureName="PPE management" />;
  if (!access.permitted) return <ForbiddenState />;

  const orgId = access.organization.id;
  const [items, issuances, metrics, categories, members, sites, templates] = await Promise.all([
    listPpeItems(access.supabase, orgId),
    listPpeIssuances(access.supabase, orgId),
    getPpeMetrics(access.supabase, orgId),
    listPpeCategories(access.supabase, orgId),
    access.supabase
      .from("organization_members")
      .select("user_id, profiles:user_id(full_name, email)")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .is("deleted_at", null),
    access.supabase.from("sites").select("id, name").eq("organization_id", orgId).is("deleted_at", null),
    access.supabase
      .from("checklist_templates")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("checklist_type", "ppe")
      .eq("is_active", true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">PPE management</h1>
        <p className="text-sm text-muted-foreground">
          Example types only. Issue / return, inspections via the checklist engine, site-scoped issue.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Items", metrics.items],
          ["Issued", metrics.issued],
          ["Expired issued", metrics.expiredIssued],
          ["Low stock", metrics.lowStock],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Inventory</h2>
        <ul className="text-sm">
          {items.map((i) => {
            const cat = i.ppe_categories as { name?: string } | null;
            return (
              <li key={i.id}>
                {i.name} {i.sku ? `(${i.sku})` : ""} · {i.inventory_qty} on hand · {cat?.name ?? "uncategorized"}
              </li>
            );
          })}
        </ul>
        <ActionForm action={createPpeItemAction} className="grid gap-2 sm:grid-cols-3">
          <Select name="categoryId">
            <option value="">Category (examples)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input name="name" placeholder="Item name" required />
          <Input name="sku" placeholder="SKU" />
          <Input name="inventoryQty" type="number" placeholder="Qty" />
          <Input name="minStock" type="number" placeholder="Min stock" />
          <Select name="siteId">
            <option value="">All sites</option>
            {(sites.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" className="sm:col-span-3">
            Add item
          </Button>
        </ActionForm>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Issue / return</h2>
        <ActionForm action={issuePpeAction} className="grid gap-2 sm:grid-cols-3">
          <Select name="itemId" required>
            <option value="">Item</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
          <Select name="recipientUserId" required>
            <option value="">Recipient</option>
            {(members.data ?? []).map((m) => {
              const p = m.profiles as { full_name?: string; email?: string } | null;
              return (
                <option key={m.user_id} value={m.user_id}>
                  {p?.full_name || p?.email}
                </option>
              );
            })}
          </Select>
          <Select name="siteId">
            <option value="">Site (optional)</option>
            {(sites.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Input name="expiresOn" type="date" />
          <Input name="quantity" type="number" defaultValue="1" />
          <Button type="submit" size="sm">
            Issue
          </Button>
        </ActionForm>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">Person</th>
                <th className="py-2">Status</th>
                <th className="py-2">Expires</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {issuances.map((r) => {
                const item = r.ppe_items as { name?: string } | null;
                const person = r.profiles as { full_name?: string } | null;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2">{item?.name}</td>
                    <td className="py-2">{person?.full_name ?? "—"}</td>
                    <td className="py-2">
                      <Badge variant="secondary">{r.status}</Badge>
                    </td>
                    <td className="py-2">{formatDate(r.expires_on)}</td>
                    <td className="py-2">
                      {r.status === "issued" ? (
                        <ActionForm action={returnPpeAction}>
                          <input type="hidden" name="issuanceId" value={r.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Return
                          </Button>
                        </ActionForm>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">PPE inspection (checklist engine)</h2>
        {(templates.data ?? []).length ? (
          <ActionForm action={schedulePpeInspectionAction} className="grid gap-2 sm:grid-cols-3">
            <Select name="itemId" required>
              <option value="">Item</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
            <Select name="templateId" required>
              {(templates.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Input name="dueDate" type="date" />
            <Button type="submit" size="sm" className="sm:col-span-3">
              Schedule inspection
            </Button>
          </ActionForm>
        ) : (
          <p className="text-sm text-muted-foreground">
            Create a checklist template with type PPE under Inspections to schedule inspections here.
          </p>
        )}
      </section>
    </div>
  );
}
