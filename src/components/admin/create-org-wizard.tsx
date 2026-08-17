"use client";

import { useMemo, useState } from "react";
import { adminCreateOrganizationAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/constants/industries";

type PlanOption = {
  id: string;
  name: string;
  code: string;
  plan_type?: string | null;
  price_monthly_cents: number;
  is_custom?: boolean;
};

type FeatureOption = { id: string; code: string; name: string };

const STEPS = [
  "Company",
  "Industry",
  "Settings",
  "Plan",
  "Subscription",
  "Admin",
  "Review",
] as const;

export function CreateOrgWizard({
  plans,
  features,
}: {
  plans: PlanOption[];
  features: FeatureOption[];
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    name: "",
    legalName: "",
    industry: "",
    companySize: "",
    country: "IN",
    timezone: "Asia/Kolkata",
    planId: plans[0]?.id ?? "",
    billingCycle: "monthly",
    trialDays: "14",
    customMonthlyCents: "",
    discountCents: "",
    extraUserLimit: "",
    extraSiteLimit: "",
    notes: "",
    adminEmail: "",
    extraFeatureIds: [] as string[],
  });

  const selectedPlan = plans.find((plan) => plan.id === values.planId);
  const isCustom =
    selectedPlan?.is_custom ||
    selectedPlan?.plan_type === "custom" ||
    values.billingCycle === "custom";

  const canNext = useMemo(() => {
    if (step === 0) return values.name.trim().length > 1;
    if (step === 3) return Boolean(values.planId);
    return true;
  }, [step, values.name, values.planId]);

  function patch(partial: Partial<typeof values>) {
    setValues((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-md px-2 py-1 ${
              index === step ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name">Company name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => patch({ name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="legalName">Legal name</Label>
            <Input
              id="legalName"
              value={values.legalName}
              onChange={(e) => patch({ legalName: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Industry</Label>
            <Select value={values.industry} onChange={(e) => patch({ industry: e.target.value })}>
              <option value="">Select</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Company size</Label>
            <Select
              value={values.companySize}
              onChange={(e) => patch({ companySize: e.target.value })}
            >
              <option value="">Select</option>
              {["1-50", "51-250", "251-1000", "1000+"].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Country</Label>
            <Input value={values.country} onChange={(e) => patch({ country: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Timezone</Label>
            <Input value={values.timezone} onChange={(e) => patch({ timezone: e.target.value })} />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <Label>Plan</Label>
          <Select value={values.planId} onChange={(e) => patch({ planId: e.target.value })}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.plan_type ?? plan.code}) · $
                {(plan.price_monthly_cents / 100).toFixed(0)}/mo
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Plan names are catalog data. Entitlements are resolved from plan features and overrides.
          </p>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Billing cycle</Label>
            <Select
              value={values.billingCycle}
              onChange={(e) => patch({ billingCycle: e.target.value })}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Trial days</Label>
            <Input
              type="number"
              value={values.trialDays}
              onChange={(e) => patch({ trialDays: e.target.value })}
            />
          </div>
          {isCustom ? (
            <>
              <div className="space-y-1">
                <Label>Custom monthly price (cents)</Label>
                <Input
                  type="number"
                  value={values.customMonthlyCents}
                  onChange={(e) => patch({ customMonthlyCents: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Discount (cents)</Label>
                <Input
                  type="number"
                  value={values.discountCents}
                  onChange={(e) => patch({ discountCents: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Additional users (additive)</Label>
                <Input
                  type="number"
                  value={values.extraUserLimit}
                  onChange={(e) => patch({ extraUserLimit: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Additional sites (additive)</Label>
                <Input
                  type="number"
                  value={values.extraSiteLimit}
                  onChange={(e) => patch({ extraSiteLimit: e.target.value })}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Add-on features</Label>
                <div className="grid max-h-40 gap-1 overflow-auto border border-border p-2 text-xs">
                  {features.map((feature) => (
                    <label key={feature.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={values.extraFeatureIds.includes(feature.id)}
                        onChange={(e) => {
                          patch({
                            extraFeatureIds: e.target.checked
                              ? [...values.extraFeatureIds, feature.id]
                              : values.extraFeatureIds.filter((id) => id !== feature.id),
                          });
                        }}
                      />
                      {feature.name} ({feature.code})
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Contract notes</Label>
                <Input value={values.notes} onChange={(e) => patch({ notes: e.target.value })} />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-1">
          <Label>Customer admin email</Label>
          <Input
            type="email"
            value={values.adminEmail}
            onChange={(e) => patch({ adminEmail: e.target.value })}
            placeholder="Must already exist as a profile to attach as owner"
          />
        </div>
      ) : null}

      {step === 6 ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p>
            <strong>{values.name}</strong> · {values.industry || "Industry unset"}
          </p>
          <p className="mt-1">
            Plan {selectedPlan?.name} · {values.billingCycle} · trial {values.trialDays || 0} days
          </p>
          <p className="mt-1 text-muted-foreground">{values.adminEmail || "No owner email"}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <form action={adminCreateOrganizationAction}>
            {Object.entries(values).map(([key, value]) => {
              if (key === "extraFeatureIds") {
                return (value as string[]).map((id) => (
                  <input key={id} type="hidden" name="extraFeatureIds" value={id} />
                ));
              }
              return <input key={key} type="hidden" name={key} value={String(value)} />;
            })}
            <Button type="submit">Create organization</Button>
          </form>
        )}
      </div>
    </div>
  );
}
