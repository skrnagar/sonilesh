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

export async function raisePermitConditionFinding(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    conditionId: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "regulatory_permits.manage");
  const { data: condition } = await supabase
    .from("permit_conditions")
    .select("id, condition_text, due_date, status, owner_id, finding_id, regulatory_permit_id")
    .eq("id", input.conditionId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!condition) throw new Error("Condition not found in this organization.");
  if (condition.finding_id) return { id: condition.finding_id, existing: true as const };

  const { data: finding, error } = await supabase
    .from("checklist_findings")
    .insert({
      organization_id: input.organizationId,
      assignment_id: null,
      permit_condition_id: condition.id,
      title: `License condition: ${condition.condition_text}`.slice(0, 200),
      description: "Raised from a regulatory license/consent condition — not an EHS PTW finding.",
      due_date: condition.due_date,
      owner_id: condition.owner_id,
      status: "open",
      created_by: input.userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("permit_conditions")
    .update({ finding_id: finding.id, status: "overdue" })
    .eq("id", condition.id)
    .eq("organization_id", input.organizationId);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "compliance.finding_created",
    entityType: "checklist_finding",
    entityId: finding.id,
    newValues: { permit_condition_id: condition.id },
  });

  if (condition.owner_id) {
    await notifyUsers(supabase, {
      organizationId: input.organizationId,
      userIds: [condition.owner_id],
      title: "Compliance finding assigned",
      body: condition.condition_text,
      link: "/app/findings",
      eventKey: "compliance.finding_assigned",
    });
  }
  return { id: finding.id, existing: false as const };
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
