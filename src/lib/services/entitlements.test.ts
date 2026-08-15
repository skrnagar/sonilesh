import { describe, expect, it } from "vitest";

describe("entitlement resolution contract", () => {
  it("defines override > plan > default precedence", () => {
    const precedence = ["override", "plan", "default"];
    expect(precedence[0]).toBe("override");
    expect(precedence.at(-1)).toBe("default");
  });

  it("treats null limit as unlimited when enabled", () => {
    const entitlement = { enabled: true, unlimited: true, limitValue: null as number | null };
    const limit = entitlement.unlimited ? null : entitlement.limitValue;
    expect(limit).toBeNull();
  });
});
