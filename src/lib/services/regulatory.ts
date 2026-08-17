import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { notifyUsers } from "@/lib/services/notifications";
import { isEvidenceExpired } from "@/lib/compliance/applicability";

export async function listRegulatoryPermits(
  supabase: SupabaseClient,
  organizationId: string,
  siteId?: string | null,
) {
  let q = supabase
    .from("regulatory_permits")
    .select(
      "id, name, license_number, issuing_authority, issued_on, expires_on, status, site_id, sites:site_id(name)",
    )
    .eq("organization_id", organizationId)
    .order("expires_on", { ascending: true, nullsFirst: false });
  if (siteId) q = q.eq("site_id", siteId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    expired: isEvidenceExpired(row.expires_on),
  }));
}

export async function upsertRegulatoryPermit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    licenseNumber?: string;
    issuingAuthority?: string;
    siteId?: string | null;
    jurisdictionId?: string | null;
    issuedOn?: string | null;
    expiresOn?: string | null;
    notes?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, "regulatory_compliance");
  await requirePermission(supabase, input.organizationId, input.userId, "regulatory_permits.manage");

  if (input.siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", input.siteId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!site) throw new Error("Site must belong to this organization.");
  }

  const { data, error } = await supabase
    .from("regulatory_permits")
    .insert({
      organization_id: input.organizationId,
      name: input.name.trim(),
      license_number: input.licenseNumber || null,
      issuing_authority: input.issuingAuthority || null,
      site_id: input.siteId || null,
      jurisdiction_id: input.jurisdictionId || null,
      issued_on: input.issuedOn || null,
      expires_on: input.expiresOn || null,
      notes: input.notes || null,
      created_by: input.userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "regulatory_permit.created",
    entityType: "regulatory_permit",
    entityId: data.id,
  });
  return data;
}

export async function addPermitCondition(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    conditionText: string;
    dueDate?: string | null;
    ownerId?: string | null;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "regulatory_permits.manage");
  const { data: permit } = await supabase
    .from("regulatory_permits")
    .select("id")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!permit) throw new Error("License not found in this organization.");

  const { data, error } = await supabase
    .from("permit_conditions")
    .insert({
      organization_id: input.organizationId,
      regulatory_permit_id: input.permitId,
      condition_text: input.conditionText.trim(),
      due_date: input.dueDate || null,
      owner_id: input.ownerId || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createRegulatoryUpdate(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    title: string;
    summary?: string;
    publishedOn?: string | null;
    sourceUrl?: string | null;
    regulationId?: string | null;
  },
) {
  await requireFeature(supabase, input.organizationId, "legal_register");
  await requirePermission(supabase, input.organizationId, input.userId, "legal_register.manage");
  const { data, error } = await supabase
    .from("regulatory_updates")
    .insert({
      organization_id: input.organizationId,
      title: input.title.trim(),
      summary: input.summary || null,
      published_on: input.publishedOn || null,
      source_url: input.sourceUrl || null,
      regulation_id: input.regulationId || null,
      status: "published",
      created_by: input.userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "regulatory_update.recorded",
    entityType: "regulatory_update",
    entityId: data.id,
  });
  return data;
}

export async function recordUpdateImpact(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    updateId: string;
    legalRegisterEntryId?: string | null;
    impactStatus: "pending_review" | "applicable" | "not_applicable" | "actioned";
    notes?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "legal_register.manage");
  const { data, error } = await supabase
    .from("regulatory_update_impacts")
    .insert({
      organization_id: input.organizationId,
      update_id: input.updateId,
      legal_register_entry_id: input.legalRegisterEntryId || null,
      impact_status: input.impactStatus,
      notes: input.notes || null,
      reviewed_by: input.userId,
      reviewed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.impactStatus === "applicable") {
    const { data: entry } = await supabase
      .from("legal_register_entries")
      .select("owner_id, title")
      .eq("id", input.legalRegisterEntryId ?? "")
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (entry?.owner_id) {
      await notifyUsers(supabase, {
        organizationId: input.organizationId,
        userIds: [entry.owner_id],
        title: "Regulatory change marked applicable",
        body: entry.title,
        link: "/app/compliance/reviews",
        eventKey: "regulatory_update.applicable",
      });
    }
  }
  return data;
}
