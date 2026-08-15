/**
 * Try Postgres connections using known env values as password candidates.
 * Prints SUCCESS/FAIL only — never prints secrets.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

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

const ref = process.env.SUPABASE_PROJECT_REF || "sqybbygfksnjvmatiafm";
const candidates = [
  ["SUPABASE_DB_PASSWORD", process.env.SUPABASE_DB_PASSWORD || ""],
  ["DATABASE_URL", process.env.DATABASE_URL || ""],
  ["SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY || ""],
  ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY || ""],
  ["empty", ""],
];

async function tryConn(label, connectionString) {
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const r = await client.query("select current_database() as db");
    console.log("SUCCESS", label, r.rows[0].db);
    await client.end();
    return true;
  } catch (e) {
    console.log("FAIL", label, String(e.message || e).slice(0, 140));
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

let any = false;
for (const [name, value] of candidates) {
  if (name === "DATABASE_URL" && value) {
    any = (await tryConn("DATABASE_URL", value)) || any;
    continue;
  }
  if (!value && name !== "empty") {
    console.log("SKIP", name, "(empty)");
    continue;
  }
  const enc = encodeURIComponent(value);
  any =
    (await tryConn(
      `${name}-pooler6543`,
      `postgresql://postgres.${ref}:${enc}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`,
    )) || any;
  any =
    (await tryConn(
      `${name}-db5432`,
      `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`,
    )) || any;
  any =
    (await tryConn(
      `${name}-pooler5432`,
      `postgresql://postgres.${ref}:${enc}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`,
    )) || any;
}

console.log(any ? "ANY_SUCCESS=yes" : "ANY_SUCCESS=no");
process.exit(any ? 0 : 1);
