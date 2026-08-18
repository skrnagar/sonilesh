import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { getUserScope } from "@/lib/tenancy/context";
import { isEvidenceExpired } from "@/lib/compliance/applicability";
import {
  average,
  capaAging,
  inspectionCompletion,
  isOpenCapaStatus,
  isOpenEventStatus,
  percentChange,
  riskHeat,
} from "@/lib/dashboard/aggregates";
import { bucketByOrgDay, inPeriod, resolveAnalyticsPeriod } from "./periods";
import { applySiteFilter, resolveAccessibleSiteIds, type SiteRow } from "./scope";
import { summarizeDelta, summarizeMissingRate, summarizeNoEffectiveness } from "./summaries";
import { buildDrilldownHref } from "./drilldown";
import { computeHealthScore, type HealthWeightConfig } from "./health-score";
import type {
  AnalyticsAlert,
  AnalyticsQuery,
  DataQualityFlag,
  MetricValue,
  NamedOption,
  ResolvedPeriod,
  SeriesPoint,
} from "./types";

export type AnalyticsContext = {
  supabase: SupabaseClient;
  organizationId: string;
  organizationName: string;
  userId: string;
  timezone: string;
  fiscalYearStartMonth: number;
  healthWeights: HealthWeightConfig;
  query: AnalyticsQuery;
  period: ResolvedPeriod;
  accessibleSiteIds: string[] | null;
  sites: SiteRow[];
  projects: NamedOption[];
  departments: NamedOption[];
  bus: NamedOption[];
};

type EventRow = {
  id: string;
  event_number: string;
  title: string | null;
  status: string;
  occurred_at: string;
  event_type_id: string;
  severity_id: string | null;
  site_id: string | null;
  project_id: string | null;
  department_id: string | null;
  business_unit_id: string | null;
};

type HazardRow = {
  id: string;
  residual_likelihood: number | null;
  residual_consequence: number | null;
  residual_band: string | null;
  assessment_id: string | null;
};

type PermitRow = {
  id: string;
  status: string;
  valid_to: string | null;
  site_id: string | null;
  project_id: string | null;
};

type AssignmentRow = {
  id: string;
  status: string;
  checklist_type?: string;
  completed_at?: string | null;
  created_at?: string;
  site_id: string | null;
};

type FindingRow = { id: string; status: string; assignment_id: string | null };

type CapaRow = {
  id: string;
  title: string | null;
  status: string;
  due_date: string | null;
  priority: string | null;
  created_at: string;
  verified_at: string | null;
  site_id: string | null;
  owner_id: string | null;
};

type HoursRow = { hours: number | null; site_id: string | null };

function asRows<T>(data: unknown): T[] {
  return (Array.isArray(data) ? data : []) as T[];
}

function metric(partial: MetricValue): MetricValue {
  return partial;
}

function toneForCount(count: number, polarity: MetricValue["polarity"]): MetricValue["tone"] {
  if (count === 0) return polarity === "higher-is-better" ? "watch" : "good";
  if (polarity === "higher-is-worse") return count >= 5 ? "critical" : "watch";
  return "neutral";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyOrg(query: any, ctx: AnalyticsContext) {
  return query.eq("organization_id", ctx.organizationId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySiteScope(query: any, ctx: AnalyticsContext) {
  return applySiteFilter(applyOrg(query, ctx), ctx.accessibleSiteIds);
}

/** Events — have site/project/department/BU columns. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCommonScope(query: any, ctx: AnalyticsContext) {
  let next = applySiteScope(query, ctx);
  if (ctx.query.projectId) next = next.eq("project_id", ctx.query.projectId);
  if (ctx.query.departmentId) next = next.eq("department_id", ctx.query.departmentId);
  if (ctx.query.businessUnitId) next = next.eq("business_unit_id", ctx.query.businessUnitId);
  return next;
}

/** Permits / inspections — site + project only. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySiteProjectScope(query: any, ctx: AnalyticsContext) {
  let next = applySiteScope(query, ctx);
  if (ctx.query.projectId) next = next.eq("project_id", ctx.query.projectId);
  return next;
}

export const buildAnalyticsContext = cache(async function buildAnalyticsContext(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    organizationName: string;
    userId: string;
    timezone: string;
    query: AnalyticsQuery;
    sites?: SiteRow[];
    projects?: NamedOption[];
  },
): Promise<AnalyticsContext> {
  const [
    settingsRes,
    scopes,
    sitesRes,
    projectsRes,
    departmentsRes,
    busRes,
  ] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("fiscal_year_start_month, analytics_health_config")
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
    getUserScope(supabase, input.organizationId, input.userId),
    input.sites
      ? Promise.resolve({ data: input.sites })
      : supabase
          .from("sites")
          .select("id, name, business_unit_id")
          .eq("organization_id", input.organizationId)
          .is("deleted_at", null)
          .limit(200),
    input.projects
      ? Promise.resolve({ data: input.projects })
      : supabase
          .from("projects")
          .select("id, name")
          .eq("organization_id", input.organizationId)
          .is("deleted_at", null)
          .limit(200),
    supabase
      .from("departments")
      .select("id, name")
      .eq("organization_id", input.organizationId)
      .is("deleted_at", null)
      .limit(80),
    supabase
      .from("business_units")
      .select("id, name")
      .eq("organization_id", input.organizationId)
      .is("deleted_at", null)
      .limit(40),
  ]);

  const fy = Number(settingsRes.data?.fiscal_year_start_month ?? 4) || 4;
  const healthWeights = (settingsRes.data?.analytics_health_config ?? {}) as HealthWeightConfig;
  const sites = (sitesRes.data ?? []) as SiteRow[];
  const accessibleSiteIds = resolveAccessibleSiteIds(scopes, sites, input.query.siteId);
  const period = resolveAnalyticsPeriod({
    query: input.query,
    timeZone: input.timezone || "UTC",
    fiscalYearStartMonth: fy,
  });

  return {
    supabase,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    userId: input.userId,
    timezone: input.timezone || "UTC",
    fiscalYearStartMonth: fy,
    healthWeights,
    query: input.query,
    period,
    accessibleSiteIds,
    sites,
    projects: (projectsRes.data ?? []) as NamedOption[],
    departments: (departmentsRes.data ?? []) as NamedOption[],
    bus: (busRes.data ?? []) as NamedOption[],
  };
});

async function loadEventTypes(supabase: SupabaseClient) {
  const { data } = await supabase.from("event_types").select("id, code, name").is("organization_id", null);
  return data ?? [];
}

async function loadSeverities(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("severity_levels")
    .select("id, code, name, rank, color")
    .is("organization_id", null);
  return data ?? [];
}

async function loadEvents(ctx: AnalyticsContext) {
  const q = applyCommonScope(
    ctx.supabase
      .from("ehs_events")
      .select(
        "id, event_number, title, status, occurred_at, event_type_id, severity_id, site_id, project_id, department_id, business_unit_id",
      )
      .is("deleted_at", null)
      .gte("occurred_at", ctx.period.prevStart.toISOString())
      .lte("occurred_at", ctx.period.end.toISOString()),
    ctx,
  );
  return q.order("occurred_at", { ascending: false }).limit(2000);
}

export async function getIncidentMetrics(ctx: AnalyticsContext) {
  const [eventsRes, types, severities, injuriesRes] = await Promise.all([
    loadEvents(ctx),
    loadEventTypes(ctx.supabase),
    loadSeverities(ctx.supabase),
    ctx.supabase
      .from("ehs_event_injuries")
      .select("id, event_id, lost_time, organization_id")
      .eq("organization_id", ctx.organizationId)
      .eq("lost_time", true)
      .limit(2000),
  ]);

  const typeId = (code: string) => types.find((t) => t.code === code)?.id ?? null;
  const incidentType = typeId("incident");
  const nearMissType = typeId("near_miss");
  const uaType = typeId("unsafe_act");
  const ucType = typeId("unsafe_condition");
  const criticalIds = severities.filter((s) => s.rank >= 4 || s.code === "critical").map((s) => s.id);

  const events = (eventsRes.data ?? []) as EventRow[];
  const current = events.filter((e) => inPeriod(e.occurred_at, ctx.period.start, ctx.period.end));
  const previous = events.filter((e) => inPeriod(e.occurred_at, ctx.period.prevStart, ctx.period.prevEnd));
  const ofType = (rows: EventRow[], type: string | null) =>
    type ? rows.filter((e) => e.event_type_id === type) : [];

  const incidents = ofType(current, incidentType);
  const prevIncidents = ofType(previous, incidentType);
  const open = incidents.filter((e) => isOpenEventStatus(e.status));
  const prevOpen = prevIncidents.filter((e) => isOpenEventStatus(e.status));
  const critical = incidents.filter((e) => e.severity_id && criticalIds.includes(e.severity_id));
  const prevCritical = prevIncidents.filter((e) => e.severity_id && criticalIds.includes(e.severity_id));
  const nearMisses = ofType(current, nearMissType);
  const prevNear = ofType(previous, nearMissType);
  const uauc = ofType(current, uaType).length + ofType(current, ucType).length;
  const prevUauc = ofType(previous, uaType).length + ofType(previous, ucType).length;

  const incidentIds = new Set(incidents.map((e) => e.id));
  const prevIncidentIds = new Set(prevIncidents.map((e) => e.id));
  const lti = (injuriesRes.data ?? []).filter((row) => incidentIds.has(row.event_id)).length;
  const prevLti = (injuriesRes.data ?? []).filter((row) => prevIncidentIds.has(row.event_id)).length;

  const hrefIncidents = buildDrilldownHref("/app/incidents", ctx.query);
  const metrics: MetricValue[] = [
    metric({
      code: "incident_count",
      label: "Incidents",
      value: incidents.length,
      display: String(incidents.length),
      hint: incidents.length === 0 ? "Clear" : "Recorded",
      tone: toneForCount(incidents.length, "higher-is-worse"),
      href: hrefIncidents,
      trend: formatTrend(incidents.length, prevIncidents.length),
      polarity: "higher-is-worse",
      classification: "lagging",
      previous: prevIncidents.length,
    }),
    metric({
      code: "open_incidents",
      label: "Open incidents",
      value: open.length,
      display: String(open.length),
      hint: open.length === 0 ? "Clear" : "In workflow",
      tone: toneForCount(open.length, "higher-is-worse"),
      href: hrefIncidents,
      trend: formatTrend(open.length, prevOpen.length),
      polarity: "higher-is-worse",
      classification: "lagging",
      previous: prevOpen.length,
    }),
    metric({
      code: "critical_incidents",
      label: "Critical incidents",
      value: critical.length,
      display: String(critical.length),
      hint: critical.length === 0 ? "None" : "Investigate",
      tone: critical.length === 0 ? "good" : "critical",
      href: hrefIncidents,
      trend: formatTrend(critical.length, prevCritical.length),
      polarity: "higher-is-worse",
      classification: "lagging",
      previous: prevCritical.length,
    }),
    metric({
      code: "lost_time_injuries",
      label: "Lost-time injuries",
      value: lti,
      display: String(lti),
      hint: "Count, not a rate",
      tone: toneForCount(lti, "higher-is-worse"),
      href: hrefIncidents,
      trend: formatTrend(lti, prevLti),
      polarity: "higher-is-worse",
      classification: "lagging",
      previous: prevLti,
    }),
    metric({
      code: "near_miss_count",
      label: "Near misses",
      value: nearMisses.length,
      display: String(nearMisses.length),
      hint: "Leading",
      tone: "neutral",
      href: buildDrilldownHref("/app/near-misses", ctx.query),
      trend: formatTrend(nearMisses.length, prevNear.length),
      polarity: "higher-is-better",
      classification: "leading",
      previous: prevNear.length,
    }),
    metric({
      code: "uauc_count",
      label: "UA / UC",
      value: uauc,
      display: String(uauc),
      hint: uauc > 0 ? "Observations" : "Clear",
      tone: toneForCount(uauc, "higher-is-worse"),
      href: buildDrilldownHref("/app/hazards", ctx.query),
      trend: formatTrend(uauc, prevUauc),
      polarity: "higher-is-worse",
      classification: "leading",
      previous: prevUauc,
    }),
  ];

  const trend: Array<{ label: string; incidents: number; nearMisses: number }> = (() => {
    const inc = bucketByOrgDay(
      incidents.map((e) => e.occurred_at),
      ctx.period.start,
      ctx.period.end,
      ctx.timezone,
    );
    const near = bucketByOrgDay(
      nearMisses.map((e) => e.occurred_at),
      ctx.period.start,
      ctx.period.end,
      ctx.timezone,
    );
    return inc.map((point, i) => ({
      label: point.label,
      incidents: point.value,
      nearMisses: near[i]?.value ?? 0,
    }));
  })();

  const severitySeries = severities
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((sev) => ({
      label: sev.name,
      value: incidents.filter((e) => e.severity_id === sev.id).length,
      color: sev.color ?? undefined,
    }));

  return {
    metrics,
    trend,
    severitySeries,
    bySite: namedCounts(incidents.map((e) => e.site_id), ctx.sites),
    byProject: namedCounts(incidents.map((e) => e.project_id), ctx.projects),
    recent: current.slice(0, 12).map((row) => ({
      id: row.id,
      event_number: row.event_number,
      title: row.title,
      status: row.status,
      occurred_at: row.occurred_at,
      type: types.find((t) => t.id === row.event_type_id)?.name ?? "Event",
      href: `/app/incidents/${row.id}`,
    })),
    summaries: [
      summarizeDelta("Incidents", incidents.length, prevIncidents.length),
      summarizeDelta("Open CAPA is reported on the CAPA dashboard", 0, 0),
    ].filter((s, i) => i === 0),
  };
}

function formatTrend(current: number, previous: number) {
  return percentChange(current, previous);
}

export async function getRiskMetrics(ctx: AnalyticsContext) {
  let assessmentIds: string[] | null = null;
  if (ctx.accessibleSiteIds !== null || ctx.query.projectId || ctx.query.departmentId) {
    const { data: assessments } = await applySiteProjectScope(
      ctx.supabase.from("risk_assessments").select("id, site_id, project_id").is("deleted_at", null),
      ctx,
    ).limit(800);
    const ids = asRows<{ id: string }>(assessments).map((row) => row.id);
    assessmentIds = ids;
    if (!ids.length) {
      return {
        metrics: [
          metric({
            code: "high_residual_risk",
            label: "High residual risk",
            value: 0,
            display: "0",
            hint: "0 hazards",
            tone: "good",
            href: buildDrilldownHref("/app/risk-register", ctx.query),
            trend: null,
            polarity: "higher-is-worse",
            classification: "leading",
            previous: null,
          }),
        ] satisfies MetricValue[],
        heat: riskHeat([]),
        total: 0,
      };
    }
  }

  let q = applyOrg(
    ctx.supabase
      .from("risk_hazards")
      .select("id, residual_likelihood, residual_consequence, residual_band, assessment_id")
      .is("deleted_at", null),
    ctx,
  );
  if (assessmentIds) q = q.in("assessment_id", assessmentIds);
  const { data } = await q.limit(1500);
  const hazards = asRows<HazardRow>(data);
  const high = hazards.filter(
    (h) =>
      (h.residual_band && /high|extreme|critical/i.test(h.residual_band)) ||
      (typeof h.residual_likelihood === "number" &&
        typeof h.residual_consequence === "number" &&
        h.residual_likelihood * h.residual_consequence >= 15),
  );
  return {
    metrics: [
      metric({
        code: "high_residual_risk",
        label: "High residual risk",
        value: high.length,
        display: String(high.length),
        hint: `${hazards.length} hazards`,
        tone: high.length === 0 ? "good" : "watch",
        href: buildDrilldownHref("/app/risk-register", ctx.query),
        trend: null,
        polarity: "higher-is-worse",
        classification: "leading",
        previous: null,
      }),
    ] satisfies MetricValue[],
    heat: riskHeat(hazards),
    total: hazards.length,
  };
}

export async function getPermitMetrics(ctx: AnalyticsContext) {
  const q = applySiteProjectScope(
    ctx.supabase.from("permits").select("id, status, valid_to, site_id, project_id").is("deleted_at", null),
    ctx,
  );
  const { data } = await q.limit(1500);
  const permits = asRows<PermitRow>(data);
  const active = permits.filter((p) =>
    ["active", "authorization", "approval_required"].includes(p.status),
  );
  const expired = permits.filter((p) => p.valid_to && p.valid_to < ctx.period.end.toISOString() && p.status === "active");
  return {
    metrics: [
      metric({
        code: "active_permits",
        label: "Active permits",
        value: active.length,
        display: String(active.length),
        hint: "Live work",
        tone: "neutral",
        href: buildDrilldownHref("/app/permits/active", ctx.query),
        trend: null,
        polarity: "neutral",
        classification: "leading",
        previous: null,
      }),
    ] satisfies MetricValue[],
    byStatus: countLabels(permits.map((p) => p.status.replaceAll("_", " "))),
    expiredLive: expired.length,
  };
}

export async function getInspectionMetrics(ctx: AnalyticsContext) {
  const q = applySiteProjectScope(
    ctx.supabase
      .from("checklist_assignments")
      .select("id, status, checklist_type, completed_at, created_at, site_id")
      .eq("checklist_type", "inspection")
      .is("deleted_at", null),
    ctx,
  );
  const { data } = await q.limit(1500);
  const rows = asRows<AssignmentRow>(data);
  const inPeriodRows = rows.filter((r) =>
    inPeriod(r.completed_at || r.created_at, ctx.period.start, ctx.period.end),
  );
  const prevRows = rows.filter((r) =>
    inPeriod(r.completed_at || r.created_at, ctx.period.prevStart, ctx.period.prevEnd),
  );
  const insp = inspectionCompletion(inPeriodRows.length ? inPeriodRows : rows);
  const prev = inspectionCompletion(prevRows);
  const noData = rows.length === 0;
  return {
    metrics: [
      metric({
        code: "inspection_completion",
        label: "Inspection completion",
        value: noData ? null : insp.percent,
        display: noData ? "—" : `${insp.percent}%`,
        hint: noData ? "No inspections" : `${insp.completed}/${insp.total}`,
        tone: noData || insp.percent >= 80 ? "good" : "watch",
        href: buildDrilldownHref("/app/inspections", ctx.query),
        trend: noData ? null : formatTrend(insp.percent, prev.percent),
        polarity: "higher-is-better",
        classification: "leading",
        previous: prev.percent,
        missingReason: noData ? "No inspections in scope." : undefined,
      }),
    ] satisfies MetricValue[],
    byStatus: countLabels(rows.map((r) => r.status.replaceAll("_", " "))),
  };
}

export async function getAuditMetrics(ctx: AnalyticsContext) {
  const assignments = await applySiteProjectScope(
    ctx.supabase
      .from("checklist_assignments")
      .select("id, status, checklist_type, site_id")
      .eq("checklist_type", "audit")
      .is("deleted_at", null),
    ctx,
  ).limit(800);
  const audits = asRows<AssignmentRow>(assignments.data);
  const auditIds = audits.map((row) => row.id);
  let findingsQuery = applyOrg(
    ctx.supabase
      .from("checklist_findings")
      .select("id, status, assignment_id")
      .in("status", ["open", "capa_linked"])
      .is("deleted_at", null),
    ctx,
  );
  if (ctx.accessibleSiteIds !== null) {
    findingsQuery = findingsQuery.in(
      "assignment_id",
      auditIds.length ? auditIds : ["00000000-0000-0000-0000-000000000000"],
    );
  }
  const findings = await findingsQuery.limit(800);
  const openFindings = asRows<FindingRow>(findings.data).filter(
    (row) => row.status === "open" || row.status === "capa_linked",
  );
  return {
    metrics: [
      metric({
        code: "open_findings",
        label: "Open findings",
        value: openFindings.length,
        display: String(openFindings.length),
        hint: openFindings.length === 0 ? "Clear" : "Open",
        tone: openFindings.length === 0 ? "good" : "watch",
        href: buildDrilldownHref("/app/findings", ctx.query),
        trend: null,
        polarity: "higher-is-worse",
        classification: "lagging",
        previous: null,
      }),
    ] satisfies MetricValue[],
    auditCount: audits.length,
    byStatus: countLabels(audits.map((r) => r.status.replaceAll("_", " "))),
  };
}

export async function getCAPAMetrics(ctx: AnalyticsContext) {
  const q = applySiteScope(
    ctx.supabase
      .from("capa_items")
      .select("id, title, status, due_date, priority, created_at, verified_at, site_id, owner_id")
      .is("deleted_at", null),
    ctx,
  );
  const { data } = await q.limit(2000);
  const capa = asRows<CapaRow>(data);
  const open = capa.filter((row) => isOpenCapaStatus(row.status));
  const overdue = capa.filter(
    (row) => row.due_date && row.due_date < ctx.period.localToday && isOpenCapaStatus(row.status),
  );
  const created = capa.filter((row) => inPeriod(row.created_at, ctx.period.start, ctx.period.end));
  const prevCreated = capa.filter((row) =>
    inPeriod(row.created_at, ctx.period.prevStart, ctx.period.prevEnd),
  );
  const verified = capa.filter((row) => row.verified_at);
  const closedLoop = capa.filter((row) => ["verified", "closed"].includes(row.status));
  const hasEffectiveness = verified.length > 0;
  const effectivenessPct =
    hasEffectiveness && closedLoop.length
      ? Math.round((verified.length / closedLoop.length) * 100)
      : null;

  return {
    metrics: [
      metric({
        code: "open_capa",
        label: "Open CAPA",
        value: open.length,
        display: String(open.length),
        hint: open.length === 0 ? "Clear" : "Open loop",
        tone: open.length === 0 ? "good" : "watch",
        href: buildDrilldownHref("/app/capa", ctx.query),
        trend: formatTrend(created.length, prevCreated.length),
        polarity: "higher-is-worse",
        classification: "lagging",
        previous: prevCreated.length,
      }),
      metric({
        code: "overdue_capa",
        label: "Overdue CAPA",
        value: overdue.length,
        display: String(overdue.length),
        hint: overdue.length === 0 ? "On time" : "Needs action",
        tone: overdue.length === 0 ? "good" : "critical",
        href: buildDrilldownHref("/app/capa", ctx.query),
        trend: null,
        polarity: "higher-is-worse",
        classification: "lagging",
        previous: null,
      }),
      metric({
        code: "capa_effectiveness",
        label: "CAPA effectiveness",
        value: effectivenessPct,
        display: hasEffectiveness && effectivenessPct != null ? `${effectivenessPct}%` : "—",
        hint: hasEffectiveness ? "Verified / closed-loop" : summarizeNoEffectiveness(),
        tone: hasEffectiveness ? "neutral" : "watch",
        href: buildDrilldownHref("/app/capa", ctx.query),
        trend: null,
        polarity: "higher-is-better",
        classification: "lagging",
        previous: null,
        missingReason: hasEffectiveness ? undefined : summarizeNoEffectiveness(),
      }),
    ] satisfies MetricValue[],
    aging: capaAging(capa),
    overdueItems: overdue.slice(0, 10).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      due_date: row.due_date,
      priority: row.priority,
      href: "/app/capa",
    })),
    summaries: [summarizeDelta("Open CAPA (created in period)", created.length, prevCreated.length)],
  };
}

export async function getTrainingMetrics(ctx: AnalyticsContext) {
  const siteScoped = ctx.accessibleSiteIds !== null;
  if (siteScoped) {
    return {
      metrics: [
        metric({
          code: "training_overdue",
          label: "Training overdue",
          value: null,
          display: "—",
          hint: "Not site-scoped",
          tone: "neutral",
          href: "/app/training",
          trend: null,
          polarity: "higher-is-worse",
          classification: "leading",
          previous: null,
          missingReason: "Training assignments are person-scoped. Site totals are omitted so org-wide overdue counts are not mixed into a site view.",
        }),
      ] satisfies MetricValue[],
      byStatus: [] as SeriesPoint[],
      omitted: true,
    };
  }

  const { data } = await ctx.supabase
    .from("training_assignments")
    .select("id, status, due_date, expires_at")
    .eq("organization_id", ctx.organizationId)
    .is("deleted_at", null)
    .limit(2000);
  const training = data ?? [];
  const overdue = training.filter(
    (t) =>
      t.status === "expired" ||
      (t.due_date && t.due_date < ctx.period.localToday && t.status !== "completed" && t.status !== "cancelled"),
  );
  const open = training.filter((t) => t.status === "assigned" || t.status === "in_progress");
  return {
    metrics: [
      metric({
        code: "training_overdue",
        label: "Training overdue",
        value: overdue.length,
        display: String(overdue.length),
        hint: `${open.length} in progress`,
        tone: overdue.length === 0 ? "good" : "watch",
        href: "/app/training",
        trend: null,
        polarity: "higher-is-worse",
        classification: "leading",
        previous: null,
      }),
    ] satisfies MetricValue[],
    byStatus: countLabels(training.map((r) => r.status.replaceAll("_", " "))),
    omitted: false,
  };
}

export async function getContractorMetrics(ctx: AnalyticsContext) {
  let companyIds: string[] | null = null;
  if (ctx.accessibleSiteIds !== null) {
    if (!ctx.accessibleSiteIds.length) {
      return emptyContractorMetrics();
    }
    const { data: assignments } = await ctx.supabase
      .from("contractor_site_assignments")
      .select("company_id, site_id")
      .eq("organization_id", ctx.organizationId)
      .in("site_id", ctx.accessibleSiteIds);
    companyIds = [...new Set((assignments ?? []).map((a) => a.company_id))];
    if (!companyIds.length) return emptyContractorMetrics();
  }

  let q = ctx.supabase
    .from("contractor_companies")
    .select("id, name, status, safety_score")
    .eq("organization_id", ctx.organizationId)
    .is("deleted_at", null);
  if (companyIds) q = q.in("id", companyIds);
  const { data } = await q.limit(400);
  const contractors = data ?? [];
  const avgScore = average(contractors.map((c) => c.safety_score));
  return {
    metrics: [
      metric({
        code: "contractor_score",
        label: "Contractor score",
        value: avgScore,
        display: avgScore == null ? "—" : String(avgScore),
        hint: `${contractors.length} companies`,
        tone: avgScore == null ? "neutral" : avgScore >= 70 ? "good" : "watch",
        href: "/app/contractors",
        trend: null,
        polarity: "higher-is-better",
        classification: "lagging",
        previous: null,
        missingReason: avgScore == null ? "No recorded safety scores." : undefined,
      }),
    ] satisfies MetricValue[],
    series: contractors
      .filter((c) => typeof c.safety_score === "number")
      .slice(0, 8)
      .map((c) => ({ label: c.name, score: Number(c.safety_score) })),
  };
}

function emptyContractorMetrics() {
  return {
    metrics: [
      metric({
        code: "contractor_score",
        label: "Contractor score",
        value: null,
        display: "—",
        hint: "No companies in scope",
        tone: "neutral",
        href: "/app/contractors",
        trend: null,
        polarity: "higher-is-better" as const,
        classification: "lagging" as const,
        previous: null,
        missingReason: "No contractor site assignments in this scope.",
      }),
    ] satisfies MetricValue[],
    series: [] as Array<{ label: string; score: number }>,
  };
}

export async function getComplianceMetrics(ctx: AnalyticsContext) {
  const today = ctx.period.localToday;
  const [tasks, licenses] = await Promise.all([
    ctx.supabase
      .from("compliance_task_instances")
      .select("id, status, due_date")
      .eq("organization_id", ctx.organizationId),
    ctx.supabase
      .from("regulatory_permits")
      .select("id, expires_on, status")
      .eq("organization_id", ctx.organizationId),
  ]);
  const overdue = (tasks.data ?? []).filter(
    (t) => t.due_date < today && ["open", "in_progress", "overdue"].includes(t.status),
  ).length;
  const expiredLicenses = (licenses.data ?? []).filter((l) => isEvidenceExpired(l.expires_on)).length;
  return {
    metrics: [
      metric({
        code: "compliance_overdue",
        label: "Overdue filings",
        value: overdue,
        display: String(overdue),
        hint: "Same definition as executive compliance",
        tone: overdue === 0 ? "good" : "watch",
        href: "/app/executive/compliance",
        trend: null,
        polarity: "higher-is-worse",
        classification: "lagging",
        previous: null,
      }),
      metric({
        code: "expired_licenses",
        label: "Expired licenses",
        value: expiredLicenses,
        display: String(expiredLicenses),
        hint: "Regulatory permits",
        tone: expiredLicenses === 0 ? "good" : "critical",
        href: "/app/compliance/licenses",
        trend: null,
        polarity: "higher-is-worse",
        classification: "lagging",
        previous: null,
      }),
    ] satisfies MetricValue[],
  };
}

export async function getWorkforceReadinessMetrics(ctx: AnalyticsContext) {
  // New catalog table — keep the builder untyped so supabase-js does not infinitely instantiate.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hoursQuery: any = ctx.supabase
    .from("workforce_hours")
    .select("hours, site_id, period_start, period_end")
    .eq("organization_id", ctx.organizationId)
    .lte("period_start", ctx.period.end.toISOString().slice(0, 10))
    .gte("period_end", ctx.period.start.toISOString().slice(0, 10));
  hoursQuery = applySiteFilter(hoursQuery, ctx.accessibleSiteIds);
  const { data } = await hoursQuery.limit(500);
  const hours = asRows<HoursRow>(data).reduce((sum, row) => sum + Number(row.hours || 0), 0);
  const missing = hours <= 0;
  return {
    metrics: [
      metric({
        code: "workforce_hours",
        label: "Workforce hours",
        value: missing ? null : hours,
        display: missing ? "—" : String(hours),
        hint: missing ? "Not entered" : "Entered denominator",
        tone: missing ? "watch" : "neutral",
        href: "/app/analytics/workforce",
        trend: null,
        polarity: "neutral",
        classification: "denominator",
        previous: null,
        missingReason: missing ? summarizeMissingRate("Frequency rates") : undefined,
      }),
    ] satisfies MetricValue[],
    hours,
    missing,
  };
}

function countLabels(values: string[]): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

function namedCounts(ids: Array<string | null>, named: NamedOption[]): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const id of ids) {
    const key = id ?? "unassigned";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([id, value]) => ({
    label: named.find((n) => n.id === id)?.name ?? (id === "unassigned" ? "Unassigned" : id.slice(0, 8)),
    value,
  }));
}

export async function collectControlTower(ctx: AnalyticsContext) {
  const [
    incidents,
    risk,
    permits,
    inspections,
    audits,
    capa,
    training,
    contractors,
    compliance,
    workforce,
  ] = await Promise.all([
    getIncidentMetrics(ctx),
    getRiskMetrics(ctx),
    getPermitMetrics(ctx),
    getInspectionMetrics(ctx),
    getAuditMetrics(ctx),
    getCAPAMetrics(ctx),
    getTrainingMetrics(ctx),
    getContractorMetrics(ctx),
    getComplianceMetrics(ctx),
    getWorkforceReadinessMetrics(ctx),
  ]);

  const metrics = [
    ...incidents.metrics,
    ...risk.metrics,
    ...permits.metrics,
    ...inspections.metrics,
    ...audits.metrics,
    ...capa.metrics,
    ...training.metrics,
    ...contractors.metrics,
    ...compliance.metrics,
    ...workforce.metrics,
  ];

  const health = computeHealthScore(metrics, ctx.healthWeights);
  const flags = collectDataQuality({ training, workforce, capa, inspections });
  const alerts = collectAlerts({ capa, permits, incidents, compliance, inspections });
  const summaries = [
    ...incidents.summaries,
    ...capa.summaries,
    workforce.missing ? summarizeMissingRate("LTIFR / TRIR") : null,
    capa.metrics.find((m) => m.code === "capa_effectiveness")?.missingReason ?? null,
  ].filter((s): s is string => Boolean(s));

  return {
    ctx,
    metrics,
    health,
    flags,
    alerts,
    summaries,
    incidents,
    risk,
    permits,
    inspections,
    audits,
    capa,
    training,
    contractors,
    compliance,
    workforce,
  };
}

export function collectDataQuality(input: {
  training: Awaited<ReturnType<typeof getTrainingMetrics>>;
  workforce: Awaited<ReturnType<typeof getWorkforceReadinessMetrics>>;
  capa: Awaited<ReturnType<typeof getCAPAMetrics>>;
  inspections: Awaited<ReturnType<typeof getInspectionMetrics>>;
}): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];
  if (input.workforce.missing) {
    flags.push({
      code: "missing_hours",
      severity: "watch",
      message: "Workforce hours are not entered for this period. Rates are withheld; counts still display.",
    });
  }
  if (input.training.omitted) {
    flags.push({
      code: "training_not_site_scoped",
      severity: "info",
      message: "Training overdue is omitted from site-scoped totals because assignments are person-scoped.",
    });
  }
  if (input.capa.metrics.find((m) => m.code === "capa_effectiveness")?.missingReason) {
    flags.push({
      code: "no_effectiveness",
      severity: "info",
      message: summarizeNoEffectiveness(),
    });
  }
  if (input.inspections.metrics[0]?.missingReason) {
    flags.push({
      code: "no_inspections",
      severity: "info",
      message: "No inspection assignments in this scope.",
    });
  }
  return flags;
}

export function collectAlerts(input: {
  capa: Awaited<ReturnType<typeof getCAPAMetrics>>;
  permits: Awaited<ReturnType<typeof getPermitMetrics>>;
  incidents: Awaited<ReturnType<typeof getIncidentMetrics>>;
  compliance: Awaited<ReturnType<typeof getComplianceMetrics>>;
  inspections: Awaited<ReturnType<typeof getInspectionMetrics>>;
}): AnalyticsAlert[] {
  const alerts: AnalyticsAlert[] = [];
  for (const item of input.capa.overdueItems) {
    alerts.push({
      sourceType: "capa",
      sourceId: item.id,
      alertType: "overdue_capa",
      severity: "critical",
      title: `Overdue CAPA: ${item.title}`,
      href: "/app/capa",
      siteId: null,
    });
  }
  const critical = input.incidents.metrics.find((m) => m.code === "critical_incidents");
  if (critical && (critical.value ?? 0) > 0) {
    alerts.push({
      sourceType: "incident_metric",
      sourceId: "critical_incidents",
      alertType: "critical_incidents",
      severity: "critical",
      title: `${critical.value} critical incident(s) in period`,
      href: critical.href,
      siteId: null,
    });
  }
  const overdueFilings = input.compliance.metrics.find((m) => m.code === "compliance_overdue");
  if (overdueFilings && (overdueFilings.value ?? 0) > 0) {
    alerts.push({
      sourceType: "compliance_metric",
      sourceId: "compliance_overdue",
      alertType: "overdue_filings",
      severity: "watch",
      title: `${overdueFilings.value} overdue filing(s)`,
      href: "/app/executive/compliance",
      siteId: null,
    });
  }
  const expiredLicenses = input.compliance.metrics.find((m) => m.code === "expired_licenses");
  if (expiredLicenses && (expiredLicenses.value ?? 0) > 0) {
    alerts.push({
      sourceType: "compliance_metric",
      sourceId: "expired_licenses",
      alertType: "expired_licenses",
      severity: "critical",
      title: `${expiredLicenses.value} expired license(s)`,
      href: "/app/compliance/licenses",
      siteId: null,
    });
  }
  return dedupeAlerts(alerts);
}

export function dedupeAlerts(alerts: AnalyticsAlert[]) {
  const seen = new Set<string>();
  const out: AnalyticsAlert[] = [];
  for (const alert of alerts) {
    const key = `${alert.sourceType}:${alert.sourceId}:${alert.alertType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(alert);
  }
  return out;
}

export function defaultDashboardForRoles(roleCodes: string[]) {
  if (roleCodes.some((c) => ["tenant_admin", "ehs_admin", "ehs_manager", "super_admin"].includes(c))) {
    return "executive_control_tower";
  }
  if (roleCodes.some((c) => ["compliance_officer", "company_secretary", "esg_officer", "auditor", "viewer"].includes(c))) {
    return "assurance";
  }
  if (roleCodes.some((c) => ["site_manager", "supervisor", "department_head", "ehs_officer", "investigator"].includes(c))) {
    return "site_operations";
  }
  if (roleCodes.some((c) => ["employee", "contractor", "contractor_contact"].includes(c))) return "field_queue";
  return "site_operations";
}
