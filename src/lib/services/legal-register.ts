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
    .select("id, code, name, country_code, level, language, currency_code, organization_id, is_active")
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
      "id, code, title, issuing_authority, citation, jurisdiction_id, obligation_id, organization_id, is_active, regulation_type, status, jurisdictions:jurisdiction_id(code, name)",
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
    trainingCourseId?: string | null;
    contractorCompanyId?: string | null;
    mocRequestId?: string | null;
    riskAssessmentId?: string | null;
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
      training_course_id: input.trainingCourseId || null,
      contractor_company_id: input.contractorCompanyId || null,
      moc_request_id: input.mocRequestId || null,
      risk_assessment_id: input.riskAssessmentId || null,
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
       training_course_id, contractor_company_id, moc_request_id, risk_assessment_id,
       legal_register_entries:legal_register_entry_id(title, site_id),
       sites:site_id(name)`,
    )
    .eq("organization_id", organizationId)
    .order("title");
  if (error) throw new Error(error.message);
  return filterRegisterForSite(data ?? [], siteId);
}

export async function getLegalRegisterDrilldown(
  supabase: SupabaseClient,
  organizationId: string,
  entryId: string,
  siteId?: string | null,
) {
  const { data: entry, error } = await supabase
    .from("legal_register_entries")
    .select(
      `id, title, status, applicability_status, site_id, owner_id, justification_note, version,
       regulations:regulation_id(id, code, title, issuing_authority),
       sites:site_id(id, name)`,
    )
    .eq("id", entryId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!entry) return null;
  const visible = filterRegisterForSite([entry], siteId);
  if (!visible.length) return null;

  const { data: requirements } = await supabase
    .from("compliance_requirements")
    .select(
      `id, title, status, frequency, site_id, owner_id, training_course_id, contractor_company_id,
       moc_request_id, risk_assessment_id, checklist_template_id`,
    )
    .eq("organization_id", organizationId)
    .eq("legal_register_entry_id", entryId);

  const scopedReqs = filterRegisterForSite(requirements ?? [], siteId);
  const reqIds = scopedReqs.map((row) => row.id);

  const { data: assessments } = reqIds.length
    ? await supabase
        .from("compliance_assessments")
        .select(
          "id, requirement_id, period_label, status, score_percent, findings_count, checklist_assignment_id, rules_snapshot, profile_snapshot",
        )
        .eq("organization_id", organizationId)
        .in("requirement_id", reqIds)
    : { data: [] as Array<{
        id: string;
        requirement_id: string | null;
        period_label: string;
        status: string;
        score_percent: number | null;
        findings_count: number;
        checklist_assignment_id: string | null;
        rules_snapshot: unknown;
        profile_snapshot: unknown;
      }> };

  const assignmentIds = (assessments ?? [])
    .map((row) => row.checklist_assignment_id)
    .filter((id): id is string => Boolean(id));

  const { data: findings } = assignmentIds.length
    ? await supabase
        .from("checklist_findings")
        .select("id, title, status, capa_id, assignment_id")
        .eq("organization_id", organizationId)
        .in("assignment_id", assignmentIds)
        .is("deleted_at", null)
    : { data: [] as Array<{ id: string; title: string; status: string; capa_id: string | null; assignment_id: string | null }> };

  const capaIds = (findings ?? []).map((row) => row.capa_id).filter((id): id is string => Boolean(id));
  const { data: capas } = capaIds.length
    ? await supabase
        .from("capa_items")
        .select("id, title, status")
        .eq("organization_id", organizationId)
        .in("id", capaIds)
    : { data: [] as Array<{ id: string; title: string; status: string }> };

  return {
    entry: visible[0],
    requirements: scopedReqs,
    assessments: assessments ?? [],
    findings: findings ?? [],
    capas: capas ?? [],
  };
}

