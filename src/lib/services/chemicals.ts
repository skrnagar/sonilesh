import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import {
  assertPrivateAttachmentPath,
  createSignedAttachmentUrl,
  uploadEntityAttachment,
} from "@/lib/services/attachments";
import { assertOrgMatch } from "@/lib/services/documents";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";

async function requireSds(supabase: SupabaseClient, organizationId: string, userId: string, permission: string) {
  await requireFeature(supabase, organizationId, "chemical_sds");
  await requirePermission(supabase, organizationId, userId, permission);
}

export function fieldChemicalPath(chemicalId: string) {
  return `/field/chemicals/${chemicalId}`;
}

export async function getChemicalMetrics(supabase: SupabaseClient, organizationId: string) {
  const [{ count: total }, { data: chemicals }, { data: currentSds }] = await Promise.all([
    supabase.from("chemicals").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("chemicals").select("id").eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("chemical_sds").select("chemical_id").eq("organization_id", organizationId).eq("is_current", true),
  ]);
  const withSds = new Set((currentSds ?? []).map((r) => r.chemical_id));
  const missingSds = (chemicals ?? []).filter((c) => !withSds.has(c.id)).length;
  return { total: total ?? 0, withCurrentSds: withSds.size, missingSds };
}

export async function listChemicals(
  supabase: SupabaseClient,
  organizationId: string,
  opts?: { query?: string; locationId?: string; siteId?: string },
) {
  let q = supabase
    .from("chemicals")
    .select(
      "id, name, cas_number, hazard_classification, location_id, site_id, status, inventory_qty, inventory_unit, manufacturer, locations:location_id(name), sites:site_id(name)",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");
  if (opts?.locationId) q = q.eq("location_id", opts.locationId);
  if (opts?.siteId) q = q.eq("site_id", opts.siteId);
  if (opts?.query) {
    const term = opts.query.replace(/[%*,]/g, "").trim();
    if (term) q = q.or(`name.ilike.%${term}%,cas_number.ilike.%${term}%,un_number.ilike.%${term}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function searchFieldChemicals(
  supabase: SupabaseClient,
  organizationId: string,
  query: string,
) {
  return listChemicals(supabase, organizationId, { query });
}

export async function getChemicalBundle(
  supabase: SupabaseClient,
  organizationId: string,
  chemicalId: string,
) {
  const { data: chemical, error } = await supabase
    .from("chemicals")
    .select("*, locations:location_id(id, name), sites:site_id(id, name)")
    .eq("id", chemicalId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!chemical) return null;

  const [{ data: sdsRows }, { data: inventory }] = await Promise.all([
    supabase
      .from("chemical_sds")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("chemical_id", chemicalId)
      .order("created_at", { ascending: false }),
    supabase
      .from("chemical_inventory")
      .select("*, locations:location_id(name)")
      .eq("organization_id", organizationId)
      .eq("chemical_id", chemicalId),
  ]);

  const sds = await Promise.all(
    (sdsRows ?? []).map(async (row) => {
      const path = row.storage_path || row.file_url;
      let url: string | null = null;
      if (path && !/^https?:\/\//i.test(path)) {
        try {
          url = await createSignedAttachmentUrl(supabase, path);
        } catch {
          url = null;
        }
      }
      return { ...row, signed_url: url };
    }),
  );

  return {
    chemical,
    sds,
    currentSds: sds.find((r) => r.is_current) ?? null,
    inventory: inventory ?? [],
    fieldPath: fieldChemicalPath(chemical.id),
  };
}

export async function createChemical(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    casNumber?: string;
    hazardClassification?: string;
    locationId?: string;
    siteId?: string;
    unNumber?: string;
    manufacturer?: string;
    productCode?: string;
    signalWord?: string;
    usageNotes?: string;
    inventoryQty?: number;
    inventoryUnit?: string;
  },
) {
  await requireSds(supabase, input.organizationId, input.userId, "chemicals.manage");
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Chemical name is required");

  if (input.locationId) {
    const { data: loc } = await supabase
      .from("locations")
      .select("id, organization_id")
      .eq("id", input.locationId)
      .maybeSingle();
    if (!loc || loc.organization_id !== input.organizationId) {
      throw new Error("Location must belong to this organization");
    }
  }
  if (input.siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id, organization_id")
      .eq("id", input.siteId)
      .maybeSingle();
    if (!site || site.organization_id !== input.organizationId) {
      throw new Error("Site must belong to this organization");
    }
  }

  const { data, error } = await supabase
    .from("chemicals")
    .insert({
      organization_id: input.organizationId,
      name,
      cas_number: input.casNumber || null,
      hazard_classification: input.hazardClassification || null,
      location_id: input.locationId || null,
      site_id: input.siteId || null,
      un_number: input.unNumber || null,
      manufacturer: input.manufacturer || null,
      product_code: input.productCode || null,
      signal_word: input.signalWord || null,
      usage_notes: input.usageNotes || null,
      inventory_qty: input.inventoryQty ?? 0,
      inventory_unit: input.inventoryUnit || "L",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "chemical.created",
    entityType: "chemical",
    entityId: data.id,
    newValues: { name },
  });
  return data;
}

export async function uploadSds(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    chemicalId: string;
    version: string;
    file: File;
    effectiveFrom?: string;
    expiresOn?: string;
    notes?: string;
  },
) {
  await requireSds(supabase, input.organizationId, input.userId, "chemicals.manage");
  const { data: chemical } = await supabase
    .from("chemicals")
    .select("id, organization_id")
    .eq("id", input.chemicalId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!chemical) throw new Error("Chemical not found in this organization");
  assertOrgMatch(chemical.organization_id, input.organizationId, "Chemical");

  const version = input.version.trim() || new Date().toISOString().slice(0, 10);
  const { data: sds, error } = await supabase
    .from("chemical_sds")
    .insert({
      organization_id: input.organizationId,
      chemical_id: input.chemicalId,
      version,
      effective_from: input.effectiveFrom || new Date().toISOString().slice(0, 10),
      expires_on: input.expiresOn || null,
      is_current: false,
      uploaded_by: input.userId,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const attachment = await uploadEntityAttachment(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    entityType: "chemical_sds",
    entityId: sds.id,
    file: input.file,
  });
  assertPrivateAttachmentPath(attachment.storage_path);

  await supabase
    .from("chemical_sds")
    .update({ is_current: false, superseded_at: new Date().toISOString() })
    .eq("chemical_id", input.chemicalId)
    .eq("organization_id", input.organizationId)
    .eq("is_current", true)
    .neq("id", sds.id);

  const { data: current, error: updErr } = await supabase
    .from("chemical_sds")
    .update({
      storage_path: attachment.storage_path,
      file_url: attachment.storage_path,
      file_name: attachment.file_name,
      mime_type: attachment.mime_type,
      file_size: attachment.file_size,
      attachment_id: attachment.id,
      is_current: true,
    })
    .eq("id", sds.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "sds.uploaded",
    entityType: "chemical_sds",
    entityId: sds.id,
    newValues: { chemical_id: input.chemicalId, version },
  });
  return current;
}

export async function listCurrentSds(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("chemical_sds")
    .select("id, version, expires_on, file_name, chemicals:chemical_id(id, name, cas_number, location_id)")
    .eq("organization_id", organizationId)
    .eq("is_current", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertChemicalInventory(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    chemicalId: string;
    locationId: string;
    quantity: number;
    unit?: string;
  },
) {
  await requireSds(supabase, input.organizationId, input.userId, "chemicals.manage");
  const [{ data: chemical }, { data: location }] = await Promise.all([
    supabase.from("chemicals").select("id").eq("id", input.chemicalId).eq("organization_id", input.organizationId).maybeSingle(),
    supabase.from("locations").select("id").eq("id", input.locationId).eq("organization_id", input.organizationId).maybeSingle(),
  ]);
  if (!chemical) throw new Error("Chemical not found in this organization");
  if (!location) throw new Error("Location must belong to this organization");

  const { data, error } = await supabase
    .from("chemical_inventory")
    .upsert(
      {
        organization_id: input.organizationId,
        chemical_id: input.chemicalId,
        location_id: input.locationId,
        quantity: input.quantity,
        unit: input.unit || "L",
        updated_by: input.userId,
      },
      { onConflict: "chemical_id,location_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
