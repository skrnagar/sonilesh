import { describe, expect, it } from "vitest";
import {
  getAvailableUaucActions,
  resolveUaucWorkflowStep,
  workflowCanTransition,
} from "@/lib/services/workflow";

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

describe("UA/UC workflow profile", () => {
  it("resolves the full 8-step pipeline", () => {
    expect(resolveUaucWorkflowStep({ status: "draft" })).toBe("create");
    expect(resolveUaucWorkflowStep({ status: "submitted" })).toBe("submitted");
    expect(resolveUaucWorkflowStep({ status: "triage" })).toBe("ehs_triage");
    expect(
      resolveUaucWorkflowStep({
        status: "triage",
        uaucStage: "allocated",
        assignedTo: "user-1",
      }),
    ).toBe("assigned");
    expect(
      resolveUaucWorkflowStep({ status: "capa", uaucStage: "action_in_progress" }),
    ).toBe("action_in_progress");
    expect(
      resolveUaucWorkflowStep({ status: "approval", uaucStage: "assignee_closed" }),
    ).toBe("action_completed");
    expect(resolveUaucWorkflowStep({ status: "verification" })).toBe("verification");
    expect(resolveUaucWorkflowStep({ status: "closed" })).toBe("closed");
  });

  it("exposes role-gated actions per step", () => {
    const officerPerms = ["hazards.allocate", "hazards.final_close"];
    expect(
      getAvailableUaucActions({ status: "submitted" }, officerPerms),
    ).toEqual(["allocate"]);

    const assigneePerms = ["hazards.close_assigned"];
    expect(
      getAvailableUaucActions(
        { status: "triage", uaucStage: "allocated", assignedTo: "u1" },
        assigneePerms,
      ),
    ).toEqual(["start_action"]);
    expect(
      getAvailableUaucActions(
        { status: "capa", uaucStage: "action_in_progress" },
        assigneePerms,
      ),
    ).toEqual(["assignee_close"]);
    expect(
      getAvailableUaucActions(
        { status: "approval", uaucStage: "assignee_closed" },
        officerPerms,
      ),
    ).toEqual(["final_close"]);
  });
});
