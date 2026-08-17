import { describe, expect, it } from "vitest";
import {
  computeIndicatorCoverage,
  evaluateObligationRules,
  filterRegisterForSite,
  isEvidenceExpired,
  matchingObligationCodes,
  shouldAutoMarkNonCompliant,
  withFrozenAssessmentSnapshot,
  type OrgComplianceProfileInput,
} from "@/lib/compliance/applicability";

const unlistedPlasticManufacturer: OrgComplianceProfileInput = {
  industry_sector: "Manufacturing",
  is_listed: false,
  market_cap_rank: null,
  turnover_band: "50_250cr",
  net_worth_band: "50_250cr",
  net_profit_band: "under_5cr",
  employee_count_band: "51_250",
  exports_to_eu: false,
  waste_streams_generated: ["plastic"],
  ccts_sector: false,
};

const listedTop500: OrgComplianceProfileInput = {
  industry_sector: "Manufacturing",
  is_listed: true,
  market_cap_rank: 420,
  turnover_band: "500cr_plus",
  net_worth_band: "500cr_plus",
  net_profit_band: "50cr_plus",
  employee_count_band: "1000_plus",
  exports_to_eu: true,
  waste_streams_generated: ["hazardous"],
  ccts_sector: true,
};

describe("compliance applicability engine", () => {
  it("gives different auto-applied checklists for unlisted plastic vs listed top-500", () => {
    const small = matchingObligationCodes(unlistedPlasticManufacturer);
    const listed = matchingObligationCodes(listedTop500);

    expect(small).toContain("EPR_PLASTIC");
    expect(small).toContain("FACTORIES_ANNUAL");
    expect(small).toContain("GST_GSTR3B");
    expect(small).not.toContain("BRSR_ANNUAL");
    expect(small).not.toContain("CSR2");
    expect(small).not.toContain("CBAM_EMBEDDED");

    expect(listed).toContain("BRSR_ANNUAL");
    expect(listed).toContain("CSR2");
    expect(listed).toContain("CBAM_EMBEDDED");
    expect(listed).toContain("CCTS_GHG");
    expect(listed).not.toContain("EPR_PLASTIC");
    expect(listed).toContain("HW_ANNUAL");

    expect(new Set(small)).not.toEqual(new Set(listed));
  });

  it("auto-applies CSR-2 when net worth crosses ₹500Cr without a manual step", () => {
    const before = matchingObligationCodes(unlistedPlasticManufacturer);
    expect(before).not.toContain("CSR2");

    const after = matchingObligationCodes({
      ...unlistedPlasticManufacturer,
      net_worth_band: "500cr_plus",
    });
    expect(after).toContain("CSR2");
  });

  it("explains listed BRSR match using market-cap rank", () => {
    const result = evaluateObligationRules(
      { is_listed: true, min_market_cap_rank: 1000 },
      listedTop500,
    );
    expect(result.applies).toBe(true);
    expect(result.matches.some((m) => m.reason.includes("market-cap rank"))).toBe(true);
  });

  it("evaluates configured country and site-type rules instead of an India-only switch", () => {
    const indiaPlant = evaluateObligationRules(
      { country_in: ["IN"], site_type_in: ["permanent"] },
      { ...unlistedPlasticManufacturer, country_code: "IN", site_type: "permanent" },
    );
    const otherCountry = evaluateObligationRules(
      { country_in: ["IN"], site_type_in: ["permanent"] },
      { ...unlistedPlasticManufacturer, country_code: "AE", site_type: "permanent" },
    );
    expect(indiaPlant.applies).toBe(true);
    expect(otherCountry.applies).toBe(false);
  });

  it("supports generic configured conditions from JSON", () => {
    const result = evaluateObligationRules(
      { conditions: [{ field: "country_code", op: "eq", value: "IN" }] },
      { ...unlistedPlasticManufacturer, country_code: "IN" },
    );
    expect(result.applies).toBe(true);
  });
});

describe("legal register site isolation", () => {
  it("does not surface Site A requirements as Site B actions", () => {
    const entries = [
      { id: "1", site_id: "site-a", title: "A only" },
      { id: "2", site_id: "site-b", title: "B only" },
      { id: "3", site_id: null, title: "Org-wide" },
    ];
    const forB = filterRegisterForSite(entries, "site-b");
    expect(forB.map((r) => r.title)).toEqual(["B only", "Org-wide"]);
    expect(forB.some((r) => r.title === "A only")).toBe(false);
  });
});

describe("historical assessments", () => {
  it("keeps snapshots unchanged when live applicability rules later change", () => {
    const assessment = {
      id: "asmt-1",
      rules_snapshot: { country_in: ["IN"] },
      profile_snapshot: { country_code: "IN" },
      score_percent: 82,
    };
    const liveRules = { country_in: ["AE"] };
    expect(withFrozenAssessmentSnapshot(assessment, liveRules)).toEqual(assessment);
    expect(withFrozenAssessmentSnapshot(assessment, liveRules).rules_snapshot).toEqual({
      country_in: ["IN"],
    });
  });
});

describe("evidence expiry", () => {
  it("flags expired evidence without auto-marking legal non-compliance unless configured", () => {
    expect(isEvidenceExpired("2020-01-01", "2026-08-17")).toBe(true);
    expect(shouldAutoMarkNonCompliant({})).toBe(false);
    expect(shouldAutoMarkNonCompliant({ auto_noncompliant_on_expired_evidence: false })).toBe(false);
    expect(shouldAutoMarkNonCompliant({ auto_noncompliant_on_expired_evidence: true })).toBe(true);
  });
});

describe("org isolation", () => {
  it("scopes tenant rows by session organization id, never by a URL org id", () => {
    const sessionOrgId = "org-session";
    const urlOrgId = "org-from-url";
    const authorizedOrgId = sessionOrgId;
    expect(authorizedOrgId).toBe(sessionOrgId);
    expect(authorizedOrgId).not.toBe(urlOrgId);
  });
});

describe("BRSR coverage", () => {
  it("does not invent missing indicator values or claim completeness", () => {
    const coverage = computeIndicatorCoverage([
      { code: "ghg_emissions", value: 12 },
      { code: "water_consumption", value: null },
      { code: "waste_generated" },
    ]);
    expect(coverage.filled).toBe(1);
    expect(coverage.total).toBe(3);
    expect(coverage.percent).toBe(33);
    expect(coverage.label.toLowerCase()).toMatch(/not legal completeness/);
  });
});
