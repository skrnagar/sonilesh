/**
 * Bootstrap demo@ehs360.local after schema is applied.
 * Uses SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY from env.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = "demo@ehs360.local";
const password = "Ehs360-Demo!2026";

if (!url || !key) {
  console.error("Missing Supabase URL or service/secret key");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Ensure auth user
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  let user = listed.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "EHS360 Demo" },
    });
    if (error) throw error;
    user = data.user;
    console.log("Created auth user", user.id);
  } else {
    await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    console.log("Updated auth user", user.id);
  }

  // Profile
  const { error: profileErr } = await admin.from("profiles").upsert({
    id: user.id,
    email,
    full_name: "EHS360 Demo",
    is_platform_admin: true,
  });
  if (profileErr) throw profileErr;

  // Org
  let { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("slug", "demo-ehs360")
    .maybeSingle();

  if (!org) {
    const { data, error } = await admin
      .from("organizations")
      .insert({
        name: "Demo EHS Organization",
        slug: "demo-ehs360",
        industry: "Oil & Gas",
        status: "active",
        onboarding_completed_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select("*")
      .single();
    if (error) throw error;
    org = data;
    await admin.from("organization_settings").upsert({
      organization_id: org.id,
    });
  } else {
    await admin
      .from("organizations")
      .update({
        status: "active",
        onboarding_completed_at: org.onboarding_completed_at ?? new Date().toISOString(),
      })
      .eq("id", org.id);
  }

  // Membership
  let { data: member } = await admin
    .from("organization_members")
    .select("*")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    const { data, error } = await admin
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: user.id,
        status: "active",
        is_owner: true,
        joined_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    member = data;
  }

  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("code", "tenant_admin")
    .is("organization_id", null)
    .maybeSingle();

  if (role) {
    const { data: existingRole } = await admin
      .from("member_roles")
      .select("id")
      .eq("member_id", member.id)
      .eq("role_id", role.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!existingRole) {
      await admin.from("member_roles").insert({
        member_id: member.id,
        role_id: role.id,
        scope: "organization",
      });
    }
  }

  // Trial subscription if plans exist
  const { data: plan } = await admin
    .from("plans")
    .select("id")
    .eq("code", "enterprise")
    .maybeSingle();
  if (plan) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("organization_id", org.id)
      .maybeSingle();
    if (!sub) {
      await admin.from("subscriptions").insert({
        organization_id: org.id,
        plan_id: plan.id,
        status: "active",
        billing_interval: "monthly",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
    }
  }

  // Default site
  const { data: site } = await admin
    .from("sites")
    .select("id")
    .eq("organization_id", org.id)
    .limit(1)
    .maybeSingle();
  if (!site) {
    await admin.from("sites").insert({
      organization_id: org.id,
      name: "Demo Site",
      code: "DEMO-1",
      created_by: user.id,
    });
  }

  // Default risk matrix
  const { data: matrix } = await admin
    .from("risk_matrices")
    .select("id")
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!matrix) {
    await admin.from("risk_matrices").insert({
      organization_id: org.id,
      name: "Default 5x5",
      is_default: true,
    });
  }

  console.log("Bootstrap complete");
  console.log("Login: http://localhost:3000/login");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("Dashboard: http://localhost:3000/app/dashboard");
  console.log("Field: http://localhost:3000/field");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
