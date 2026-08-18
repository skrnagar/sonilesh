import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIAuthContext } from "@/lib/ai/permissions";
import { fieldSelfOnly } from "@/lib/ai/permissions";
import type { AICitation, AIToolResult } from "@/lib/ai/core/types";
import { AI_LOOP_LIMITS } from "@/lib/ai/core/config";
import { minimizeRows, redactForModel } from "@/lib/ai/guardrails";
import { wrapUntrustedDocument } from "@/lib/ai/guardrails/injection";
import { listEventsByType, getEventBundle } from "@/lib/events/queries";
import { listRiskAssessments } from "@/lib/services/risk";
import { listPermits } from "@/lib/services/permits";
import { listDocuments } from "@/lib/services/documents";
import { listChemicals } from "@/lib/services/chemicals";
import { listAssessments } from "@/lib/services/compliance";
import { getDashboardSnapshot } from "@/lib/services/dashboard";
import { searchKnowledge } from "@/lib/ai/retrieval/hybrid";

function ok(tool: string, data: unknown, citations: AICitation[] = [], insufficient = false): AIToolResult {
  return { ok: true, tool, data, citations, insufficientEvidence: insufficient };
}

function fail(tool: string, error: string): AIToolResult {
  return { ok: false, tool, error };
}

export async function queryIncidents(
  supabase: SupabaseClient,
  ctx: AIAuthContext,
  args: { query?: string; status?: string; limit?: number },
): Promise<AIToolResult> {
  const listed = await listEventsByType(supabase, ctx.organizationId, "incident");
  const ids = listed.map((row) => row.id).slice(0, 80);
  if (!ids.length) return ok("query_incidents", [], [], true);
  let q = supabase
    .from("ehs_events")
    .select("id, event_number, title, status, occurred_at, description, created_by")
    .eq("organization_id", ctx.organizationId)
    .is("deleted_at", null)
    .in("id", ids);
  if (fieldSelfOnly(ctx.scope)) {
    q = q.eq("created_by", ctx.userId);
  }
  const { data: scoped, error } = await q;
  if (error) return fail("query_incidents", error.message);
  const mine = (scoped ?? []) as unknown as Record<string, unknown>[];
  const filtered = mine.filter((row) => {
    if (args.status && String(row.status) !== args.status) return false;
    if (args.query) {
      const blob = `${row.title ?? ""} ${row.event_number ?? ""} ${row.description ?? ""}`.toLowerCase();
      if (!blob.includes(args.query.toLowerCase())) return false;
    }
    return true;
  });
  const sliced = filtered.slice(0, args.limit ?? AI_LOOP_LIMITS.maxRowsPerTool);
  const citations: AICitation[] = sliced.map((row) => ({
    sourceType: "incident",
    sourceId: String(row.id),
    title: String(row.event_number ?? row.title ?? "Incident"),
    excerpt: redactForModel(String(row.title ?? "")),
    href: `/app/incidents/${row.id}`,
    isCurrent: true,
    confidence: 0.7,
  }));
  return ok(
    "query_incidents",
    minimizeRows(sliced, ["id", "event_number", "title", "status", "occurred_at"]),
    citations,
    sliced.length === 0,
  );
}

export async function getIncident(
  supabase: SupabaseClient,
  ctx: AIAuthContext,
  args: { incidentId?: string },
): Promise<AIToolResult> {
  if (!args.incidentId) return fail("get_incident", "incidentId is required");
  const bundle = await getEventBundle(supabase, ctx.organizationId, args.incidentId);
  if (!bundle?.event) return fail("get_incident", "Incident not found in this organization");
  const event = bundle.event as Record<string, unknown>;
  if (fieldSelfOnly(ctx.scope) && event.created_by !== ctx.userId) {
    return fail("get_incident", "Field Copilot can only open your own reports.");
  }
  const investigation = bundle.investigation as Record<string, unknown> | null;
  const confirmed = Boolean(investigation && (investigation.root_cause || investigation.confirmed_cause));
  return ok(
    "get_incident",
    {
      id: event.id,
      event_number: event.event_number,
      title: event.title,
      status: event.status,
      description: redactForModel(String(event.description ?? "")).slice(0, 1500),
      investigation: investigation
        ? {
            status: investigation.status,
            potentialRootCause: confirmed
              ? investigation.root_cause ?? investigation.confirmed_cause
              : investigation.root_cause ?? investigation.hypothesis ?? null,
            causeLanguage: confirmed ? "recorded_in_investigation" : "potential_only",
          }
        : null,
    },
    [
      {
        sourceType: "incident",
        sourceId: String(event.id),
        title: String(event.event_number ?? "Incident"),
        href: `/app/incidents/${event.id}`,
        isCurrent: true,
        confidence: 0.8,
      },
    ],
  );
}

export async function queryRisks(supabase: SupabaseClient, ctx: AIAuthContext, args: { status?: string }) {
  const rows = await listRiskAssessments(supabase, ctx.organizationId, {
    status: args.status,
    limit: AI_LOOP_LIMITS.maxRowsPerTool,
  });
  return ok(
    "query_risks",
    rows.map((r) => ({
      id: r.id,
      number: r.assessment_number,
      title: r.title,
      status: r.status,
      residual: r.residual_risk_band,
    })),
    rows.map((r) => ({
      sourceType: "risk_assessment",
      sourceId: r.id,
      title: r.title,
      href: `/app/risk-assessments/${r.id}`,
      isCurrent: true,
      confidence: 0.65,
    })),
    rows.length === 0,
  );
}

export async function queryPermitsTool(
  supabase: SupabaseClient,
  ctx: AIAuthContext,
  args: { status?: string; activeBoard?: boolean },
) {
  const rows = await listPermits(supabase, ctx.organizationId, {
    status: args.status,
    activeBoard: args.activeBoard,
    siteId: ctx.siteId ?? undefined,
    limit: AI_LOOP_LIMITS.maxRowsPerTool,
  });
  const mine = fieldSelfOnly(ctx.scope)
    ? rows.filter((r) => r.requester_id === ctx.userId || r.work_leader_id === ctx.userId)
    : rows;
  return ok(
    "query_permits",
    mine.map((r) => ({
      id: r.id,
      number: r.permit_number,
      title: r.title,
      status: r.status,
      valid_to: r.valid_to,
    })),
    mine.map((r) => ({
      sourceType: "permit",
      sourceId: r.id,
      title: r.permit_number,
      href: `/app/permits/${r.id}`,
      isCurrent: true,
      confidence: 0.7,
    })),
    mine.length === 0,
  );
}

export async function queryInspections(supabase: SupabaseClient, ctx: AIAuthContext, args: { status?: string }) {
  let q = supabase
    .from("checklist_assignments")
    .select("id, status, due_date, completed_at, assignee_id, checklist_templates:template_id(name, kind)")
    .eq("organization_id", ctx.organizationId)
    .is("deleted_at", null)
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (args.status) q = q.eq("status", args.status);
  if (fieldSelfOnly(ctx.scope)) q = q.eq("assignee_id", ctx.userId);
  const { data, error } = await q;
  if (error) return fail("query_inspections", error.message);
  return ok("query_inspections", data ?? [], [], !data?.length);
}

export async function queryAudits(supabase: SupabaseClient, ctx: AIAuthContext) {
  const { data, error } = await supabase
    .from("checklist_assignments")
    .select("id, status, due_date, checklist_templates:template_id(name, kind)")
    .eq("organization_id", ctx.organizationId)
    .is("deleted_at", null)
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (error) return fail("query_audits", error.message);
  const rows = (data ?? []).filter((row) => {
    const tpl = row.checklist_templates as unknown as { kind?: string } | null;
    return tpl?.kind === "audit" || true;
  });
  return ok("query_audits", rows, [], rows.length === 0);
}

export async function queryFindings(supabase: SupabaseClient, ctx: AIAuthContext, args: { status?: string }) {
  let q = supabase
    .from("checklist_findings")
    .select("id, title, status, severity, assignment_id")
    .eq("organization_id", ctx.organizationId)
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (args.status) q = q.eq("status", args.status);
  const { data, error } = await q;
  if (error) return fail("query_findings", error.message);
  return ok("query_findings", data ?? [], [], !data?.length);
}

export async function queryCapa(supabase: SupabaseClient, ctx: AIAuthContext, args: { status?: string }) {
  let q = supabase
    .from("capa_items")
    .select("id, title, status, priority, due_date, owner_id, source_module, ai_generated")
    .eq("organization_id", ctx.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (args.status) q = q.eq("status", args.status);
  if (fieldSelfOnly(ctx.scope)) q = q.or(`owner_id.eq.${ctx.userId},created_by.eq.${ctx.userId}`);
  const { data, error } = await q;
  if (error) return fail("query_capa", error.message);
  const rows = data ?? [];
  return ok(
    "query_capa",
    rows,
    rows.map((r) => ({
      sourceType: "capa",
      sourceId: r.id,
      title: r.title,
      href: `/app/capa/${r.id}`,
      isCurrent: true,
      confidence: 0.75,
    })),
    rows.length === 0,
  );
}

export async function queryTraining(supabase: SupabaseClient, ctx: AIAuthContext) {
  let q = supabase
    .from("training_assignments")
    .select("id, status, due_date, user_id, training_courses:course_id(title, code)")
    .eq("organization_id", ctx.organizationId)
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (fieldSelfOnly(ctx.scope)) q = q.eq("user_id", ctx.userId);
  const { data, error } = await q;
  if (error) return fail("query_training", error.message);
  return ok("query_training", data ?? [], [], !data?.length);
}

export async function queryCertifications(supabase: SupabaseClient, ctx: AIAuthContext) {
  let q = supabase
    .from("training_assignments")
    .select("id, status, completed_at, due_date, user_id, training_courses:course_id(title, validity_days)")
    .eq("organization_id", ctx.organizationId)
    .in("status", ["completed", "expired"])
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (fieldSelfOnly(ctx.scope)) q = q.eq("user_id", ctx.userId);
  const { data, error } = await q;
  if (error) return fail("query_certifications", error.message);
  return ok("query_certifications", data ?? [], [], !data?.length);
}

export async function queryContractors(supabase: SupabaseClient, ctx: AIAuthContext, args: { query?: string }) {
  let q = supabase
    .from("contractor_companies")
    .select("id, name, status")
    .eq("organization_id", ctx.organizationId)
    .is("deleted_at", null)
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (args.query) q = q.ilike("name", `%${args.query.replace(/[%*,]/g, "")}%`);
  const { data, error } = await q;
  if (error) return fail("query_contractors", error.message);
  return ok("query_contractors", data ?? [], [], !data?.length);
}

export async function queryCompliance(supabase: SupabaseClient, ctx: AIAuthContext) {
  const rows = await listAssessments(supabase, ctx.organizationId, ctx.siteId);
  return ok("query_compliance", rows, [], !rows.length);
}

export async function queryDocuments(supabase: SupabaseClient, ctx: AIAuthContext, args: { query?: string }) {
  const rows = await listDocuments(supabase, ctx.organizationId, { limit: AI_LOOP_LIMITS.maxRowsPerTool });
  const current = rows.filter((r) => ["published", "distributed", "approved"].includes(r.status));
  const filtered = args.query
    ? current.filter((r) => r.title.toLowerCase().includes(args.query!.toLowerCase()))
    : current;
  return ok(
    "query_documents",
    filtered.map((r) => ({
      id: r.id,
      number: r.doc_number,
      title: r.title,
      status: r.status,
      version: r.current_version,
      current: true,
    })),
    filtered.map((r) => ({
      sourceType: "controlled_document",
      sourceId: r.id,
      title: r.title,
      href: `/app/documents/${r.id}`,
      isCurrent: true,
      confidence: 0.6,
    })),
    filtered.length === 0,
  );
}

export async function querySds(supabase: SupabaseClient, ctx: AIAuthContext, args: { query?: string }) {
  const rows = await listChemicals(supabase, ctx.organizationId, { query: args.query, siteId: ctx.siteId ?? undefined });
  return ok(
    "query_sds",
    rows.slice(0, AI_LOOP_LIMITS.maxRowsPerTool).map((r) => ({
      id: r.id,
      name: r.name,
      cas: r.cas_number,
      classification: r.hazard_classification,
    })),
    rows.slice(0, 8).map((r) => ({
      sourceType: "chemical",
      sourceId: r.id,
      title: r.name,
      href: `/app/chemicals/${r.id}`,
      excerpt: "SDS emergency procedures are not generated by AI. Open the current SDS record.",
      isCurrent: true,
      confidence: 0.55,
    })),
    rows.length === 0,
  );
}

export async function queryPpe(supabase: SupabaseClient, ctx: AIAuthContext) {
  let q = supabase
    .from("ppe_issuances")
    .select("id, status, user_id, expires_on, ppe_items:item_id(name, sku)")
    .eq("organization_id", ctx.organizationId)
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (fieldSelfOnly(ctx.scope)) q = q.eq("user_id", ctx.userId);
  const { data, error } = await q;
  if (error) {
    const items = await supabase
      .from("ppe_items")
      .select("id, name, status, identifier")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .limit(AI_LOOP_LIMITS.maxRowsPerTool);
    if (items.error) return fail("query_ppe", items.error.message);
    return ok("query_ppe", items.data ?? [], [], !items.data?.length);
  }
  return ok("query_ppe", data ?? [], [], !data?.length);
}

export async function queryMoc(supabase: SupabaseClient, ctx: AIAuthContext, args: { status?: string }) {
  let q = supabase
    .from("moc_requests")
    .select("id, moc_number, title, status")
    .eq("organization_id", ctx.organizationId)
    .is("deleted_at", null)
    .limit(AI_LOOP_LIMITS.maxRowsPerTool);
  if (args.status) q = q.eq("status", args.status);
  const { data, error } = await q;
  if (error) return fail("query_moc", error.message);
  return ok("query_moc", data ?? [], [], !data?.length);
}

export async function analyticsQuery(supabase: SupabaseClient, ctx: AIAuthContext) {
  try {
    const snapshot = await getDashboardSnapshot(supabase, ctx.organizationId, "org", {
      siteId: ctx.siteId ?? undefined,
      projectId: ctx.projectId ?? undefined,
    });
    return ok("analytics_query", {
      kpis: snapshot.kpis.map((k) => ({ key: k.key, label: k.label, value: k.value, hint: k.hint })),
      language: "These are recorded metrics, not predicted incidents.",
    });
  } catch (err) {
    return fail("analytics_query", err instanceof Error ? err.message : "Analytics unavailable");
  }
}

export async function searchKnowledgeTool(
  supabase: SupabaseClient,
  ctx: AIAuthContext,
  args: { query?: string },
): Promise<AIToolResult> {
  const result = await searchKnowledge({ supabase, ctx, query: args.query ?? "" });
  return ok(
    "search_knowledge",
    { passages: result.passages.map((p) => wrapUntrustedDocument(p).slice(0, 1200)) },
    result.citations,
    result.citations.length === 0,
  );
}
