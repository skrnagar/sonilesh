"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import {
  completeOnboarding,
  createOrganizationWithOwner,
  createSite,
} from "@/lib/services/organization";
import { writeAuditLog } from "@/lib/services/audit";
import {
  formatSupabaseUserError,
  isNextRedirect,
  isSchemaMissingError,
  setupRedirectPath,
} from "@/lib/supabase/errors";

const orgSchema = z.object({
  name: z.string().min(2),
  industry: z.string().min(2),
  companyType: z.string().optional(),
  country: z.string().optional(),
});

export async function createOrganizationAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    companyType: formData.get("companyType") || undefined,
    country: formData.get("country") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `/onboarding?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid organization")}`,
    );
  }

  try {
    const org = await createOrganizationWithOwner(supabase, {
      userId: user.id,
      ...parsed.data,
    });
    redirect(`/onboarding/site?org=${org.id}`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    if (isSchemaMissingError(err)) {
      redirect(setupRedirectPath(err));
    }
    const message = formatSupabaseUserError(err);
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }
}

export async function createFirstSiteAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const name = String(formData.get("name") || "");
  const code = String(formData.get("code") || "");
  if (!organizationId || !name || !code) {
    redirect(
      `/onboarding/site?org=${organizationId}&error=${encodeURIComponent("All fields are required")}`,
    );
  }

  try {
    await createSite(supabase, {
      organizationId,
      userId: user.id,
      name,
      code,
    });
    redirect(`/onboarding/invite?org=${organizationId}`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    if (isSchemaMissingError(err)) {
      redirect(setupRedirectPath(err));
    }
    const message = formatSupabaseUserError(err);
    redirect(`/onboarding/site?org=${organizationId}&error=${encodeURIComponent(message)}`);
  }
}

export async function inviteUsersAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const emails = String(formData.get("emails") || "")
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  for (const email of emails) {
    await writeAuditLog(supabase, {
      organizationId,
      actorUserId: user.id,
      action: "user.invited",
      entityType: "organization_member",
      newValues: { email, status: "invited" },
      metadata: { note: "Invite recorded; email delivery via Supabase Auth invite in production" },
    });
  }

  redirect(`/onboarding/plan?org=${organizationId}`);
}

export async function selectPlanAction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");
  const planId = String(formData.get("planId") || "");
  if (!organizationId || !planId) {
    redirect(
      `/onboarding/plan?org=${organizationId}&error=${encodeURIComponent("Select a plan")}`,
    );
  }

  const { data: current } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (current) {
    await supabase
      .from("subscriptions")
      .update({ plan_id: planId, updated_by: user.id })
      .eq("id", current.id);
  }

  await completeOnboarding(supabase, organizationId, user.id);
  redirect("/app/dashboard");
}
