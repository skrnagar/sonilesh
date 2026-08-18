import { describe, expect, it } from "vitest";
import {
  evaluateObligationRules,
  SAMPLE_OBLIGATIONS,
  type OrgComplianceProfileInput,
} from "@/lib/compliance/applicability";
import { BRSR_REVEAL_COPY, brsrRevealKind } from "@/lib/marketing/brsr-reveal";

const brsr = SAMPLE_OBLIGATIONS.find((row) => row.code === "BRSR_ANNUAL")!;

const unlisted: OrgComplianceProfileInput = {
  industry_sector: "Manufacturing",
  is_listed: false,
  market_cap_rank: null,
  turnover_band: "50_250cr",
  net_worth_band: "50_250cr",
  employee_count_band: "51_250",
  exports_to_eu: false,
  waste_streams_generated: [],
  ccts_sector: false,
};

describe("BRSR reveal is presentation-only", () => {
  it("keeps listed top-1000 as applies → Likely mandatory", () => {
    const profile = { ...unlisted, is_listed: true, market_cap_rank: 420 };
    const result = evaluateObligationRules(brsr.rules, profile);
    expect(result.applies).toBe(true);
    expect(BRSR_REVEAL_COPY[brsrRevealKind(result.applies, true)]).toBe("Likely mandatory");
  });

  it("keeps listed outside top-1000 as not applies → Not yet", () => {
    const profile = { ...unlisted, is_listed: true, market_cap_rank: 1500 };
    const result = evaluateObligationRules(brsr.rules, profile);
    expect(result.applies).toBe(false);
    expect(BRSR_REVEAL_COPY[brsrRevealKind(result.applies, true)]).toBe("Not yet");
  });

  it("keeps unlisted as not applies → Voluntary", () => {
    const result = evaluateObligationRules(brsr.rules, unlisted);
    expect(result.applies).toBe(false);
    expect(BRSR_REVEAL_COPY[brsrRevealKind(result.applies, false)]).toBe("Voluntary");
  });
});
