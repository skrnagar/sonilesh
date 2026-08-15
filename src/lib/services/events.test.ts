import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/services/events";

describe("EHS event workflow transitions", () => {
  it("allows draft to submitted", () => {
    expect(canTransition("draft", "submitted")).toBe(true);
  });

  it("blocks closed to triage", () => {
    expect(canTransition("closed", "triage")).toBe(false);
  });

  it("allows closed to reopened", () => {
    expect(canTransition("closed", "reopened")).toBe(true);
  });

  it("allows approval to closed", () => {
    expect(canTransition("approval", "closed")).toBe(true);
  });
});
