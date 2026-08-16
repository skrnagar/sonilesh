import type { SupabaseClient } from "@supabase/supabase-js";
import {
  average,
  bucketByPeriod,
  capaAging,
  countBy,
  inspectionCompletion,
  isOpenCapaStatus,
  isOpenEventStatus,
  parseDashboardRange,
  percentChange,
  periodBounds,
  riskHeat,
  type DashboardRange,
} from "@/lib/dashboard/aggregates";

export type DashboardQuery = {
  range?: string;
  siteId?: string;
  projectId?: string;
  departmentId?: string;
  businessUnitId?: string;
  severityId?: string;
  status?: string;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type Named = { id: string; name: string };
type Owner = { id: string; name: string };

export type DashboardKpi = {
  key: string;
  label: string;
  value: string | number;
  hint: string;
  tone: "neutral" | "good" | "watch" | "critical";
  href: string;
  icon: string;
  accent: "navy" | "blue" | "green" | "amber" | "red" | "slate";
  trend: number | null;
  polarity: "higher-is-worse" | "higher-is-better";
  spark: number[];
};

export type DashboardSnapshot = {
  range: DashboardRange;
  organizationName: string;
  kpis: DashboardKpi[];
  incidentTrend: Array<{ label: string; incidents: number; nearMisses: number }>;
  severitySeries: Array<{ label: string; value: number; color?: string }>;
  nearMissSeries: Array<{ label: string; value: number }>;
  capaAging: Array<{ label: string; value: number }>;
  riskHeat: Array<{ l: number; c: number; count: number }>;
  inspectionSeries: Array<{ label: string; value: number }>;
  trainingSeries: Array<{ label: string; value: number }>;
  contractorSeries: Array<{ label: string; score: number }>;
  recentEvents: Array<{
    id: string;
    event_number: string;
    title: string | null;
    status: string;
    occurred_at: string;
    type: string;
    severity: string;
  }>;
  overdueCapa: Array<{
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    priority: string;
  }>;
  filters: {
    sites: Named[];
    projects: Named[];
    departments: Named[];
    bus: Named[];
    severities: Named[];
    owners: Owner[];
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyScope(query: any, params: DashboardQuery) {
  let next = query;
  if (params.siteId) next = next.eq("site_id", params.siteId);
  if (params.projectId) next = next.eq("project_id", params.projectId);
  if (params.departmentId) next = next.eq("department_id", params.departmentId);
  if (params.businessUnitId) next = next.eq("business_unit_id", params.businessUnitId);
  return next;
}

type EventRow = {
  id: string;
  event_number: string;
  title: string | null;
  status: string;
  occurred_at: string;
  event_type_id: string;
  severity_id: string | null;
};

function sparkFromSeries(points: Array<{ value: number }>) {
  return points.map((p) => p.value);
}

export async function getDashboardSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
  organizationName: string,
  params: DashboardQuery,
): Promise<DashboardSnapshot> {
  const range = parseDashboardRange(params.range);
  const bounds = periodBounds(range);
  const start = params.dateFrom ? new Date(`${params.dateFrom}T00:00:00.000Z`) : bounds.start;
  const end = params.dateTo ? new Date(`${params.dateTo}T23:59:59.999Z`) : bounds.end;
  const duration = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - duration);
  const today = new Date().toISOString().slice(0, 10);

  const [
    sitesRes,
    projectsRes,
    departmentsRes,
    busRes,
    eventTypesRes,
    severitiesRes,
    membersRes,
  ] = await Promise.all([
    supabase.from("sites").select("id, name").eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("projects").select("id, name").eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("business_units").select("id, name").eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("event_types").select("id, code, name").is("organization_id", null),
    supabase.from("severity_levels").select("id, code, name, rank, color").is("organization_id", null),
    supabase
      .from("organization_members")
      .select("user_id, profiles:user_id(id, full_name, email)")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .is("deleted_at", null),
  ]);

  const typeId = (code: string) => eventTypesRes.data?.find((t) => t.code === code)?.id ?? null;
  const typeName = (id: string) => eventTypesRes.data?.find((t) => t.id === id)?.name ?? "Event";
  const severityName = (id: string | null) =>
    severitiesRes.data?.find((s) => s.id === id)?.name ?? "—";
  const criticalIds = (severitiesRes.data ?? [])
    .filter((s) => s.rank >= 4 || s.code === "critical")
    .map((s) => s.id);
  const incidentType = typeId("incident");
  const nearMissType = typeId("near_miss");
  const uaType = typeId("unsafe_act");
  const ucType = typeId("unsafe_condition");

  let eventsQuery = applyScope(
    supabase
      .from("ehs_events")
      .select(
        "id, event_number, title, status, occurred_at, event_type_id, severity_id, assigned_to",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .gte("occurred_at", prevStart.toISOString())
      .lte("occurred_at", end.toISOString()),
    params,
  );
  if (params.severityId) eventsQuery = eventsQuery.eq("severity_id", params.severityId);
  if (params.status) eventsQuery = eventsQuery.eq("status", params.status);
  if (params.ownerId) eventsQuery = eventsQuery.eq("assigned_to", params.ownerId);

  const [
    eventsRes,
    capaRes,
    permitsRes,
    inspectionsRes,
    findingsRes,
    trainingRes,
    contractorsRes,
    hazardsRes,
    recentRes,
    overdueCapaRes,
  ] = await Promise.all([
    eventsQuery.order("occurred_at", { ascending: false }).limit(4000),
    supabase
      .from("capa_items")
      .select("id, title, status, due_date, priority, created_at")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(2000),
    supabase
      .from("permits")
      .select("id, status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(2000),
    supabase
      .from("checklist_assignments")
      .select("id, status, checklist_type, completed_at, created_at")
      .eq("organization_id", organizationId)
      .eq("checklist_type", "inspection")
      .is("deleted_at", null)
      .limit(2000),
    supabase
      .from("checklist_findings")
      .select("id, status, created_at")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(2000),
    supabase
      .from("training_assignments")
      .select("id, status, due_date, expires_at")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(2000),
    supabase
      .from("contractor_companies")
      .select("id, name, status, safety_score")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(200),
    supabase
      .from("risk_hazards")
      .select("id, residual_likelihood, residual_consequence, residual_band")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(2000),
    applyScope(
      supabase
        .from("ehs_events")
        .select("id, event_number, title, status, occurred_at, event_type_id, severity_id")
        .eq("organization_id", organizationId)
        .is("deleted_at", null),
      params,
    )
      .order("occurred_at", { ascending: false })
      .limit(10),
    supabase
      .from("capa_items")
      .select("id, title, status, due_date, priority")
      .eq("organization_id", organizationId)
      .lt("due_date", today)
      .not("status", "in", '("closed","cancelled","verified")')
      .is("deleted_at", null)
      .order("due_date", { ascending: true })
      .limit(8),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const inCurrent = events.filter((e) => {
    const t = Date.parse(e.occurred_at);
    return t >= start.getTime() && t <= end.getTime();
  });
  const inPrev = events.filter((e) => {
    const t = Date.parse(e.occurred_at);
    return t >= prevStart.getTime() && t < start.getTime();
  });

  const ofType = (rows: typeof events, type: string | null) =>
    type ? rows.filter((e) => e.event_type_id === type) : [];

  const incidents = ofType(inCurrent, incidentType);
  const prevIncidents = ofType(inPrev, incidentType);
  const openIncidents = incidents.filter((e) => isOpenEventStatus(e.status));
  const prevOpen = prevIncidents.filter((e) => isOpenEventStatus(e.status));
  const critical = incidents.filter((e) => e.severity_id && criticalIds.includes(e.severity_id));
  const prevCritical = prevIncidents.filter(
    (e) => e.severity_id && criticalIds.includes(e.severity_id),
  );
  const nearMisses = ofType(inCurrent, nearMissType);
  const ua = ofType(inCurrent, uaType);
  const uc = ofType(inCurrent, ucType);
  const uauc = ua.length + uc.length;
  const prevUauc = ofType(inPrev, uaType).length + ofType(inPrev, ucType).length;

  const capa = capaRes.data ?? [];
  const openCapa = capa.filter((c) => isOpenCapaStatus(c.status));
  const overdueCapa = capa.filter(
    (c) => c.due_date && c.due_date < today && isOpenCapaStatus(c.status),
  );
  const prevCapaWindow = capa.filter((c) => {
    if (!c.created_at) return false;
    const t = Date.parse(c.created_at);
    return t >= prevStart.getTime() && t < start.getTime() && isOpenCapaStatus(c.status);
  });

  const inspections = inspectionsRes.data ?? [];
  const insp = inspectionCompletion(inspections);
  const prevInspections = inspections.filter((row) => {
    const stamp = row.completed_at || row.created_at;
    if (!stamp) return false;
    const t = Date.parse(stamp);
    return t >= prevStart.getTime() && t < start.getTime();
  });
  const prevInsp = inspectionCompletion(prevInspections);

  const findings = findingsRes.data ?? [];
  const openFindings = findings.filter((f) => f.status === "open" || f.status === "capa_linked");
  const training = trainingRes.data ?? [];
  const trainingOpen = training.filter((t) => t.status === "assigned" || t.status === "in_progress");
  const trainingOverdue = training.filter(
    (t) =>
      (t.status === "expired" || (t.due_date && t.due_date < today && t.status !== "completed" && t.status !== "cancelled")),
  );
  const permits = permitsRes.data ?? [];
  const activePermits = permits.filter((p) => p.status === "active" || p.status === "authorization");
  const hazards = hazardsRes.data ?? [];
  const highRisk = hazards.filter(
    (h) =>
      (h.residual_band && /high|extreme|critical/i.test(h.residual_band)) ||
      (typeof h.residual_likelihood === "number" &&
        typeof h.residual_consequence === "number" &&
        h.residual_likelihood * h.residual_consequence >= 15),
  );
  const contractors = contractorsRes.data ?? [];
  const avgScore = average(contractors.map((c) => c.safety_score));

  const incidentSpark = sparkFromSeries(
    bucketByPeriod(
      incidents.map((e) => e.occurred_at),
      range,
      start,
      end,
    ),
  );
  const nearSpark = sparkFromSeries(
    bucketByPeriod(
      nearMisses.map((e) => e.occurred_at),
      range,
      start,
      end,
    ),
  );

  const incidentBuckets = bucketByPeriod(
    incidents.map((e) => e.occurred_at),
    range,
    start,
    end,
  );
  const nearBuckets = bucketByPeriod(
    nearMisses.map((e) => e.occurred_at),
    range,
    start,
    end,
  );
  const incidentTrend = incidentBuckets.map((point, i) => ({
    label: point.label,
    incidents: point.value,
    nearMisses: nearBuckets[i]?.value ?? 0,
  }));

  const severitySeries = (severitiesRes.data ?? [])
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((sev) => ({
      label: sev.name,
      value: incidents.filter((e) => e.severity_id === sev.id).length,
      color: sev.color ?? undefined,
    }));

  const kpis: DashboardKpi[] = [
    {
      key: "total-incidents",
      label: "Total incidents",
      value: incidents.length,
      hint: incidents.length === 0 ? "Clear" : "Recorded",
      tone: incidents.length === 0 ? "good" : "neutral",
      href: "/app/incidents",
      icon: "AlertTriangle",
      accent: "navy",
      trend: percentChange(incidents.length, prevIncidents.length),
      polarity: "higher-is-worse",
      spark: incidentSpark,
    },
    {
      key: "open-incidents",
      label: "Open incidents",
      value: openIncidents.length,
      hint: openIncidents.length === 0 ? "Clear" : "In workflow",
      tone: openIncidents.length === 0 ? "good" : "watch",
      href: "/app/incidents",
      icon: "FolderOpen",
      accent: "blue",
      trend: percentChange(openIncidents.length, prevOpen.length),
      polarity: "higher-is-worse",
      spark: sparkFromSeries(
        bucketByPeriod(
          openIncidents.map((e) => e.occurred_at),
          range,
          start,
          end,
        ),
      ),
    },
    {
      key: "critical-incidents",
      label: "Critical incidents",
      value: critical.length,
      hint: critical.length === 0 ? "None" : "Investigate",
      tone: critical.length === 0 ? "good" : "critical",
      href: "/app/incidents",
      icon: "Siren",
      accent: "red",
      trend: percentChange(critical.length, prevCritical.length),
      polarity: "higher-is-worse",
      spark: sparkFromSeries(
        bucketByPeriod(
          critical.map((e) => e.occurred_at),
          range,
          start,
          end,
        ),
      ),
    },
    {
      key: "near-misses",
      label: "Near misses",
      value: nearMisses.length,
      hint: "Leading",
      tone: "neutral",
      href: "/app/near-misses",
      icon: "ShieldAlert",
      accent: "amber",
      trend: percentChange(nearMisses.length, ofType(inPrev, nearMissType).length),
      polarity: "higher-is-better",
      spark: nearSpark,
    },
    {
      key: "uauc",
      label: "UA / UC",
      value: uauc,
      hint: uauc > 0 ? "Observations" : "Clear",
      tone: uauc > 0 ? "watch" : "good",
      href: "/app/hazards",
      icon: "Eye",
      accent: "amber",
      trend: percentChange(uauc, prevUauc),
      polarity: "higher-is-worse",
      spark: sparkFromSeries(
        bucketByPeriod(
          [...ua, ...uc].map((e) => e.occurred_at),
          range,
          start,
          end,
        ),
      ),
    },
    {
      key: "open-capa",
      label: "Open CAPA",
      value: openCapa.length,
      hint: openCapa.length === 0 ? "Clear" : "Open loop",
      tone: openCapa.length === 0 ? "good" : "watch",
      href: "/app/capa",
      icon: "ListChecks",
      accent: "blue",
      trend: percentChange(openCapa.length, prevCapaWindow.length),
      polarity: "higher-is-worse",
      spark: [],
    },
    {
      key: "overdue-capa",
      label: "Overdue CAPA",
      value: overdueCapa.length,
      hint: overdueCapa.length === 0 ? "On time" : "Needs action",
      tone: overdueCapa.length === 0 ? "good" : "critical",
      href: "/app/capa",
      icon: "ClockAlert",
      accent: "red",
      trend: null,
      polarity: "higher-is-worse",
      spark: [],
    },
    {
      key: "inspections",
      label: "Inspection completion",
      value: `${insp.percent}%`,
      hint: `${insp.completed}/${insp.total}`,
      tone: insp.percent >= 80 || insp.total === 0 ? "good" : "watch",
      href: "/app/inspections",
      icon: "ClipboardCheck",
      accent: "green",
      trend: percentChange(insp.percent, prevInsp.percent),
      polarity: "higher-is-better",
      spark: [],
    },
    {
      key: "audit-findings",
      label: "Audit findings",
      value: openFindings.length,
      hint: openFindings.length === 0 ? "Clear" : "Open",
      tone: openFindings.length === 0 ? "good" : "watch",
      href: "/app/audits",
      icon: "FileSearch",
      accent: "navy",
      trend: null,
      polarity: "higher-is-worse",
      spark: [],
    },
    {
      key: "training",
      label: "Training overdue",
      value: trainingOverdue.length,
      hint: `${trainingOpen.length} in progress`,
      tone: trainingOverdue.length === 0 ? "good" : "watch",
      href: "/app/training",
      icon: "GraduationCap",
      accent: "amber",
      trend: null,
      polarity: "higher-is-worse",
      spark: [],
    },
    {
      key: "permits",
      label: "Active permits",
      value: activePermits.length,
      hint: "Live work",
      tone: "neutral",
      href: "/app/permits",
      icon: "FileBadge",
      accent: "green",
      trend: null,
      polarity: "higher-is-better",
      spark: [],
    },
    {
      key: "risk",
      label: "High residual risk",
      value: highRisk.length,
      hint: `${hazards.length} hazards`,
      tone: highRisk.length === 0 ? "good" : "watch",
      href: "/app/risk-assessments",
      icon: "Grid2x2",
      accent: "red",
      trend: null,
      polarity: "higher-is-worse",
      spark: [],
    },
    {
      key: "contractors",
      label: "Contractor score",
      value: avgScore == null ? "—" : avgScore,
      hint: `${contractors.length} companies`,
      tone: avgScore == null ? "neutral" : avgScore >= 70 ? "good" : "watch",
      href: "/app/contractors",
      icon: "HardHat",
      accent: "slate",
      trend: null,
      polarity: "higher-is-better",
      spark: [],
    },
  ];

  const owners: Owner[] = (membersRes.data ?? []).map((m) => {
    const profile = m.profiles as unknown as { id?: string; full_name?: string | null; email?: string | null } | null;
    const id = profile?.id || m.user_id;
    return {
      id,
      name: profile?.full_name || profile?.email || "Member",
    };
  });

  return {
    range,
    organizationName,
    kpis,
    incidentTrend,
    severitySeries,
    nearMissSeries: [
      { label: "Incidents", value: incidents.length },
      { label: "Near misses", value: nearMisses.length },
    ],
    capaAging: capaAging(capa),
    riskHeat: riskHeat(hazards),
    inspectionSeries: countBy(inspections.map((r) => r.status.replaceAll("_", " "))),
    trainingSeries: countBy(training.map((r) => r.status.replaceAll("_", " "))),
    contractorSeries: contractors
      .filter((c) => typeof c.safety_score === "number")
      .slice(0, 8)
      .map((c) => ({ label: c.name, score: Number(c.safety_score) })),
    recentEvents: ((recentRes.data ?? []) as EventRow[]).map((row) => ({
      id: row.id,
      event_number: row.event_number,
      title: row.title,
      status: row.status,
      occurred_at: row.occurred_at,
      type: typeName(row.event_type_id),
      severity: severityName(row.severity_id),
    })),
    overdueCapa: overdueCapaRes.data ?? [],
    filters: {
      sites: sitesRes.data ?? [],
      projects: projectsRes.data ?? [],
      departments: departmentsRes.data ?? [],
      bus: busRes.data ?? [],
      severities: (severitiesRes.data ?? []).map((s) => ({ id: s.id, name: s.name })),
      owners,
    },
  };
}
