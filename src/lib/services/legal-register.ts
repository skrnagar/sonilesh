import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { notifyUsers } from "@/lib/services/notifications";
import { filterRegisterForSite } from "@/lib/compliance/applicability";

async function requireLegalManage(supabase: SupabaseClient, organizationId: string, userId: string) {
  await requireFeature(supabase, organizationId, "legal_register");
  await requirePermission(supabase, organizationId, userId, "legal_register.manage");
}

export async function listJurisdictions(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("jurisdictions")
    .select("id, code, name, country_code, level, organization_id, is_active")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .eq("is_active", true)
    .order("level")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listRegulations(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("regulations")
    .select(
      "id, code, title, issuing_authority, citation, jurisdiction_id, obligation_id, organization_id, is_active, jurisdictions:jurisdiction_id(code, name)",
    )
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .eq("is_active", true)
    .order("title");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listLegalRegister(
  supabase: SupabaseClient,
  organizationId: string,
  siteId?: string | null,
) {
  const { data, error } = await supabase
    .from("legal_register_entries")
    .select(
      `id, title, status, applicability_status, site_id, owner_id, version, justification_note,
       regulations:regulation_id(code, title, issuing_authority),
       sites:site_id(id, name)`,
    )
    .eq("organization_id", organizationId)
    .neq("status", "retired")
    .order("title");
  if (error) throw new Error(error.message);
  return filterRegisterForSite(data ?? [], siteId);
}

export async function upsertLegalRegisterEntry(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    id?: string;
    title: string;
    siteId?: string | null;
    regulationId?: string | null;
    obligationId?: string | null;
    ownerId?: string | null;
    justification?: string;
    applicabilityRulesSnapshot?: Record<string, unknown>;
  },
) {
  await requireLegalManage(supabase, input.organizationId, input.userId);
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");

  if (input.siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", input.siteId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!site) throw new Error("Site must belong to this organization.");
  }

  const payload = {
    organization_id: input.organizationId,
    title,
    site_id: input.siteId || null,
    regulation_id: input.regulationId || null,
    obligation_id: input.obligationId || null,
    owner_id: input.ownerId || null,
    justification_note: input.justification || null,
    applicability_rules_snapshot: input.applicabilityRulesSnapshot ?? {},
    updated_at: new Date().toISOString(),
    created_by: input.userId,
  };

  const query = input.id
    ? supabase
        .from("legal_register_entries")
        .update(payload)
        .eq("id", input.id)
        .eq("organization_id", input.organizationId)
        .select("id")
        .single()
    : supabase.from("legal_register_entries").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: input.id ? "legal_register.updated" : "legal_register.created",
    entityType: "legal_register_entry",
    entityId: data.id,
  });

  if (input.ownerId && input.ownerId !== input.userId) {
    await notifyUsers(supabase, {
      organizationId: input.organizationId,
      userIds: [input.ownerId],
      title: "Legal register entry assigned",
      body: title,
      link: "/app/compliance/legal-register",
      eventKey: "legal_register.assigned",
    });
  }

  return data;
}

export async function upsertRequirement(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    legalRegisterEntryId: string;
    title: string;
    description?: string;
    frequency?: string;
    siteId?: string | null;
    ownerId?: string | null;
    checklistTemplateId?: string | null;
  },
) {
  await requireLegalManage(supabase, input.organizationId, input.userId);

  const { data: entry } = await supabase
    .from("legal_register_entries")
    .select("id, site_id")
    .eq("id", input.legalRegisterEntryId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!entry) throw new Error("Legal register entry not found in this organization.");

  const siteId = input.siteId || entry.site_id || null;
  const { data, error } = await supabase
    .from("compliance_requirements")
    .insert({
      organization_id: input.organizationId,
      legal_register_entry_id: input.legalRegisterEntryId,
      site_id: siteId,
      title: input.title.trim(),
      description: input.description || null,
      frequency: input.frequency || "annual",
      owner_id: input.ownerId || null,
      checklist_template_id: input.checklistTemplateId || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "compliance.requirement_created",
    entityType: "compliance_requirement",
    entityId: data.id,
  });
  return data;
}

export async function listRequirements(
  supabase: SupabaseClient,
  organizationId: string,
  siteId?: string | null,
) {
  const { data, error } = await supabase
    .from("compliance_requirements")
    .select(
      `id, title, status, frequency, site_id, owner_id, checklist_template_id,
       legal_register_entries:legal_register_entry_id(title, site_id),
       sites:site_id(name)`,
    )
    .eq("organization_id", organizationId)
    .order("title");
  if (error) throw new Error(error.message);
  return filterRegisterForSite(data ?? [], siteId);
}
