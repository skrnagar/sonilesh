"use client";

import { useState } from "react";
import { pricingTiers } from "@/lib/marketing/content";
import { recommendPlan, type PlanFitAnswers } from "@/lib/marketing/plan-fit";
import { PlanFit } from "@/components/marketing/plan-fit";
import { PricingCard } from "@/components/marketing/pricing-card";

const DEFAULT_ANSWERS: PlanFitAnswers = {
  sites: "several",
  esgCompliance: true,
  privateInstance: false,
};

export function PricingBoard() {
  const [answers, setAnswers] = useState<PlanFitAnswers>(DEFAULT_ANSWERS);
  const fit = recommendPlan(answers);

  return (
    <div className="space-y-8">
      <PlanFit value={answers} onChange={setAnswers} />
      <div className="grid gap-4 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} {...tier} highlighted={fit === tier.name} />
        ))}
      </div>
    </div>
  );
}
