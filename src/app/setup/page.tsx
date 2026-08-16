import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/env";
import {
  NETWORK_SETUP_MESSAGE,
  SCHEMA_SETUP_MESSAGE,
} from "@/lib/supabase/errors";

export const dynamic = "force-dynamic";

function classify(errorMessage: string | undefined, okLabel = "ok") {
  if (!errorMessage) return { ready: true, detail: okLabel };
  if (errorMessage.includes("Could not find the table")) {
    return { ready: false, detail: errorMessage };
  }
  if (errorMessage.includes("Could not find the function")) {
    return { ready: false, detail: errorMessage };
  }
  // RPC exists but rejects unauthenticated service call — expected
  if (errorMessage.includes("Not authenticated")) {
    return { ready: true, detail: "present (auth required)" };
  }
  return { ready: false, detail: errorMessage };
}

async function probe() {
  if (!hasSupabaseConfig()) {
    return { ok: false as const, reason: "Missing NEXT_PUBLIC_SUPABASE_URL / anon key" };
  }
  try {
    const admin = createAdminClient();
    // Use real GETs (not HEAD). PostgREST can omit errors on some HEAD probes
    // when the table is missing, which falsely reports Ready.
    const [profiles, organizations, rpc] = await Promise.all([
      admin.from("profiles").select("id").limit(1),
      admin.from("organizations").select("id").limit(1),
      admin.rpc("bootstrap_organization", {
        p_name: "__probe__",
        p_slug: "__probe__",
        p_industry: "Oil & Gas",
        p_company_type: null,
        p_country: null,
      }),
    ]);

    const p = classify(profiles.error?.message);
    const o = classify(organizations.error?.message);
    const b = classify(rpc.error?.message, "callable");

    return {
      ok: true as const,
      profiles: p,
      organizations: o,
      bootstrapRpc: b,
      schemaReady: p.ready && o.ready && b.ready,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Probe failed";
    const network =
      message.toLowerCase().includes("fetch failed") || e instanceof TypeError;
    return {
      ok: false as const,
      reason: network ? NETWORK_SETUP_MESSAGE : message,
    };
  }
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const status = await probe();

  const banner =
    params.reason === "schema"
      ? SCHEMA_SETUP_MESSAGE
      : params.reason === "network"
        ? NETWORK_SETUP_MESSAGE
        : params.reason === "supabase"
          ? "Supabase request failed. Check configuration and schema status below."
          : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary">SONIL EHS360 setup status</h1>
      <p className="text-sm text-muted-foreground">
        Onboarding and the dashboard require the remote schema. If tables are missing, apply
        migrations before continuing.
      </p>
      {banner ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {banner}
        </p>
      ) : null}
      <div className="border border-border bg-card p-4 text-sm">
        {!status.ok ? (
          <p className="text-destructive">{status.reason}</p>
        ) : (
          <ul className="space-y-2">
            <li>
              <strong>profiles:</strong> {status.profiles.detail}
            </li>
            <li>
              <strong>organizations:</strong> {status.organizations.detail}
            </li>
            <li>
              <strong>bootstrap_organization:</strong> {status.bootstrapRpc.detail}
            </li>
            <li>
              <strong>Ready:</strong>{" "}
              {status.schemaReady ? "YES" : "NO — apply migrations"}
            </li>
          </ul>
        )}
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Apply one of:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Supabase Dashboard → SQL Editor → paste{" "}
            <code className="text-foreground">supabase/_all_migrations.sql</code> → Run
          </li>
          <li>
            Set <code className="text-foreground">SUPABASE_DB_PASSWORD</code> in{" "}
            <code className="text-foreground">.env.local</code> then{" "}
            <code className="text-foreground">node scripts/apply-migrations.mjs</code>
          </li>
        </ol>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="text-sm font-medium text-accent underline">
          Login
        </Link>
        <Link href="/onboarding" className="text-sm font-medium text-accent underline">
          Onboarding
        </Link>
        <Link href="/app/dashboard" className="text-sm font-medium text-accent underline">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
