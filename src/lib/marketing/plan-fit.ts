/**
 * Maps 2–3 packaging questions onto existing Team / Business / Enterprise copy.
 * Does not invent entitlements — mirrors pricingTiers + comparison table.
 */
export type PlanName = "Team" | "Business" | "Enterprise";

export type PlanFitAnswers = {
  sites: "one" | "several" | "portfolio";
  esgCompliance: boolean;
  privateInstance: boolean;
};

export function recommendPlan(answers: PlanFitAnswers): PlanName {
  if (answers.privateInstance || answers.sites === "portfolio") return "Enterprise";
  if (answers.sites === "several" || answers.esgCompliance) return "Business";
  return "Team";
}
