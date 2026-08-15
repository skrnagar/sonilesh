/**
 * Probe remote schema readiness using service key from .env.local
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

if (!url || !key) {
  console.error("Missing URL or service key");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = [
  "profiles",
  "organizations",
  "organization_members",
  "roles",
  "sites",
  "plans",
  "subscriptions",
  "risk_matrices",
];

for (const t of tables) {
  // Prefer real GET over HEAD — PostgREST can omit errors on some HEAD probes.
  const { data, error } = await admin.from(t).select("id").limit(1);
  console.log(
    `table:${t}`,
    error
      ? `ERR:${error.code || ""} ${error.message}`
      : `OK rows=${Array.isArray(data) ? data.length : "?"}`,
  );
}

const { error: rpcErr } = await admin.rpc("bootstrap_organization", {
  p_name: "__probe__",
  p_slug: "__probe__",
  p_industry: "Oil & Gas",
  p_company_type: null,
  p_country: null,
});
console.log(
  "rpc:bootstrap_organization",
  rpcErr ? `ERR:${rpcErr.code || ""} ${rpcErr.message}` : "OK",
);
