import { describe, expect, it } from "vitest";
import {
  ONBOARDING_STEPS,
  OPTIONAL_ONBOARDING_STEPS,
} from "@/lib/constants/organization";
import {
  isOptionalStep,
  onboardingPathForStep,
  resumeOnboardingPath,
} from "@/lib/services/onboarding-progress";

const ORG_ID = "org-123";

describe("isOptionalStep", () => {
  it("marks configured optional steps as optional", () => {
    for (const step of OPTIONAL_ONBOARDING_STEPS) {
      expect(isOptionalStep(step)).toBe(true);
    }
  });

  it("marks required steps as not optional", () => {
    const required = ONBOARDING_STEPS.filter(
      (step) => !OPTIONAL_ONBOARDING_STEPS.includes(step),
    );
    for (const step of required) {
      expect(isOptionalStep(step)).toBe(false);
    }
  });
});

describe("onboardingPathForStep", () => {
  it("routes welcome and company to the onboarding entry path", () => {
    expect(onboardingPathForStep("welcome", ORG_ID)).toBe(
      `/onboarding?org=${ORG_ID}`,
    );
    expect(onboardingPathForStep("company", ORG_ID)).toBe(
      `/onboarding?org=${ORG_ID}`,
    );
  });

  it("routes finish to the finish page", () => {
    expect(onboardingPathForStep("finish", ORG_ID)).toBe(
      `/onboarding/finish?org=${ORG_ID}`,
    );
  });

  it("routes intermediate steps to step-specific paths", () => {
    expect(onboardingPathForStep("site", ORG_ID)).toBe(
      `/onboarding/site?org=${ORG_ID}`,
    );
    expect(onboardingPathForStep("ehs_config", ORG_ID)).toBe(
      `/onboarding/ehs_config?org=${ORG_ID}`,
    );
  });
});

describe("resumeOnboardingPath", () => {
  it("uses current_step from progress when present", () => {
    expect(
      resumeOnboardingPath({ current_step: "project", completed_steps: ["welcome"] }, ORG_ID),
    ).toBe(`/onboarding/project?org=${ORG_ID}`);
  });

  it("defaults to welcome when progress is null", () => {
    expect(resumeOnboardingPath(null, ORG_ID)).toBe(`/onboarding?org=${ORG_ID}`);
  });

  it("defaults to welcome when current_step is missing", () => {
    expect(resumeOnboardingPath({ completed_steps: ["welcome"] }, ORG_ID)).toBe(
      `/onboarding?org=${ORG_ID}`,
    );
  });
});
