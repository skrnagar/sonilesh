import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { computeIndicatorCoverage } from "@/lib/compliance/applicability";

export const BRSR_CORE_KEYS = [
  { key: "ghg_emissions", label: "GHG emissions (Scope 1+2)", unit: "tCO2e", attribute: 1 },
  { key: "water_consumption", label: "Water consumption", unit: "KL", attribute: 2 },
  { key: "energy_consumption", label: "Energy consumption", unit: "GJ", attribute: 3 },
  { key: "waste_generated", label: "Waste generated", unit: "MT", attribute: 4 },
  { key: "employee_health_safety", label: "Employee health & safety (TRIR / incidents)", unit: "incidents", attribute: 5 },
  { key: "gender_diversity", label: "Gender diversity (women % of workforce)", unit: "%", attribute: 6 },
  { key: "job_creation_local", label: "Job creation in smaller districts", unit: "count", attribute: 7 },
  { key: "anti_corruption", label: "Anti-corruption training coverage", unit: "%", attribute: 8 },
  { key: "supplier_engagement", label: "Supplier ESG assessment coverage", unit: "%", attribute: 9 },
] as const;

export const NGRBC_PRINCIPLES = [
  { code: "P1", title: "Ethics, transparency and accountability" },
  { code: "P2", title: "Safe and sustainable goods and services" },
  { code: "P3", title: "Employee well-being" },
  { code: "P4", title: "Stakeholder inclusiveness" },
  { code: "P5", title: "Human rights" },
  { code: "P6", title: "Environment" },
  { code: "P7", title: "Public policy advocacy" },
  { code: "P8", title: "Inclusive growth" },
  { code: "P9", title: "Customer value" },
] as const;

export async function computeEmployeeHealthSafetyFromIncidents(
  supabase: SupabaseClient,
  organizationId: string,
  periodStart: string,
  periodEnd: string,
) {
  const { data: incidentType } = await supabase
    .from("event_types")
    .select("id")
    .eq("code", "incident")
    .is("organization_id", null)
    .maybeSingle();

  let query = supabase
    .from("ehs_events")
    .select("id, occurred_at, status, event_types:event_type_id(code)", { count: "exact" })
    .eq("organization_id", organizationId)
    .gte("occurred_at", periodStart)
    .lte("occurred_at", `${periodEnd}T23:59:59.999Z`)
    .is("deleted_at", null)
    .neq("status", "cancelled");

  if (incidentType?.id) {
    query = query.eq("event_type_id", incidentType.id);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    incident_count: count ?? 0,
    notes:
      "Pulled from live EHS incident records (not a parallel ESG spreadsheet). TRIR needs hours-worked; until headcount hours are captured, this is the incident count for the period.",
    source: "ehs_events" as const,
  };
}

export async function refreshHealthSafetyMetric(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  period: string,
  periodStart: string,
  periodEnd: string,
) {
  await requireFeature(supabase, organizationId, "esg_reporting");
  const computed = await computeEmployeeHealthSafetyFromIncidents(
    supabase,
    organizationId,
    periodStart,
    periodEnd,
  );
  const { error } = await supabase.from("esg_metrics").upsert(
    {
      organization_id: organizationId,
      period,
      metric_key: "employee_health_safety",
      value: computed.incident_count,
      unit: "incidents",
      notes: computed.notes,
      source: "ehs_events",
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,period,metric_key" },
  );
  if (error) throw new Error(error.message);
  await supabase.from("esg_metric_values").insert({
    organization_id: organizationId,
    metric_key: "employee_health_safety",
    period,
    value: computed.incident_count,
    unit: "incidents",
    notes: computed.notes,
    source: "ehs_events",
    recorded_by: userId,
  });
  return computed;
}

export async function upsertEsgMetric(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    period: string;
    metricKey: string;
    value: number | null;
    unit?: string;
    notes?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, "esg_reporting");
  await requirePermission(supabase, input.organizationId, input.userId, "esg.manage");
  if (input.metricKey === "employee_health_safety") {
    throw new Error("Employee health & safety is sourced from EHS incidents and cannot be typed in.");
  }
  const { error } = await supabase.from("esg_metrics").upsert(
    {
      organization_id: input.organizationId,
      period: input.period,
      metric_key: input.metricKey,
      value: input.value,
      unit: input.unit ?? null,
      notes: input.notes ?? null,
      source: "manual",
      updated_by: input.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,period,metric_key" },
  );
  if (error) throw new Error(error.message);
  await supabase.from("esg_metric_values").insert({
    organization_id: input.organizationId,
    metric_key: input.metricKey,
    period: input.period,
    value: input.value,
    unit: input.unit ?? null,
    notes: input.notes ?? null,
    source: "manual",
    recorded_by: input.userId,
  });
}

export async function addGhgRow(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    siteId?: string | null;
    periodStart: string;
    periodEnd: string;
    scope: "1" | "2" | "3";
    category?: string;
    valueTco2e: number;
    sourceDataRef?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, "esg_reporting");
  await requirePermission(supabase, input.organizationId, input.userId, "esg.manage");
  const { error } = await supabase.from("ghg_emissions").insert({
    organization_id: input.organizationId,
    site_id: input.siteId ?? null,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    scope: input.scope,
    category: input.category ?? null,
    value_tco2e: input.valueTco2e,
    source_data_ref: input.sourceDataRef ?? null,
    created_by: input.userId,
  });
  if (error) throw new Error(error.message);
}

export async function upsertMateriality(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    year: number;
    topic: string;
    stakeholderScore: number;
    businessImpactScore: number;
    notes?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, "esg_reporting");
  await requirePermission(supabase, input.organizationId, input.userId, "esg.manage");
  const { error } = await supabase.from("materiality_assessment").insert({
    organization_id: input.organizationId,
    year: input.year,
    topic: input.topic,
    stakeholder_score: input.stakeholderScore,
    business_impact_score: input.businessImpactScore,
    notes: input.notes ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function upsertCommitteeMember(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; memberUserId: string; role: string },
) {
  await requireFeature(supabase, input.organizationId, "esg_reporting");
  await requirePermission(supabase, input.organizationId, input.userId, "esg.manage");
  const { error } = await supabase.from("esg_committee").upsert(
    {
      organization_id: input.organizationId,
      member_user_id: input.memberUserId,
      role: input.role,
    },
    { onConflict: "organization_id,member_user_id" },
  );
  if (error) throw new Error(error.message);
}

export async function upsertEpr(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    wasteStream: string;
    registrationStatus: string;
    annualTarget?: number | null;
    annualActual?: number | null;
    renewalDue?: string | null;
    certificatePath?: string | null;
  },
) {
  await requireFeature(supabase, input.organizationId, "esg_reporting");
  await requirePermission(supabase, input.organizationId, input.userId, "esg.manage");
  const { error } = await supabase.from("epr_registrations").upsert(
    {
      organization_id: input.organizationId,
      waste_stream: input.wasteStream,
      registration_status: input.registrationStatus,
      annual_target: input.annualTarget ?? null,
      annual_actual: input.annualActual ?? null,
      renewal_due: input.renewalDue || null,
      certificate_path: input.certificatePath ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,waste_stream" },
  );
  if (error) throw new Error(error.message);
}

export async function saveBrsrReport(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    financialYear: string;
    sectionA: Record<string, unknown>;
    sectionB: Record<string, unknown>;
    sectionC: Record<string, unknown>;
    status?: "draft" | "assurance_in_progress" | "filed";
  },
) {
  await requireFeature(supabase, input.organizationId, "esg_reporting");
  await requirePermission(supabase, input.organizationId, input.userId, "esg.manage");
  const { data, error } = await supabase
    .from("brsr_reports")
    .upsert(
      {
        organization_id: input.organizationId,
        financial_year: input.financialYear,
        section_a: input.sectionA,
        section_b: input.sectionB,
        section_c: input.sectionC,
        status: input.status ?? "draft",
        created_by: input.userId,
      },
      { onConflict: "organization_id,financial_year" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "esg.brsr_saved",
    entityType: "brsr_report",
    entityId: data.id,
    newValues: { financialYear: input.financialYear, status: input.status ?? "draft" },
  });
  return data;
}

export function formatBrsrDocument(input: {
  organizationName: string;
  financialYear: string;
  sectionA: Record<string, unknown>;
  sectionB: Record<string, unknown>;
  sectionC: Record<string, unknown>;
}) {
  const lines = [
    `BUSINESS RESPONSIBILITY AND SUSTAINABILITY REPORT`,
    `Organization: ${input.organizationName}`,
    `Financial year: ${input.financialYear}`,
    ``,
    `===== SECTION A — General disclosures =====`,
    ...Object.entries(input.sectionA).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}`),
    ``,
    `===== SECTION B — Management and process disclosures (NGRBC) =====`,
    ...Object.entries(input.sectionB).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}`),
    ``,
    `===== SECTION C — Principle-wise / BRSR Core performance =====`,
    ...Object.entries(input.sectionC).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}`),
    ``,
    `This export follows the configured reporting-framework section structure (A/B/C) for assurance review. It is not a substitute for an official filing pack, not legal advice, and not a claim of completeness.`,
  ];
  return lines.join("\n");
}

export async function listReportingFramework(
  supabase: SupabaseClient,
  code = "brsr",
) {
  const { data: framework, error } = await supabase
    .from("reporting_frameworks")
    .select("id, code, name, version, publisher, description")
    .eq("code", code)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!framework) return { framework: null, sections: [] as Array<{
    id: string;
    code: string;
    title: string;
    indicators: Array<{ id: string; code: string; title: string; unit: string | null; is_core: boolean }>;
  }> };

  const { data: sections, error: secErr } = await supabase
    .from("reporting_framework_sections")
    .select("id, code, title, sort_order, reporting_framework_indicators(id, code, title, unit, is_core, sort_order)")
    .eq("framework_id", framework.id)
    .order("sort_order");
  if (secErr) throw new Error(secErr.message);

  return {
    framework,
    sections: (sections ?? []).map((section) => {
      const indicators = (
        (section.reporting_framework_indicators as Array<{
          id: string;
          code: string;
          title: string;
          unit: string | null;
          is_core: boolean;
          sort_order: number;
        }> | null) ?? []
      ).sort((a, b) => a.sort_order - b.sort_order);
      return { id: section.id, code: section.code, title: section.title, indicators };
    }),
  };
}

export async function listMetricDefinitions(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("esg_metric_definitions")
    .select("id, code, name, unit, source_type, organization_id, is_active")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertMetricDefinition(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    code: string;
    name: string;
    unit?: string;
    sourceType?: "manual" | "computed" | "ehs_events" | "ghg";
  },
) {
  await requireFeature(supabase, input.organizationId, "esg_reporting");
  await requirePermission(supabase, input.organizationId, input.userId, "esg.manage");
  const { data, error } = await supabase
    .from("esg_metric_definitions")
    .insert({
      organization_id: input.organizationId,
      code: input.code.trim(),
      name: input.name.trim(),
      unit: input.unit || null,
      source_type: input.sourceType ?? "manual",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function ensureReportingPeriod(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    periodLabel: string;
    periodStart?: string | null;
      periodEnd?: string | null;
  },
) {
  await requireFeature(supabase, input.organizationId, "esg_reporting");
  await requirePermission(supabase, input.organizationId, input.userId, "esg.manage");
  const { data, error } = await supabase
    .from("esg_reporting_periods")
    .upsert(
      {
        organization_id: input.organizationId,
        period_label: input.periodLabel,
        period_start: input.periodStart || null,
        period_end: input.periodEnd || null,
      },
      { onConflict: "organization_id,period_label" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listRecordedMetricsForPeriod(
  supabase: SupabaseClient,
  organizationId: string,
  period: string,
) {
  const { data, error } = await supabase
    .from("esg_metrics")
    .select("metric_key, value, unit, notes, source")
    .eq("organization_id", organizationId)
    .eq("period", period)
    .not("value", "is", null);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function brsrDataCoverage(
  supabase: SupabaseClient,
  organizationId: string,
  period: string,
) {
  const catalog = await listReportingFramework(supabase, "brsr");
  const core = catalog.sections.flatMap((s) => s.indicators).filter((i) => i.is_core);
  const recorded = await listRecordedMetricsForPeriod(supabase, organizationId, period);
  const byKey = new Map(recorded.map((row) => [row.metric_key, row.value]));
  return computeIndicatorCoverage(
    core.map((indicator) => ({ code: indicator.code, value: byKey.get(indicator.code) ?? null })),
  );
}
