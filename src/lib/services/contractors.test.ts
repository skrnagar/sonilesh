import { describe, expect, it } from "vitest";
import {
  assertNotSelfApprove,
  assertSameOrg,
  documentIsExpired,
  evaluatePrequalOutcome,
  evaluateReadiness,
  isApprovedForSite,
  toRegisterCsv,
  TRAINING_READINESS_TODO,
} from "@/lib/services/contractors";

describe("contractor site scope", () => {
  const assignments = [
    { site_id: "site-a", status: "approved" as const, valid_until: null },
    { site_id: "site-b", status: "requested" as const, valid_until: null },
  ];

  it("does not treat Site A approval as global access", () => {
    expect(isApprovedForSite(assignments, "site-a")).toBe(true);
    expect(isApprovedForSite(assignments, "site-b")).toBe(false);
    expect(isApprovedForSite(assignments, "site-c")).toBe(false);
  });

  it("ignores expired site approvals", () => {
    expect(
      isApprovedForSite(
        [{ site_id: "site-a", status: "approved", valid_until: "2000-01-01" }],
        "site-a",
        new Date("2026-08-17"),
      ),
    ).toBe(false);
  });
});

describe("cannot self-approve", () => {
  it("blocks the requester from approving their own assignment", () => {
    expect(() => assertNotSelfApprove("user-1", "user-1")).toThrow(/self-approve/i);
  });

  it("allows a different approver", () => {
    expect(() => assertNotSelfApprove("approver", "requester")).not.toThrow();
  });
});

describe("org isolation", () => {
  it("rejects a record from another organization", () => {
    expect(() => assertSameOrg("org-b", "org-a")).toThrow(/organization/i);
  });

  it("rejects a missing org id", () => {
    expect(() => assertSameOrg(null, "org-a")).toThrow(/organization/i);
  });

  it("accepts a matching org", () => {
    expect(() => assertSameOrg("org-a", "org-a")).not.toThrow();
  });
});

describe("prequalification thresholds are not hard-coded", () => {
  it("returns unconfigured when pass/conditional are not set", () => {
    expect(
      evaluatePrequalOutcome(90, { passPercent: null, conditionalPercent: null }),
    ).toBe("unconfigured");
    expect(
      evaluatePrequalOutcome(90, { passPercent: 80, conditionalPercent: null }),
    ).toBe("unconfigured");
  });

  it("uses org-configured thresholds rather than 80/60", () => {
    expect(
      evaluatePrequalOutcome(70, { passPercent: 75, conditionalPercent: 50 }),
    ).toBe("conditional");
    expect(
      evaluatePrequalOutcome(70, { passPercent: 70, conditionalPercent: 40 }),
    ).toBe("passed");
    expect(
      evaluatePrequalOutcome(59, { passPercent: 90, conditionalPercent: 80 }),
    ).toBe("failed");
  });
});

describe("readiness: expired mandatory documents", () => {
  const settings = {
    enforce_mandatory_docs: true,
    induction_required: false,
    mandatory_doc_types: ["insurance"],
  };

  it("marks not ready when a configured mandatory doc is expired", () => {
    const result = evaluateReadiness({
      companyStatus: "active",
      siteAssignments: [],
      documents: [
        {
          doc_type: "insurance",
          is_mandatory: true,
          verification_status: "verified",
          expires_on: "2020-01-01",
          status: "valid",
        },
      ],
      settings,
      inductionComplete: true,
    });
    expect(result.ready).toBe(false);
    expect(result.gaps.some((g) => g.code === "expired_doc")).toBe(true);
  });

  it("does not fail on expiry when enforcement is off", () => {
    const result = evaluateReadiness({
      companyStatus: "active",
      siteAssignments: [],
      documents: [
        {
          doc_type: "insurance",
          is_mandatory: true,
          verification_status: "verified",
          expires_on: "2020-01-01",
          status: "expired",
        },
      ],
      settings: { ...settings, enforce_mandatory_docs: false },
      inductionComplete: true,
    });
    expect(result.ready).toBe(true);
  });

  it("requires explicit site assignment when a site is in scope", () => {
    const result = evaluateReadiness({
      companyStatus: "active",
      siteId: "site-b",
      siteAssignments: [{ site_id: "site-a", status: "approved" }],
      documents: [],
      settings: { ...settings, enforce_mandatory_docs: false },
      inductionComplete: true,
    });
    expect(result.ready).toBe(false);
    expect(result.gaps.some((g) => g.code === "site_assignment")).toBe(true);
  });

  it("exposes a training TODO when Phase 9 is not consulted", () => {
    const result = evaluateReadiness({
      companyStatus: "active",
      siteAssignments: [],
      documents: [],
      settings: { ...settings, enforce_mandatory_docs: false },
      inductionComplete: true,
    });
    expect(result.trainingConsulted).toBe(false);
    expect(result.trainingTodo).toBe(TRAINING_READINESS_TODO);
  });
});

describe("document expiry helper", () => {
  it("treats past expires_on as expired", () => {
    expect(documentIsExpired({ expires_on: "2000-01-01" }, new Date("2026-01-01"))).toBe(true);
    expect(documentIsExpired({ expires_on: "2099-01-01" }, new Date("2026-01-01"))).toBe(false);
  });
});

describe("csv export", () => {
  it("escapes commas and quotes", () => {
    const csv = toRegisterCsv(
      [{ name: 'Acme, "West"', status: "active" }],
      ["name", "status"],
    );
    expect(csv).toContain('"Acme, ""West"""');
    expect(csv.startsWith("name,status")).toBe(true);
  });
});
