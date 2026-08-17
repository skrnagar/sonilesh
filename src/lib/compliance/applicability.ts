export const TURNOVER_BANDS = ["under_50cr", "50_250cr", "250_500cr", "500cr_plus"] as const;
export const NET_WORTH_BANDS = ["under_50cr", "50_250cr", "250_500cr", "500cr_plus"] as const;
export const NET_PROFIT_BANDS = ["under_5cr", "5_50cr", "50cr_plus"] as const;
export const EMPLOYEE_BANDS = ["1_50", "51_250", "251_1000", "1000_plus"] as const;
export const WASTE_STREAMS = ["plastic", "e-waste", "battery", "hazardous", "c_and_d", "elv"] as const;

export type TurnoverBand = (typeof TURNOVER_BANDS)[number];
export type NetWorthBand = (typeof NET_WORTH_BANDS)[number];
export type NetProfitBand = (typeof NET_PROFIT_BANDS)[number];
export type EmployeeBand = (typeof EMPLOYEE_BANDS)[number];
export type WasteStream = (typeof WASTE_STREAMS)[number];

export type ApplicabilityRules = {
  is_listed?: boolean;
  min_market_cap_rank?: number;
  min_turnover_band?: string;
  min_net_worth_band?: string;
  min_net_profit_band?: string;
  min_employee_band?: string;
  sector_in?: string[];
  waste_stream_in?: string[];
  exports_to_eu?: boolean;
  ccts_sector?: boolean;
  ccts_sector_in?: boolean;
};

export type OrgComplianceProfileInput = {
  industry_sector?: string | null;
  sub_sectors?: string[] | null;
  is_listed: boolean;
  market_cap_rank?: number | null;
  turnover_band?: string | null;
  net_worth_band?: string | null;
  net_profit_band?: string | null;
  employee_count_band?: string | null;
  states_of_operation?: string[] | null;
  exports_to_eu: boolean;
  waste_streams_generated?: string[] | null;
  ccts_sector: boolean;
};

export type RuleMatch = { key: string; reason: string };

const BAND_RANK: Record<string, number> = {
  under_50cr: 1,
  "50_250cr": 2,
  "250_500cr": 3,
  "500cr_plus": 4,
  under_5cr: 1,
  "5_50cr": 2,
  "50cr_plus": 3,
  "1_50": 1,
  "51_250": 2,
  "251_1000": 3,
  "1000_plus": 4,
};

const BAND_LABEL: Record<string, string> = {
  under_50cr: "under ₹50Cr",
  "50_250cr": "₹50–250Cr",
  "250_500cr": "₹250–500Cr",
  "500cr_plus": "₹500Cr+",
  under_5cr: "under ₹5Cr",
  "5_50cr": "₹5–50Cr",
  "50cr_plus": "₹50Cr+",
  "1_50": "1–50 employees",
  "51_250": "51–250 employees",
  "251_1000": "251–1000 employees",
  "1000_plus": "1000+ employees",
};

export function normalizeSector(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function meetsMinBand(profileBand: string | null | undefined, minBand: string) {
  const have = BAND_RANK[profileBand ?? ""];
  const need = BAND_RANK[minBand];
  if (!have || !need) return false;
  return have >= need;
}

function emptyRules(rules: ApplicabilityRules) {
  return Object.keys(rules).length === 0;
}

/** Evaluate one obligation's JSON rules against an org profile. */
export function evaluateObligationRules(
  rules: ApplicabilityRules | null | undefined,
  profile: OrgComplianceProfileInput,
): { applies: boolean; matches: RuleMatch[] } {
  const r = rules ?? {};
  if (emptyRules(r)) {
    return {
      applies: true,
      matches: [{ key: "universal", reason: "Applies to all organizations in this library (baseline filing)." }],
    };
  }

  const matches: RuleMatch[] = [];
  const fail = () => ({ applies: false, matches: [] as RuleMatch[] });

  if (typeof r.is_listed === "boolean") {
    if (profile.is_listed !== r.is_listed) return fail();
    matches.push({
      key: "is_listed",
      reason: r.is_listed
        ? "Applies because: your organization is listed."
        : "Applies because: your organization is unlisted.",
    });
  }

  if (typeof r.min_market_cap_rank === "number") {
    const rank = profile.market_cap_rank;
    if (!profile.is_listed || rank == null || rank > r.min_market_cap_rank) return fail();
    matches.push({
      key: "min_market_cap_rank",
      reason: `Applies because: your market-cap rank is ${rank} (threshold: top ${r.min_market_cap_rank}).`,
    });
  }

  if (r.min_turnover_band) {
    if (!meetsMinBand(profile.turnover_band, r.min_turnover_band)) return fail();
    matches.push({
      key: "min_turnover_band",
      reason: `Applies because: your turnover band is ${BAND_LABEL[profile.turnover_band ?? ""] ?? profile.turnover_band} (minimum ${BAND_LABEL[r.min_turnover_band] ?? r.min_turnover_band}).`,
    });
  }

  if (r.min_net_worth_band) {
    if (!meetsMinBand(profile.net_worth_band, r.min_net_worth_band)) return fail();
    matches.push({
      key: "min_net_worth_band",
      reason: `Applies because: your net worth band is ${BAND_LABEL[profile.net_worth_band ?? ""] ?? profile.net_worth_band} (minimum ${BAND_LABEL[r.min_net_worth_band] ?? r.min_net_worth_band}).`,
    });
  }

  if (r.min_net_profit_band) {
    if (!meetsMinBand(profile.net_profit_band, r.min_net_profit_band)) return fail();
    matches.push({
      key: "min_net_profit_band",
      reason: `Applies because: your net profit band is ${BAND_LABEL[profile.net_profit_band ?? ""] ?? profile.net_profit_band}.`,
    });
  }

  if (r.min_employee_band) {
    if (!meetsMinBand(profile.employee_count_band, r.min_employee_band)) return fail();
    matches.push({
      key: "min_employee_band",
      reason: `Applies because: your employee count band is ${BAND_LABEL[profile.employee_count_band ?? ""] ?? profile.employee_count_band}.`,
    });
  }

  if (r.sector_in?.length) {
    const sector = normalizeSector(profile.industry_sector);
    const extras = (profile.sub_sectors ?? []).map(normalizeSector);
    const allowed = r.sector_in.map(normalizeSector);
    if (!allowed.includes(sector) && !extras.some((s) => allowed.includes(s))) return fail();
    matches.push({
      key: "sector_in",
      reason: `Applies because: your sector (${profile.industry_sector ?? "n/a"}) is in the obligation's industry list.`,
    });
  }

  if (r.waste_stream_in?.length) {
    const have = new Set(profile.waste_streams_generated ?? []);
    if (!r.waste_stream_in.some((stream) => have.has(stream))) return fail();
    const hit = r.waste_stream_in.filter((stream) => have.has(stream)).join(", ");
    matches.push({
      key: "waste_stream_in",
      reason: `Applies because: you generate these waste streams: ${hit}.`,
    });
  }

  if (r.exports_to_eu === true) {
    if (!profile.exports_to_eu) return fail();
    matches.push({
      key: "exports_to_eu",
      reason: "Applies because: you export to the EU (CBAM embedded-emissions data).",
    });
  }

  const ccts = r.ccts_sector === true || r.ccts_sector_in === true;
  if (ccts) {
    if (!profile.ccts_sector) return fail();
    matches.push({
      key: "ccts_sector",
      reason: "Applies because: you operate in a CCTS-notified sector.",
    });
  }

  return { applies: matches.length > 0, matches };
}

export const SAMPLE_OBLIGATIONS: Array<{
  code: string;
  title: string;
  rules: ApplicabilityRules;
}> = [
  { code: "GST_GSTR3B", title: "GSTR-3B", rules: {} },
  { code: "AOC4", title: "AOC-4", rules: {} },
  { code: "POSH_ANNUAL", title: "POSH annual", rules: { min_employee_band: "51_250" } },
  { code: "FACTORIES_ANNUAL", title: "Factories Act", rules: { sector_in: ["manufacturing", "epc", "infrastructure", "mining", "oil_gas"] } },
  { code: "EPR_PLASTIC", title: "Plastic EPR", rules: { waste_stream_in: ["plastic"] } },
  { code: "HW_ANNUAL", title: "Hazardous waste", rules: { waste_stream_in: ["hazardous"] } },
  { code: "BRSR_ANNUAL", title: "BRSR", rules: { is_listed: true, min_market_cap_rank: 1000 } },
  { code: "CSR2", title: "CSR-2", rules: { min_net_worth_band: "500cr_plus" } },
  { code: "CBAM_EMBEDDED", title: "CBAM", rules: { exports_to_eu: true } },
  { code: "CCTS_GHG", title: "CCTS", rules: { ccts_sector: true } },
];

export function matchingObligationCodes(
  profile: OrgComplianceProfileInput,
  obligations = SAMPLE_OBLIGATIONS,
) {
  return obligations
    .filter((row) => evaluateObligationRules(row.rules, profile).applies)
    .map((row) => row.code);
}

export type Frequency = "one_time" | "monthly" | "quarterly" | "annual" | "event_based";

export function generateTaskWindows(frequency: Frequency, from = new Date()) {
  const windows: Array<{ period_label: string; due_date: string }> = [];
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();

  const lastDay = (year: number, monthIndex: number) =>
    new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10);

  if (frequency === "monthly") {
    for (let i = 0; i < 3; i++) {
      const d = new Date(Date.UTC(y, m + i, 1));
      const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      windows.push({ period_label: label, due_date: lastDay(d.getUTCFullYear(), d.getUTCMonth()) });
    }
  } else if (frequency === "quarterly") {
    const q = Math.floor(m / 3);
    for (let i = 0; i < 2; i++) {
      const idx = q + i;
      const year = y + Math.floor(idx / 4);
      const qi = idx % 4;
      const endMonth = qi * 3 + 2;
      windows.push({
        period_label: `Q${qi + 1}-${year}`,
        due_date: lastDay(year, endMonth),
      });
    }
  } else if (frequency === "annual") {
    const fyEndYear = m >= 3 ? y + 1 : y;
    for (let i = 0; i < 2; i++) {
      const end = fyEndYear + i;
      windows.push({
        period_label: `FY${end - 1}-${String(end).slice(-2)}`,
        due_date: `${end}-03-31`,
      });
    }
  } else if (frequency === "one_time") {
    const due = new Date(from);
    due.setUTCDate(due.getUTCDate() + 90);
    windows.push({
      period_label: "one-time",
      due_date: due.toISOString().slice(0, 10),
    });
  }

  return windows;
}

export function dueTone(dueDate: string, today = new Date().toISOString().slice(0, 10)) {
  const days = Math.floor((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000);
  if (days < 0 || days < 7) return "red" as const;
  if (days <= 30) return "amber" as const;
  return "green" as const;
}
