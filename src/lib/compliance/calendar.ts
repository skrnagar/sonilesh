export const COMPLIANCE_NOTIFICATION_EVENTS = [
  { key: "compliance.review_due", title: "Compliance Review Due" },
  { key: "compliance.overdue", title: "Compliance Overdue" },
  { key: "compliance.non_compliant", title: "Non-Compliance Created" },
  { key: "compliance.finding_assigned", title: "Finding Assigned" },
  { key: "capa.assigned", title: "CAPA Required" },
  { key: "capa.overdue", title: "CAPA Overdue" },
  { key: "compliance.license_expiring", title: "License Expiring" },
  { key: "permit.expiring", title: "Permit Expiring" },
  { key: "compliance.evidence_expiring", title: "Evidence Expiring" },
  { key: "regulatory_update.recorded", title: "Regulatory Update" },
  { key: "regulatory_update.applicable", title: "Impact Assessment Required" },
  { key: "esg.data_due", title: "ESG Data Due" },
  { key: "esg.verification_required", title: "ESG Verification Required" },
  { key: "esg.period_closing", title: "Reporting Period Closing" },
] as const;

export type ExpiryReminder = {
  stage: string;
  title: string;
  eventKey: string;
};

/** Shared 7-day / 1-day / overdue / escalate ladder used by filings, licenses, evidence. */
export function nextExpiryReminder(
  daysUntil: number,
  currentStage: string | null | undefined,
): ExpiryReminder | null {
  const stage = currentStage || "none";
  if (daysUntil < -2 && stage !== "escalate") {
    return { stage: "escalate", title: "Still overdue (escalation)", eventKey: "compliance.overdue" };
  }
  if (daysUntil < 0 && stage !== "overdue" && stage !== "escalate") {
    return { stage: "overdue", title: "Overdue", eventKey: "compliance.overdue" };
  }
  if (daysUntil === 1 && stage === "none") {
    return { stage: "d1", title: "Due tomorrow", eventKey: "compliance.review_due" };
  }
  if (daysUntil <= 7 && daysUntil > 1 && stage === "none") {
    return { stage: "d7", title: "Due in 7 days", eventKey: "compliance.review_due" };
  }
  if (daysUntil <= 30 && daysUntil > 7 && stage === "none") {
    return { stage: "d30", title: "Due within 30 days", eventKey: "compliance.review_due" };
  }
  return null;
}

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  kind: "task" | "license" | "evidence";
  status: string;
  href: string;
  siteId?: string | null;
  ownerId?: string | null;
  category?: string | null;
  completed?: boolean;
};

export type CalendarBucket = "upcoming" | "due_today" | "due_soon" | "overdue" | "completed";

export function bucketCalendarEvent(event: CalendarEvent, today: string): CalendarBucket {
  if (event.completed || ["filed", "verified", "completed", "closed"].includes(event.status)) {
    return "completed";
  }
  if (event.date < today) return "overdue";
  if (event.date === today) return "due_today";
  const days = Math.floor((new Date(event.date).getTime() - new Date(today).getTime()) / 86400000);
  if (days <= 7) return "due_soon";
  return "upcoming";
}

export function startOfWeekUtc(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function eventsInRange(events: CalendarEvent[], from: string, to: string) {
  return events.filter((event) => event.date >= from && event.date <= to);
}

export function monthGrid(year: number, monthIndex: number) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const start = startOfWeekUtc(first.toISOString().slice(0, 10));
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  for (let i = 0; i < 42; i++) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export type SearchHit = {
  organization_id: string;
  kind: string;
  id: string;
  title: string;
  href: string;
  subtitle?: string;
};

export function filterHitsBySessionOrg(hits: SearchHit[], sessionOrgId: string, urlOrgId?: string) {
  void urlOrgId;
  return hits.filter((hit) => hit.organization_id === sessionOrgId);
}

export function sanitizeSearchQuery(raw: string) {
  return raw.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
