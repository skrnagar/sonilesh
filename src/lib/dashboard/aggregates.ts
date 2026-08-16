export type DashboardRange = "weekly" | "monthly" | "yearly";

export function parseDashboardRange(value?: string | null): DashboardRange {
  if (value === "weekly" || value === "monthly" || value === "yearly") return value;
  return "monthly";
}

export function periodBounds(range: DashboardRange, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  if (range === "weekly") start.setUTCDate(start.getUTCDate() - 7);
  else if (range === "monthly") start.setUTCMonth(start.getUTCMonth() - 1);
  else start.setUTCFullYear(start.getUTCFullYear() - 1);

  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start);
  const prevStart = new Date(start.getTime() - duration);
  return { start, end, prevStart, prevEnd };
}

export function toIsoDate(date: Date) {
  return date.toISOString();
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export type SeriesPoint = { label: string; value: number };

export function bucketByPeriod(
  timestamps: string[],
  range: DashboardRange,
  start: Date,
  end: Date,
): SeriesPoint[] {
  const buckets = new Map<string, number>();
  const cursor = new Date(start);
  const labels: string[] = [];

  if (range === "yearly") {
    cursor.setUTCDate(1);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
      labels.push(key);
      buckets.set(key, 0);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  } else {
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      labels.push(key);
      buckets.set(key, 0);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  for (const stamp of timestamps) {
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime())) continue;
    const key =
      range === "yearly"
        ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
        : date.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return labels.map((label) => ({
    label: range === "yearly" ? label : label.slice(5),
    value: buckets.get(label) ?? 0,
  }));
}

const OPEN_EVENT_STATUSES = new Set([
  "submitted",
  "triage",
  "investigation",
  "capa",
  "verification",
  "approval",
  "reopened",
]);

const OPEN_CAPA_STATUSES = new Set(["open", "in_progress", "pending_verification"]);
const CLOSED_CAPA_STATUSES = new Set(["closed", "cancelled", "verified"]);
const COMPLETED_INSPECTION = new Set([
  "completed",
  "closed",
  "findings_review",
  "capa",
  "findings_recorded",
  "categorized",
  "capa_linked",
  "report_issued",
  "conducted",
]);

export function isOpenEventStatus(status: string) {
  return OPEN_EVENT_STATUSES.has(status);
}

export function isOpenCapaStatus(status: string) {
  return OPEN_CAPA_STATUSES.has(status);
}

export function inspectionCompletion(rows: Array<{ status: string }>) {
  const active = rows.filter((r) => r.status !== "cancelled");
  const completed = active.filter((r) => COMPLETED_INSPECTION.has(r.status)).length;
  const total = active.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}

export type AgingBucket = { label: string; value: number };

export function capaAging(items: Array<{ due_date: string | null; status: string }>, today = new Date()) {
  const buckets: AgingBucket[] = [
    { label: "On time", value: 0 },
    { label: "1–7d", value: 0 },
    { label: "8–14d", value: 0 },
    { label: "15–30d", value: 0 },
    { label: "30d+", value: 0 },
  ];

  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  for (const item of items) {
    if (CLOSED_CAPA_STATUSES.has(item.status)) continue;
    if (!item.due_date) {
      buckets[0].value += 1;
      continue;
    }
    const due = Date.parse(item.due_date);
    if (Number.isNaN(due) || due >= startOfToday) {
      buckets[0].value += 1;
      continue;
    }
    const days = Math.floor((startOfToday - due) / 86_400_000);
    if (days <= 7) buckets[1].value += 1;
    else if (days <= 14) buckets[2].value += 1;
    else if (days <= 30) buckets[3].value += 1;
    else buckets[4].value += 1;
  }

  return buckets;
}

export type HeatCell = { l: number; c: number; count: number };

export function riskHeat(
  hazards: Array<{ residual_likelihood: number | null; residual_consequence: number | null }>,
  size = 5,
) {
  const cells: HeatCell[] = [];
  for (let l = size; l >= 1; l--) {
    for (let c = 1; c <= size; c++) {
      cells.push({ l, c, count: 0 });
    }
  }
  for (const h of hazards) {
    const l = h.residual_likelihood;
    const c = h.residual_consequence;
    if (!l || !c || l < 1 || c < 1 || l > size || c > size) continue;
    const cell = cells.find((x) => x.l === l && x.c === c);
    if (cell) cell.count += 1;
  }
  return cells;
}

export function average(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function countBy(values: string[]) {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}
