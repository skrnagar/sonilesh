import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ONBOARDING_STEPS,
  OPTIONAL_ONBOARDING_STEPS,
  type OnboardingStep,
} from "@/lib/constants/organization";

export async function getOnboardingProgress(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("organization_onboarding_progress")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function ensureOnboardingProgress(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const existing = await getOnboardingProgress(supabase, organizationId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from("organization_onboarding_progress")
    .insert({
      organization_id: organizationId,
      current_step: "welcome",
      completed_steps: [],
      skipped_steps: [],
      step_data: {},
      updated_by: userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function advanceOnboardingStep(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    step: OnboardingStep;
    skip?: boolean;
    stepData?: Record<string, unknown>;
    nextStep?: OnboardingStep;
  },
) {
  const progress = await ensureOnboardingProgress(
    supabase,
    input.organizationId,
    input.userId,
  );
  const completed = new Set<string>(progress.completed_steps ?? []);
  const skipped = new Set<string>(progress.skipped_steps ?? []);
  if (input.skip) {
    skipped.add(input.step);
  } else {
    completed.add(input.step);
    skipped.delete(input.step);
  }

  const idx = ONBOARDING_STEPS.indexOf(input.step);
  const next =
    input.nextStep ??
    (idx >= 0 && idx < ONBOARDING_STEPS.length - 1
      ? ONBOARDING_STEPS[idx + 1]
      : "finish");

  const stepData = {
    ...(progress.step_data as Record<string, unknown>),
    ...(input.stepData ?? {}),
  };

  const { data, error } = await supabase
    .from("organization_onboarding_progress")
    .update({
      current_step: next,
      completed_steps: Array.from(completed),
      skipped_steps: Array.from(skipped),
      step_data: stepData,
      updated_by: input.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export function onboardingPathForStep(step: string, organizationId: string) {
  const base = `/onboarding/${step}?org=${organizationId}`;
  if (step === "welcome" || step === "company") return `/onboarding?org=${organizationId}`;
  if (step === "finish") return `/onboarding/finish?org=${organizationId}`;
  return base;
}

export function resumeOnboardingPath(progress: {
  current_step?: string | null;
  completed_steps?: string[] | null;
} | null, organizationId: string) {
  const step = (progress?.current_step as OnboardingStep | undefined) ?? "welcome";
  return onboardingPathForStep(step, organizationId);
}

export function isOptionalStep(step: OnboardingStep) {
  return OPTIONAL_ONBOARDING_STEPS.includes(step);
}

export async function getOrganizationSetupCompletion(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const [
    { data: org },
    { count: siteCount },
    { count: projectCount },
    { count: memberCount },
    { count: deptCount },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, industry, onboarding_completed_at, logo_url")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("departments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("organization_settings")
      .select("branding, hierarchy_config, risk_matrix")
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  const branding = (settings?.branding ?? {}) as { primaryColor?: string; logoUrl?: string };
  const hasEhsConfig = Boolean(
    settings?.risk_matrix && Object.keys(settings.risk_matrix as object).length,
  );

  const items = [
    {
      key: "profile",
      label: "Organization profile",
      complete: Boolean(org?.name && org?.industry),
      percent: org?.name && org?.industry ? 100 : 40,
      href: "/app/settings/organization",
    },
    {
      key: "site",
      label: "First site",
      complete: (siteCount ?? 0) > 0,
      percent: (siteCount ?? 0) > 0 ? 100 : 0,
      href: "/app/settings/sites",
    },
    {
      key: "project",
      label: "First project",
      complete: (projectCount ?? 0) > 0,
      percent: (projectCount ?? 0) > 0 ? 100 : 0,
      href: "/app/settings/projects",
    },
    {
      key: "users",
      label: "Admin users",
      complete: (memberCount ?? 0) >= 1,
      percent: Math.min(100, ((memberCount ?? 0) / 2) * 100),
      href: "/app/settings/users",
    },
    {
      key: "departments",
      label: "Departments",
      complete: (deptCount ?? 0) >= 3,
      percent: Math.min(100, Math.round(((deptCount ?? 0) / 5) * 100)),
      href: "/app/settings/departments",
    },
    {
      key: "ehs",
      label: "EHS configuration",
      complete: hasEhsConfig,
      percent: hasEhsConfig ? 100 : branding.primaryColor || branding.logoUrl || org?.logo_url ? 40 : 20,
      href: "/app/settings/organization",
    },
  ];

  const overall = Math.round(
    items.reduce((sum, item) => sum + item.percent, 0) / items.length,
  );

  return { items, overall, organization: org };
}
