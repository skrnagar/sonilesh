import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/services/audit";
import { checkLimit } from "@/lib/services/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SCHEMA_SETUP_MESSAGE,
  isSchemaMissingError,
} from "@/lib/supabase/errors";

const INDUSTRIES = [
  "EPC",
  "Construction",
  "Infrastructure",
  "Transmission & Distribution",
  "Power",
  "Renewable Energy",
  "Solar",
  "Manufacturing",
  "Oil & Gas",
  "Industrial",
  "Mining",
  "Logistics",
  "Facilities",
  "General Enterprise EHS",
] as const;

export { INDUSTRIES };

export async function getMemberships(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      organization_id,
      status,
      is_owner,
      organizations:organization_id (
        id, name, slug, industry, status, onboarding_completed_at, trial_ends_at
      )
    `,
    )
    .eq("user_id", userId)
    .neq("status", "removed")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Create org + owner membership.
 * Prefer security-definer RPC; fall back to direct inserts (user JWT then service role)
 * when migration 08 has not been applied yet.
 */
export async function createOrganizationWithOwner(
  supabase: SupabaseClient,
  input: {
    userId: string;
    name: string;
    industry: string;
    companyType?: string;
    country?: string;
  },
) {
  const baseSlug = slugify(input.name) || `org-${Date.now()}`;
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: org, error } = await supabase.rpc("bootstrap_organization", {
    p_name: input.name,
    p_slug: slug,
    p_industry: input.industry,
    p_company_type: input.companyType ?? null,
    p_country: input.country ?? null,
  });

  if (!error && org) return org;

  if (error && !isSchemaMissingError(error)) {
    throw new Error(error.message);
  }

  try {
    // Fallback path when bootstrap_organization RPC is not migrated yet
    // (still requires base tables from migrations 01–07)
    return await bootstrapOrganizationFallback(supabase, {
      ...input,
      slug,
    });
  } catch (fallbackErr) {
    if (isSchemaMissingError(fallbackErr)) {
      throw new Error(SCHEMA_SETUP_MESSAGE);
    }
    throw fallbackErr instanceof Error
      ? fallbackErr
      : new Error(String(fallbackErr));
  }
}

async function bootstrapOrganizationFallback(
  userClient: SupabaseClient,
  input: {
    userId: string;
    name: string;
    slug: string;
    industry: string;
    companyType?: string;
    country?: string;
  },
) {
  // Prefer service role (bypasses RLS chicken-and-egg); fall back to user JWT.
  let admin: SupabaseClient | null = null;
  try {
    admin = createAdminClient();
  } catch {
    admin = null;
  }

  const clients: SupabaseClient[] = admin ? [admin, userClient] : [userClient];
  let lastError: Error | null = null;

  for (const client of clients) {
    try {
      return await insertOrganizationBundle(client, input);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Retry with next client if this looks like auth/permission/schema noise
      continue;
    }
  }

  throw new Error(
    lastError?.message ||
      "Could not create organization. Apply supabase migrations (especially 20260326000008_onboarding_bootstrap.sql) and ensure SUPABASE_SERVICE_ROLE_KEY is valid.",
  );
}

async function insertOrganizationBundle(
  client: SupabaseClient,
  input: {
    userId: string;
    name: string;
    slug: string;
    industry: string;
    companyType?: string;
    country?: string;
  },
) {
  // Ensure profile row exists (trigger may be missing on remote)
  const { data: profile } = await client
    .from("profiles")
    .select("id")
    .eq("id", input.userId)
    .maybeSingle();

  if (!profile) {
    const { data: authUser } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
    const email = authUser?.user?.email ?? `${input.userId}@users.local`;
    const { error: profileErr } = await client.from("profiles").upsert({
      id: input.userId,
      email,
      full_name: authUser?.user?.user_metadata?.full_name ?? null,
    });
    if (profileErr) {
      // Admin auth.admin path for email if available
      try {
        const admin = createAdminClient();
        const { data: listed } = await admin.auth.admin.getUserById(input.userId);
        const { error: upErr } = await admin.from("profiles").upsert({
          id: input.userId,
          email: listed.user?.email ?? email,
          full_name: listed.user?.user_metadata?.full_name ?? null,
        });
        if (upErr) throw new Error(upErr.message);
      } catch {
        throw new Error(profileErr.message);
      }
    }
  }

  const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: org, error: orgErr } = await client
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      industry: input.industry,
      company_type: input.companyType ?? null,
      country: input.country ?? null,
      status: "trial",
      trial_ends_at: trialEnds,
      created_by: input.userId,
      updated_by: input.userId,
      last_activity_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (orgErr) throw new Error(orgErr.message);

  const { error: settingsErr } = await client.from("organization_settings").insert({
    organization_id: org.id,
  });
  if (settingsErr && !settingsErr.message.includes("duplicate")) {
    throw new Error(settingsErr.message);
  }

  const { data: member, error: memberErr } = await client
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: input.userId,
      status: "active",
      is_owner: true,
      joined_at: new Date().toISOString(),
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (memberErr) throw new Error(memberErr.message);

  const { data: role } = await client
    .from("roles")
    .select("id")
    .eq("code", "tenant_admin")
    .is("organization_id", null)
    .maybeSingle();

  if (role?.id) {
    await client.from("member_roles").insert({
      member_id: member.id,
      role_id: role.id,
      scope: "organization",
    });
  }

  const { data: plan } = await client
    .from("plans")
    .select("id")
    .eq("code", "free_trial")
    .maybeSingle();

  if (plan?.id) {
    await client.from("subscriptions").insert({
      organization_id: org.id,
      plan_id: plan.id,
      status: "trialing",
      billing_interval: "monthly",
      trial_ends_at: trialEnds,
      current_period_start: new Date().toISOString(),
      current_period_end: trialEnds,
      created_by: input.userId,
    });
    await client.from("billing_accounts").insert({
      organization_id: org.id,
      company_name: org.name,
    });
  }

  try {
    await writeAuditLog(client, {
      organizationId: org.id,
      actorUserId: input.userId,
      action: "organization.created",
      entityType: "organization",
      entityId: org.id,
      newValues: { name: org.name, industry: org.industry, status: org.status, via: "fallback" },
    });
  } catch {
    // Audit is best-effort during bootstrap
  }

  return org;
}

export async function createSite(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    code: string;
  },
) {
  const limit = await checkLimit(supabase, input.organizationId, "max_sites", 1);
  if (!limit.allowed) {
    throw new Error("Site limit reached for current subscription");
  }

  const { data, error } = await supabase
    .from("sites")
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      code: input.code.toUpperCase(),
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "site.created",
    entityType: "site",
    entityId: data.id,
    newValues: data,
  });

  return data;
}

export async function completeOnboarding(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("organizations")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      status: "trial",
      updated_by: userId,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId,
    actorUserId: userId,
    action: "organization.onboarding_completed",
    entityType: "organization",
    entityId: organizationId,
  });

  return data;
}
