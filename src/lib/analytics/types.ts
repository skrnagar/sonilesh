export type AnalyticsRangeKey =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "quarter"
  | "fy"
  | "last_7"
  | "last_30"
  | "last_90"
  | "custom";

export type MetricPolarity = "higher-is-worse" | "higher-is-better" | "neutral";
export type MetricClassification = "leading" | "lagging" | "denominator" | "composite";

export type AnalyticsQuery = {
  range?: string;
  siteId?: string;
  projectId?: string;
  departmentId?: string;
  businessUnitId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type NamedOption = { id: string; name: string };

export type ResolvedPeriod = {
  key: AnalyticsRangeKey;
  label: string;
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  timezone: string;
  fiscalYearStartMonth: number;
  localToday: string;
};

export type MetricValue = {
  code: string;
  label: string;
  value: number | null;
  display: string;
  hint: string;
  tone: "neutral" | "good" | "watch" | "critical";
  href: string;
  trend: number | null;
  polarity: MetricPolarity;
  classification: MetricClassification;
  previous: number | null;
  missingReason?: string;
};

export type SeriesPoint = { label: string; value: number };

export type AnalyticsAlert = {
  sourceType: string;
  sourceId: string;
  alertType: string;
  severity: "info" | "watch" | "critical";
  title: string;
  href: string;
  siteId: string | null;
};

export type HealthComponent = {
  code: string;
  label: string;
  weight: number;
  score: number | null;
  included: boolean;
  note: string;
};

export type HealthScoreResult = {
  score: number | null;
  components: HealthComponent[];
  explanation: string[];
  incomplete: boolean;
};

export type DataQualityFlag = {
  code: string;
  severity: "info" | "watch";
  message: string;
};
