/**
 * Apply all supabase/migrations/*.sql to remote Postgres.
 *
 * Usage:
 *   set SUPABASE_DB_PASSWORD=...   (or DATABASE_URL=...)
 *   node scripts/apply-migrations.mjs
 *
 * Prefers the `pg` npm driver (no psql binary required). Falls back to psql if present.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

function loadEnvLocal() {
  const p = path.join(root, ".env.local");
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

const password = process.env.SUPABASE_DB_PASSWORD || "";
const projectRef = process.env.SUPABASE_PROJECT_REF || "sqybbygfksnjvmatiafm";
const databaseUrl =
  process.env.DATABASE_URL ||
  (password
    ? `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
    : "");

if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_PASSWORD.\n" +
      "1) Supabase Dashboard → Project Settings → Database → Database password\n" +
      "2) Put it in .env.local as SUPABASE_DB_PASSWORD=...\n" +
      "3) Re-run: node scripts/apply-migrations.mjs\n" +
      "Or paste supabase/_all_migrations.sql into SQL Editor → Run.",
  );
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const combined = files
  .map((f) => `-- >>> ${f}\n${fs.readFileSync(path.join(migrationsDir, f), "utf8")}`)
  .join("\n\n");

const outFile = path.join(root, "supabase", "_combined_migrations.sql");
fs.writeFileSync(outFile, combined, "utf8");
console.log(`Wrote ${outFile} (${files.length} files, ${combined.length} chars)`);

async function applyWithPg() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
  await client.connect();
  console.log("Connected via pg; applying migrations...");
  try {
    await client.query(combined);
    console.log("Migrations applied successfully (pg).");
  } finally {
    await client.end();
  }
}

function applyWithPsql() {
  const psql = spawnSync(
    "psql",
    [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", outFile],
    { stdio: "inherit", shell: true },
  );
  if (psql.error || psql.status !== 0) {
    throw new Error(`psql failed with status ${psql.status}`);
  }
  console.log("Migrations applied successfully (psql).");
}

try {
  await applyWithPg();
} catch (pgErr) {
  console.warn("pg apply failed:", pgErr instanceof Error ? pgErr.message : pgErr);
  console.warn("Trying psql fallback...");
  try {
    applyWithPsql();
  } catch (psqlErr) {
    console.error(
      "Both pg and psql failed. Paste supabase/_all_migrations.sql into the Supabase SQL Editor.",
    );
    process.exit(1);
  }
}
