/**
 * Create DEMO Auth users, then seed tenant click-through data.
 *
 * INTERNAL demo/test only — these are not paying customers.
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)
 *
 * Optional:
 *   DEMO_PASSWORD  — overrides the documented demo-only password
 *
 * Apply supabase/migrations/20260326000031_demo_seed.sql first, then:
 *   node scripts/seed-demo.mjs
 *
 * Password is documented in DEVELOPMENT.md (demo-only; not a production secret).
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
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
/** Documented in DEVELOPMENT.md only as a well-known local demo password. */
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo@12345";

const DEMO_USERS = [
  {
    email: "harish@demo.sonilpower.local",
    full_name: "Harish Sharma",
    org: "SONIL POWER",
    title: "EHS Manager",
  },
  {
    email: "abhishek@demo.sonilpower.local",
    full_name: "Abhishek Patel",
    org: "SONIL POWER",
    title: "Site Supervisor",
  },
  {
    email: "sunil@demo.sonilpower.local",
    full_name: "Sunil Verma",
    org: "SONIL POWER",
    title: "Permit Issuer",
  },
  {
    email: "vikram@demo.sonilpower.local",
    full_name: "Vikram Singh",
    org: "SONIL POWER",
    title: "Field Technician",
  },
  {
    email: "priya@demo.kavachsolar.local",
    full_name: "Priya Iyer",
    org: "Kavach Solar EPC (DEMO)",
    title: "EHS Manager",
  },
  {
    email: "anjali@demo.kavachsolar.local",
    full_name: "Anjali Rao",
    org: "Kavach Solar EPC (DEMO)",
    title: "Site Supervisor",
  },
  {
    email: "rohit@demo.narmadachemlog.local",
    full_name: "Rohit Menon",
    org: "Narmada ChemLog (DEMO)",
    title: "EHS Manager",
  },
  {
    email: "meera@demo.narmadachemlog.local",
    full_name: "Meera Joshi",
    org: "Narmada ChemLog (DEMO)",
    title: "Field Technician",
  },
];

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY",
  );
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === target);
    if (hit) return hit;
    if (!data.users.length || data.users.length < 200) return null;
  }
  return null;
}

async function ensureAuthUser(entry) {
  let user = await findAuthUserByEmail(entry.email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: entry.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: entry.full_name, demo: true },
      app_metadata: { demo: true },
    });
    if (error) throw error;
    user = data.user;
    console.log("Created auth user", entry.email);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: entry.full_name, demo: true },
    });
    if (error) throw error;
    console.log("Updated auth user", entry.email);
  }

  const { error: profileErr } = await admin.from("profiles").upsert({
    id: user.id,
    email: entry.email,
    full_name: entry.full_name,
    is_platform_admin: false,
    timezone: "Asia/Kolkata",
  });
  if (profileErr) throw profileErr;
  return user;
}

async function main() {
  console.log("Seeding DEMO auth users (not paying customers)...");
  for (const entry of DEMO_USERS) {
    await ensureAuthUser(entry);
  }

  const { data, error } = await admin.rpc("seed_demo_content");
  if (error) {
    console.error("seed_demo_content RPC failed:", error.message);
    console.error(
      "Apply supabase/migrations/20260326000031_demo_seed.sql, then re-run this script.",
    );
    process.exit(1);
  }

  if (data && data.ok === false) {
    console.error("Seed function returned:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("\nDEMO seed complete (internal test tenants — not customers).");
  console.log(JSON.stringify(data, null, 2));
  console.log("\nLogin: http://localhost:3000/login");
  console.log(`Password (demo-only): ${DEMO_PASSWORD}`);
  console.log("");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email.padEnd(42)}  ${u.full_name.padEnd(16)}  ${u.title.padEnd(18)}  ${u.org}`);
  }
  console.log("\nField app (Field Technician): http://localhost:3000/field-login");
  console.log("  vikram@demo.sonilpower.local");
  console.log("  meera@demo.narmadachemlog.local");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
