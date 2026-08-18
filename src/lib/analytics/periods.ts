import type { AnalyticsQuery, AnalyticsRangeKey, ResolvedPeriod } from "./types";

const RANGE_LABELS: Record<AnalyticsRangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  fy: "This fiscal year",
  last_7: "Last 7 days",
  last_30: "Last 30 days",
  last_90: "Last 90 days",
  custom: "Custom",
};

export function parseAnalyticsRange(value?: string | null): AnalyticsRangeKey {
  if (
    value === "today" ||
    value === "yesterday" ||
    value === "week" ||
    value === "month" ||
    value === "quarter" ||
    value === "fy" ||
    value === "last_7" ||
    value === "last_30" ||
    value === "last_90" ||
    value === "custom"
  ) {
    return value;
  }
  if (value === "weekly") return "week";
  if (value === "monthly") return "month";
  if (value === "yearly") return "fy";
  return "month";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Wall-clock parts of `date` in `timeZone`. */
export function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  const hourRaw = Number(bag.hour);
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: hourRaw === 24 ? 0 : hourRaw,
    minute: Number(bag.minute),
    second: Number(bag.second),
    weekday: bag.weekday,
  };
}

function offsetMs(instant: Date, timeZone: string) {
  const parts = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - instant.getTime();
}

/** Convert a civil datetime in `timeZone` to a UTC Date. */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = new Date(utcGuess - offsetMs(new Date(utcGuess), timeZone));
  instant = new Date(utcGuess - offsetMs(instant, timeZone));
  return instant;
}

export function startOfZonedDay(year: number, month: number, day: number, timeZone: string) {
  return zonedLocalToUtc(year, month, day, 0, 0, 0, timeZone);
}

export function endOfZonedDay(year: number, month: number, day: number, timeZone: string) {
  return zonedLocalToUtc(year, month, day, 23, 59, 59, timeZone);
}

function addDays(year: number, month: number, day: number, days: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

function weekdayIndex(weekday: string) {
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[weekday] ?? 1;
}

function fiscalYearStart(parts: { year: number; month: number; day: number }, fyStartMonth: number) {
  const year = parts.month >= fyStartMonth ? parts.year : parts.year - 1;
  return { year, month: fyStartMonth, day: 1 };
}

function quarterStart(parts: { year: number; month: number }) {
  const qMonth = Math.floor((parts.month - 1) / 3) * 3 + 1;
  return { year: parts.year, month: qMonth, day: 1 };
}

export function localYmd(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function resolveAnalyticsPeriod(input: {
  query: AnalyticsQuery;
  timeZone: string;
  fiscalYearStartMonth?: number;
  now?: Date;
}): ResolvedPeriod {
  const timeZone = input.timeZone || "UTC";
  const fyStart = Math.min(12, Math.max(1, input.fiscalYearStartMonth ?? 4));
  const now = input.now ?? new Date();
  const parts = zonedParts(now, timeZone);
  const key = parseAnalyticsRange(input.query.range);
  const todayYmd = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;

  let startCivil = { year: parts.year, month: parts.month, day: parts.day };
  let endCivil = { year: parts.year, month: parts.month, day: parts.day };
  let resolvedKey = key;

  if (key === "custom" || input.query.dateFrom || input.query.dateTo) {
    const from = parseIsoDate(input.query.dateFrom || "") ?? startCivil;
    const to = parseIsoDate(input.query.dateTo || "") ?? endCivil;
    startCivil = from;
    endCivil = to;
    resolvedKey = input.query.dateFrom || input.query.dateTo ? "custom" : key;
  } else if (key === "today") {
    startCivil = { year: parts.year, month: parts.month, day: parts.day };
    endCivil = startCivil;
  } else if (key === "yesterday") {
    startCivil = addDays(parts.year, parts.month, parts.day, -1);
    endCivil = startCivil;
  } else if (key === "week") {
    const back = weekdayIndex(parts.weekday) - 1;
    startCivil = addDays(parts.year, parts.month, parts.day, -back);
    endCivil = { year: parts.year, month: parts.month, day: parts.day };
  } else if (key === "month") {
    startCivil = { year: parts.year, month: parts.month, day: 1 };
    endCivil = { year: parts.year, month: parts.month, day: parts.day };
  } else if (key === "quarter") {
    startCivil = quarterStart(parts);
    endCivil = { year: parts.year, month: parts.month, day: parts.day };
  } else if (key === "fy") {
    startCivil = fiscalYearStart(parts, fyStart);
    endCivil = { year: parts.year, month: parts.month, day: parts.day };
  } else if (key === "last_7") {
    startCivil = addDays(parts.year, parts.month, parts.day, -6);
    endCivil = { year: parts.year, month: parts.month, day: parts.day };
  } else if (key === "last_30") {
    startCivil = addDays(parts.year, parts.month, parts.day, -29);
    endCivil = { year: parts.year, month: parts.month, day: parts.day };
  } else if (key === "last_90") {
    startCivil = addDays(parts.year, parts.month, parts.day, -89);
    endCivil = { year: parts.year, month: parts.month, day: parts.day };
  }

  const start = startOfZonedDay(startCivil.year, startCivil.month, startCivil.day, timeZone);
  const end = endOfZonedDay(endCivil.year, endCivil.month, endCivil.day, timeZone);
  const duration = Math.max(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000 - 1);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);

  return {
    key: resolvedKey,
    label: RANGE_LABELS[resolvedKey],
    start,
    end,
    prevStart,
    prevEnd,
    timezone: timeZone,
    fiscalYearStartMonth: fyStart,
    localToday: todayYmd,
  };
}

export function inPeriod(iso: string | null | undefined, start: Date, end: Date) {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return t >= start.getTime() && t <= end.getTime();
}

export function bucketByOrgDay(
  timestamps: string[],
  start: Date,
  end: Date,
  timeZone: string,
): Array<{ label: string; value: number }> {
  const buckets = new Map<string, number>();
  const labels: string[] = [];
  const cursorParts = zonedParts(start, timeZone);
  let civil = { year: cursorParts.year, month: cursorParts.month, day: cursorParts.day };
  const endParts = zonedParts(end, timeZone);
  const endKey = `${endParts.year}-${pad(endParts.month)}-${pad(endParts.day)}`;

  for (let i = 0; i < 400; i++) {
    const key = `${civil.year}-${pad(civil.month)}-${pad(civil.day)}`;
    labels.push(key);
    buckets.set(key, 0);
    if (key === endKey) break;
    civil = addDays(civil.year, civil.month, civil.day, 1);
  }

  for (const stamp of timestamps) {
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime())) continue;
    const key = localYmd(date, timeZone);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const compact = labels.length > 45;
  return labels.map((label) => ({
    label: compact ? label.slice(5) : label.slice(5),
    value: buckets.get(label) ?? 0,
  }));
}
