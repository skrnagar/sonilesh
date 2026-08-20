import { describe, expect, it } from "vitest";
import { fieldPermitsOrFilter, isFieldPermitParty } from "@/lib/field/permits";

describe("field permit scoping", () => {
  it("does not OR in every active/suspended permit", () => {
    const filter = fieldPermitsOrFilter("11111111-1111-1111-1111-111111111111", false);
    expect(filter).not.toContain("status.eq.active");
    expect(filter).not.toContain("status.eq.suspended");
    expect(filter).toContain("requester_id.eq.11111111-1111-1111-1111-111111111111");
  });

  it("lets approvers see pending authorization queue items", () => {
    const filter = fieldPermitsOrFilter("11111111-1111-1111-1111-111111111111", true);
    expect(filter).toContain("status.eq.approval_required");
    expect(filter).toContain("status.eq.authorization");
    expect(filter).not.toContain("status.eq.active");
  });

  it("includes listed worker permit ids without accepting non-uuids", () => {
    const filter = fieldPermitsOrFilter("11111111-1111-1111-1111-111111111111", false, [
      "22222222-2222-2222-2222-222222222222",
      "not-a-uuid",
    ]);
    expect(filter).toContain("id.in.(22222222-2222-2222-2222-222222222222)");
    expect(filter).not.toContain("not-a-uuid");
  });

  it("recognizes requester/issuer/work leader as parties", () => {
    expect(
      isFieldPermitParty(
        { requester_id: "u1", issuer_id: "u2", work_leader_id: "u3" },
        "u2",
      ),
    ).toBe(true);
    expect(
      isFieldPermitParty(
        { requester_id: "u1", issuer_id: "u2", work_leader_id: "u3" },
        "u9",
      ),
    ).toBe(false);
  });
});
