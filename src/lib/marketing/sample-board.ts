/** Obviously-sample control-board datasets. Round numbers only. */

export const SAMPLE_DATA_LABEL = "Sample data";

export const BOARD_TABS = [
  "Dashboard",
  "Incidents",
  "Permits",
  "Compliance",
  "ESG",
  "Analytics",
] as const;

export type BoardTab = (typeof BOARD_TABS)[number];

export const SAMPLE_KPIS = {
  openIncidents: 12,
  overdueCapa: 4,
  permitsActive: 27,
} as const;

export const SAMPLE_INCIDENTS = [
  { id: "INC-120", title: "Scaffold gap at tower 4", severity: "High", site: "Package A", age: "2d" },
  { id: "INC-118", title: "Near miss — reversing dump truck", severity: "Medium", site: "Yard B", age: "4d" },
  { id: "INC-110", title: "PPE gap at store", severity: "Low", site: "Package A", age: "1w" },
] as const;

export const SAMPLE_PERMITS = [
  { id: "PTW-40", type: "Hot work", status: "Active", area: "Bay 2" },
  { id: "PTW-38", type: "Working at height", status: "Active", area: "Tower 4" },
  { id: "PTW-31", type: "Excavation", status: "Expiring", area: "Corridor" },
] as const;

export const SAMPLE_COMPLIANCE_WEEK = [
  { day: "Mon", label: "GSTR-3B", tone: "due" as const },
  { day: "Tue", label: "—", tone: "idle" as const },
  { day: "Wed", label: "POSH", tone: "open" as const },
  { day: "Thu", label: "—", tone: "idle" as const },
  { day: "Fri", label: "HW return", tone: "due" as const },
  { day: "Sat", label: "—", tone: "idle" as const },
  { day: "Sun", label: "—", tone: "idle" as const },
];

export const SAMPLE_ESG_CARDS = [
  { label: "Scope 1 (tCO₂e)", value: "1,200" },
  { label: "Scope 2 (tCO₂e)", value: "800" },
  { label: "Scope 3 (tCO₂e)", value: "2,400" },
  { label: "Training hours", value: "4,000" },
] as const;

export const SAMPLE_CAPA_PIPELINE = [
  { status: "Open", count: 8 },
  { status: "In progress", count: 6 },
  { status: "Verify", count: 4 },
  { status: "Closed", count: 20 },
] as const;

/** Round sample counts on a 5×5 likelihood × consequence grid (product Default 5x5). */
export const SAMPLE_RISK_COUNTS: number[][] = [
  // likelihood 5 → 1 (rows), consequence 1 → 5 (cols)
  [0, 0, 2, 2, 4],
  [0, 2, 4, 4, 2],
  [2, 4, 6, 4, 0],
  [4, 6, 4, 2, 0],
  [8, 4, 2, 0, 0],
];

export const RISK_LIKELIHOOD_LABELS = ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"] as const;
export const RISK_CONSEQUENCE_LABELS = ["Insignificant", "Minor", "Moderate", "Major", "Catastrophic"] as const;

/** Product default bands: 1–4 low, 5–9 medium, 10–14 high, 15–25 critical. */
export function sampleRiskBand(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 15) return "critical";
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  return "low";
}

export const SAMPLE_GHG_STACK = [
  { quarter: "Q1", scope1: 300, scope2: 200, scope3: 600 },
  { quarter: "Q2", scope1: 300, scope2: 200, scope3: 600 },
  { quarter: "Q3", scope1: 300, scope2: 200, scope3: 600 },
  { quarter: "Q4", scope1: 300, scope2: 200, scope3: 600 },
] as const;

export const SAMPLE_MATERIALITY = [
  { topic: "Workforce safety", stakeholder: 5, impact: 5 },
  { topic: "Energy", stakeholder: 4, impact: 4 },
  { topic: "Waste", stakeholder: 3, impact: 4 },
  { topic: "Water", stakeholder: 3, impact: 3 },
  { topic: "Community", stakeholder: 4, impact: 2 },
  { topic: "Supply chain", stakeholder: 2, impact: 3 },
] as const;

export const SAMPLE_COMPLIANCE_DOMAINS = [
  { domain: "Labour", onTrack: 8, dueSoon: 2, overdue: 0 },
  { domain: "Environment", onTrack: 6, dueSoon: 2, overdue: 2 },
  { domain: "Tax & MCA", onTrack: 4, dueSoon: 0, overdue: 0 },
  { domain: "ESG", onTrack: 2, dueSoon: 2, overdue: 0 },
] as const;

export const SAMPLE_COMPLIANCE_DONUT = [
  { name: "On track", value: 20 },
  { name: "Due soon", value: 6 },
  { name: "Overdue", value: 2 },
] as const;
