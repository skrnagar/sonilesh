import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = "demo@ehs360.local";
const password = "Ehs360-Demo!2026";

const client = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: signIn, error: signErr } = await client.auth.signInWithPassword({
  email,
  password,
});
console.log(
  "LOGIN",
  signErr ? "FAIL " + signErr.message : "OK user=" + signIn.user.id,
);
if (signErr) process.exit(1);

const userId = signIn.user.id;
const access = signIn.session.access_token;
const refresh = signIn.session.refresh_token;

const authed = createClient(url, anon, {
  global: { headers: { Authorization: `Bearer ${access}` } },
  auth: { persistSession: false, autoRefreshToken: false },
});

const checks = {};
{
  const { data, error } = await authed
    .from("profiles")
    .select("id,email,is_platform_admin,full_name")
    .eq("id", userId)
    .maybeSingle();
  checks.profile = error ? { error: error.message } : data;
}
{
  const { data, error } = await authed
    .from("organization_members")
    .select(
      "id,organization_id,status,is_owner,organizations:organization_id(id,name,slug,status,onboarding_completed_at)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);
  checks.membership = error ? { error: error.message } : data;
}
{
  const orgId = checks.membership?.[0]?.organization_id;
  if (orgId) {
    const { data, error } = await authed
      .from("sites")
      .select("id,name,code")
      .eq("organization_id", orgId)
      .limit(3);
    checks.sites = error ? { error: error.message } : data;
    const { data: roles, error: rerr } = await authed
      .from("member_roles")
      .select("id,role_id,roles:role_id(code)")
      .eq("member_id", checks.membership[0].id)
      .is("deleted_at", null);
    checks.roles = rerr ? { error: rerr.message } : roles;
  }
}
console.log(JSON.stringify(checks, null, 2));

const projectRef = new URL(url).hostname.split(".")[0];
const cookieName = `sb-${projectRef}-auth-token`;
const cookieVal = encodeURIComponent(
  JSON.stringify({
    access_token: access,
    refresh_token: refresh,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    user: signIn.user,
  }),
);

async function probe(path) {
  const r = await fetch("http://localhost:3000" + path, {
    redirect: "manual",
    headers: { Cookie: `${cookieName}=${cookieVal}` },
  });
  const loc = r.headers.get("location") || "";
  let bodyHint = "";
  if (r.status === 200 || r.status === 500) {
    const t = await r.text();
    const plain = t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 400);
    const bad =
      plain.includes("Application error") ||
      plain.includes("Internal Server Error") ||
      plain.includes("Something went wrong") ||
      r.status === 500;
    bodyHint = (bad ? "ERROR_PAGE " : "OK_PAGE ") + plain.slice(0, 200);
  }
  console.log("PROBE", path, "status=" + r.status, "loc=" + loc, bodyHint);
}

await probe("/login");
await probe("/app/dashboard");
await probe("/onboarding");
await probe("/admin");

const { data: adminMem } = await admin
  .from("organization_members")
  .select("id,status,is_owner,organization_id")
  .eq("user_id", userId);
console.log("ADMIN_MEMBERSHIPS", adminMem);
