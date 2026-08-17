import { describe, expect, it } from "vitest";
import { workflowCanTransition } from "@/lib/services/workflow";

describe("workflowCanTransition", () => {
  it("allows draft to submitted", () => {
    expect(workflowCanTransition("draft", "submitted")).toBe(true);
  });

  it("blocks closed to triage", () => {
    expect(workflowCanTransition("closed", "triage")).toBe(false);
  });

  it("allows closed to reopened", () => {
    expect(workflowCanTransition("closed", "reopened")).toBe(true);
  });

  it("allows approval to closed", () => {
    expect(workflowCanTransition("approval", "closed")).toBe(true);
  });

  it("blocks cancelled to any state", () => {
    expect(workflowCanTransition("cancelled", "submitted")).toBe(false);
    expect(workflowCanTransition("cancelled", "draft")).toBe(false);
  });

  it("allows triage to investigation or capa", () => {
    expect(workflowCanTransition("triage", "investigation")).toBe(true);
    expect(workflowCanTransition("triage", "capa")).toBe(true);
  });
});
