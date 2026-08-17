import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { createAssignment } from "@/lib/services/checklists";
import { requireFeature } from "@/lib/services/entitlements";
import { notifyUsers } from "@/lib/services/notifications";
import { requirePermission } from "@/lib/services/rbac";

const EXAMPLE_PPE_CATEGORIES = [
  { code: "helmet", name: "Safety helmet" },
  { code: "eye", name: "Eye protection" },
  { code: "hearing", name: "Hearing protection" },
  { code: "respiratory", name: "Respiratory protection" },
  { code: "gloves", name: "Gloves" },
  { code: "footwear", name: "Safety footwear" },
  { code: "hi_vis", name: "Hi-visibility clothing" },
  { code: "fall", name: "Fall protection" },
] as const;

export type SiteScope = {
  organizationWide: boolean;
  siteIds: string[];
};

export function assertPpeSiteScope(scope: SiteScope, itemSiteId: string | null, issuanceSiteId?: string | null) {
  if (scope.organizationWide) return;
  if (!scope.siteIds.length) {
    throw new Error("PPE issue is limited to assigned sites");
  }
  if (itemSiteId && !scope.siteIds.includes(itemSiteId)) {
    throw new Error("PPE item is outside your site scope");
  }
  if (issuanceSiteId && !scope.siteIds.includes(issuanceSiteId)) {
    throw new Error("Cannot issue PPE outside your site scope");
  }
}

async function requirePpe(supabase: SupabaseClient, organizationId: string, userId: string, permission: string) {
  await requireFeature(supabase, organizationId, "ppe_management");
  await requirePermission(supabase, organizationId, userId, permission);
}

export async function loadMemberSiteScope(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<SiteScope> {
  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return { organizationWide: false, siteIds: [] };

  const { data: roles } = await supabase
    .from("member_roles")
    .select("scope, site_id")
    .eq("member_id", member.id)
    .is("deleted_at", null);
  const rows = roles ?? [];
  if (!rows.length) return { organizationWide: true, siteIds: [] };
  const orgWide = rows.some((r) => r.scope === "organization" || r.scope === "platform" || !r.site_id);
  if (orgWide) return { organizationWide: true, siteIds: [] };
  return {
    organizationWide: false,
    siteIds: rows.map((r) => r.site_id).filter(Boolean) as string[],
  };
}

export async function ensureDefaultPpeCategories(supabase: SupabaseClient, organizationId: string) {
  const { data: existing } = await supabase
    .from("ppe_categories")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1);
  if (existing?.length) return;
  await supabase.from("ppe_categories").insert(
    EXAMPLE_PPE_CATEGORIES.map((c) => ({
      organization_id: organizationId,
      code: c.code,
      name: c.name,
      is_example: true,
    })),
  );
}

export async function listPpeCategories(supabase: SupabaseClient, organizationId: string) {
  await ensureDefaultPpeCategories(supabase, organizationId);
  const { data, error } = await supabase
    .from("ppe_categories")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPpeMetrics(supabase: SupabaseClient, organizationId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [items, issued, expired, low] = await Promise.all([
    supabase.from("ppe_items").select("id, inventory_qty, min_stock").eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("ppe_issuances").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "issued"),
    supabase.from("ppe_issuances").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "issued").lt("expires_on", today),
    supabase.from("ppe_items").select("id").eq("organization_id", organizationId).is("deleted_at", null),
  ]);
  const lowStock = (items.data ?? []).filter((i) => Number(i.inventory_qty) <= Number(i.min_stock ?? 0)).length;
  void low;
  return {
    items: items.data?.length ?? 0,
    issued: issued.count ?? 0,
    expiredIssued: expired.count ?? 0,
    lowStock,
  };
}

export async function listPpeItems(supabase: SupabaseClient, organizationId: string, siteId?: string) {
  let q = supabase
    .from("ppe_items")
    .select("id, name, sku, inventory_qty, min_stock, size_label, status, site_id, ppe_categories:category_id(code, name), sites:site_id(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");
  if (siteId) q = q.eq("site_id", siteId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listPpeIssuances(
  supabase: SupabaseClient,
  organizationId: string,
  opts?: { userId?: string; status?: string; siteId?: string },
) {
  let q = supabase
    .from("ppe_issuances")
    .select(
      "id, status, issued_at, expires_on, quantity, site_id, user_id, item_id, ppe_items:item_id(name, sku), profiles:user_id(full_name, email)",
    )
    .eq("organization_id", organizationId)
    .order("issued_at", { ascending: false })
    .limit(80);
  if (opts?.userId) q = q.eq("user_id", opts.userId);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.siteId) q = q.eq("site_id", opts.siteId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPpeItem(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    categoryId?: string;
    sku?: string;
    inventoryQty?: number;
    minStock?: number;
    siteId?: string;
    sizeLabel?: string;
    manufacturer?: string;
    inspectionIntervalDays?: number;
  },
) {
  await requirePpe(supabase, input.organizationId, input.userId, "ppe.manage");
  const name = input.name.trim();
  if (!name) throw new Error("PPE item name is required");
  if (input.siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", input.siteId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!site) throw new Error("Site must belong to this organization");
  }
  const { data, error } = await supabase
    .from("ppe_items")
    .insert({
      organization_id: input.organizationId,
      name,
      category_id: input.categoryId || null,
      sku: input.sku || null,
      inventory_qty: input.inventoryQty ?? 0,
      min_stock: input.minStock ?? 0,
      site_id: input.siteId || null,
      size_label: input.sizeLabel || null,
      manufacturer: input.manufacturer || null,
      inspection_interval_days: input.inspectionIntervalDays ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function issuePpe(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    itemId: string;
    recipientUserId: string;
    siteId?: string;
    expiresOn?: string;
    quantity?: number;
    notes?: string;
  },
) {
  await requirePpe(supabase, input.organizationId, input.userId, "ppe.issue");
  const scope = await loadMemberSiteScope(supabase, input.organizationId, input.userId);

  const { data: item } = await supabase
    .from("ppe_items")
    .select("id, organization_id, site_id, inventory_qty, name")
    .eq("id", input.itemId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!item) throw new Error("PPE item not found in this organization");

  const issuanceSiteId = input.siteId || item.site_id || null;
  assertPpeSiteScope(scope, item.site_id, issuanceSiteId);

  const qty = input.quantity && input.quantity > 0 ? input.quantity : 1;
  if (Number(item.inventory_qty) < qty) {
    throw new Error("Insufficient PPE inventory");
  }

  const { data, error } = await supabase
    .from("ppe_issuances")
    .insert({
      organization_id: input.organizationId,
      item_id: item.id,
      user_id: input.recipientUserId,
      issued_by: input.userId,
      site_id: issuanceSiteId,
      expires_on: input.expiresOn || null,
      quantity: qty,
      notes: input.notes ?? null,
      status: "issued",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("ppe_items")
    .update({ inventory_qty: Number(item.inventory_qty) - qty })
    .eq("id", item.id)
    .eq("organization_id", input.organizationId);

  await notifyUsers(supabase, {
    organizationId: input.organizationId,
    userIds: [input.recipientUserId],
    title: `PPE issued: ${item.name}`,
    body: input.expiresOn ? `Expires ${input.expiresOn}` : undefined,
    link: "/app/ppe",
    actorUserId: input.userId,
    eventKey: "ppe.issued",
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "ppe.issued",
    entityType: "ppe_issuance",
    entityId: data.id,
  });
  return data;
}

export async function returnPpe(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    issuanceId: string;
    notes?: string;
    replace?: boolean;
  },
) {
  await requirePpe(supabase, input.organizationId, input.userId, "ppe.return");
  const { data: row } = await supabase
    .from("ppe_issuances")
    .select("*, ppe_items:item_id(id, inventory_qty)")
    .eq("id", input.issuanceId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!row) throw new Error("Issuance not found in this organization");
  if (row.status !== "issued") throw new Error("Only issued PPE can be returned");

  const { data, error } = await supabase
    .from("ppe_issuances")
    .update({
      status: input.replace ? "replaced" : "returned",
      returned_at: new Date().toISOString(),
      return_notes: input.notes ?? null,
      replaced_at: input.replace ? new Date().toISOString() : row.replaced_at,
    })
    .eq("id", row.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const item = row.ppe_items as { id: string; inventory_qty: number } | null;
  if (item && !input.replace) {
    await supabase
      .from("ppe_items")
      .update({ inventory_qty: Number(item.inventory_qty) + Number(row.quantity ?? 1) })
      .eq("id", item.id)
      .eq("organization_id", input.organizationId);
  }
  return data;
}

export async function schedulePpeInspection(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    itemId: string;
    templateId: string;
    issuanceId?: string;
    assigneeId?: string;
    dueDate?: string;
  },
) {
  await requirePpe(supabase, input.organizationId, input.userId, "ppe.inspect");
  const { data: item } = await supabase
    .from("ppe_items")
    .select("id, name, site_id")
    .eq("id", input.itemId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!item) throw new Error("PPE item not found in this organization");

  const assignment = await createAssignment(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    templateId: input.templateId,
    title: `PPE inspection — ${item.name}`,
    checklistType: "ppe",
    assigneeId: input.assigneeId,
    siteId: item.site_id ?? undefined,
    dueDate: input.dueDate,
  });

  const { data, error } = await supabase
    .from("ppe_inspections")
    .insert({
      organization_id: input.organizationId,
      item_id: item.id,
      issuance_id: input.issuanceId || null,
      assignment_id: assignment.id,
      inspector_id: input.assigneeId || input.userId,
      result: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { inspection: data, assignment };
}
