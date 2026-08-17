import { describe, expect, it } from "vitest";
import {
  evaluateObligationRules,
  matchingObligationCodes,
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
});
