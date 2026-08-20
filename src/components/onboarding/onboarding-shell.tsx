import Link from "next/link";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/constants/organization";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: "Welcome",
  company: "Company",
  industry: "Industry",
  structure: "Structure",
  business_unit: "Business unit",
  site: "Site",
  project: "Project",
  invite: "Invite",
  ehs_config: "EHS config",
  review: "Review",
  finish: "Finish",
};

export function OnboardingShell({
  step,
  title,
  description,
  organizationId,
  currentStep,
  children,
}: {
  step: string;
  title: string;
  description: string;
  organizationId?: string;
  currentStep?: OnboardingStep;
  children: React.ReactNode;
}) {
  const idx = currentStep ? ONBOARDING_STEPS.indexOf(currentStep) : -1;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/80 via-background to-background text-foreground">
      <header className="border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex">
            <BrandLockup size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Setup
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10 md:py-14">
        {currentStep ? (
          <ol className="mb-8 flex flex-wrap gap-1.5">
            {ONBOARDING_STEPS.map((s, i) => (
              <li
                key={s}
                className={
                  i <= idx
                    ? "rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground"
                    : "rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                }
                title={STEP_LABELS[s]}
              >
                {i + 1}. {STEP_LABELS[s]}
              </li>
            ))}
          </ol>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mkt-safety)]">
          {step}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {organizationId ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Progress is saved for this organization. You can leave and resume later.
          </p>
        ) : null}
        <div className="mt-8 rounded-[var(--radius-lg)] border border-border/90 bg-card p-6 shadow-[var(--shadow-md)] md:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
