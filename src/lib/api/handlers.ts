import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";
import { ORG_COOKIE } from "@/lib/auth/workspace-cookies";
import {
  checkApiRateLimit,
  forbiddenResponse,
  hashApiKey,
  hasScope,
  parseBearer,
  parseListQuery,
  rangeForPage,
  RESOURCE_TABLE,
  resolveTenantId,
  unknownResourceResponse,
  type PublicApiAuth,
} from "@/lib/api/public";
import { verifyWebhookSignature } from "@/lib/integrations/webhooks";
import { decryptSecret } from "@/lib/integrations/credentials";
import { OPENAPI_DOCUMENT } from "@/lib/api/openapi";

export async function authenticatePublicApi(request: Request): Promise<
  | { ok: true; auth: PublicApiAuth; supabase: SupabaseClient }
  | { ok: false; status: number; body: Record<string, string> }
> {
  const bearer = parseBearer(request.headers.get("authorization"));
  if (bearer?.startsWith("ehs_live_")) {
    const admin = createAdminClient();
    const hash = hashApiKey(bearer);
    const { data: key } = await admin
      .from("organization_api_keys")
      .select("id, organization_id, scopes, revoked_at, expires_at")
      .eq("key_hash", hash)
      .maybeSingle();
    if (!key || key.revoked_at) {
      return { ok: false, status: 401, body: { error: "unauthorized", message: "Invalid API key" } };
    }
    if (key.expires_at && Date.parse(key.expires_at) < Date.now()) {
      return { ok: false, status: 401, body: { error: "unauthorized", message: "API key expired" } };
    }
    const entitled = await hasFeature(admin, key.organization_id, "public_api");
    if (!entitled) {
      const fallback = await hasFeature(admin, key.organization_id, "api_access");
      if (!fallback) {
        return { ok: false, status: 403, body: { error: "forbidden", message: "Public API is not entitled" } };
      }
    }
    await admin
      .from("organization_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", key.id)
      .eq("organization_id", key.organization_id);
    return {
      ok: true,
      auth: {
        organizationId: key.organization_id,
        userId: null,
        scopes: key.scopes ?? [],
        via: "api_key",
      },
      supabase: admin,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401, body: { error: "unauthorized", message: "Sign in or provide an API key" } };
  }
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null);
  if (!memberships?.length) {
    return { ok: false, status: 403, body: forbiddenResponse() };
  }
  const jar = await cookies();
  const requestedOrg =
    jar.get(ORG_COOKIE)?.value ||
    request.headers.get("x-ehs-organization-id") ||
    null;
  const membership =
    memberships.find((row) => row.organization_id === requestedOrg) ??
    (memberships.length === 1 ? memberships[0] : null);
  if (!membership) {
    return {
      ok: false,
      status: 400,
      body: { error: "organization_required", message: "Select an organization for session API access" },
    };
  }
  const entitled = await hasFeature(supabase, membership.organization_id, "public_api");
  if (!entitled) {
    const fallback = await hasFeature(supabase, membership.organization_id, "api_access");
    if (!fallback) {
      return { ok: false, status: 403, body: { error: "forbidden", message: "Public API is not entitled" } };
    }
  }
  return {
    ok: true,
    auth: {
      organizationId: membership.organization_id,
      userId: user.id,
      scopes: ["*"],
      via: "session",
    },
    supabase,
  };
}

const SESSION_PERM_BY_SCOPE: Record<string, string> = {
  "incidents.read": "incidents.view",
  "capa.read": "capa.view",
  "sites.read": "sites.view",
  "permits.read": "permits.view",
};

async function assertSessionResourcePermission(
  supabase: SupabaseClient,
  auth: PublicApiAuth,
  tenantId: string,
  scope: string,
) {
  if (!auth.userId) return true;
  const perm = SESSION_PERM_BY_SCOPE[scope];
  if (!perm) return true;
  return userHasPermission(supabase, tenantId, auth.userId, perm);
}

export async function handleResourceList(request: Request, resource: string) {
  if (resource === "openapi.json" || resource === "openapi") {
    return Response.json(OPENAPI_DOCUMENT);
  }
  const spec = RESOURCE_TABLE[resource];
  if (!spec) return Response.json(unknownResourceResponse(), { status: 404 });

  const auth = await authenticatePublicApi(request);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });
  if (!hasScope(auth.auth.scopes, spec.scope)) {
    return Response.json(forbiddenResponse(), { status: 403 });
  }

  const url = new URL(request.url);
  const tenantId = resolveTenantId(auth.auth, url.searchParams.get("organization_id"));
  const limitEnt = 1000;
  const rate = checkApiRateLimit({ organizationId: tenantId, limit: limitEnt });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  if (auth.auth.userId) {
    const allowed = await assertSessionResourcePermission(
      auth.supabase,
      auth.auth,
      tenantId,
      spec.scope,
    );
    if (!allowed) return Response.json(forbiddenResponse(), { status: 403 });
  }

  const query = parseListQuery(url);
  const { from, to } = rangeForPage(query.page, query.pageSize);
  let q = auth.supabase
    .from(spec.table)
    .select(spec.select, { count: "exact" })
    .eq("organization_id", tenantId)
    .order(query.sort, { ascending: query.order === "asc" })
    .range(from, to);

  if (query.filters.status) q = q.eq("status", query.filters.status);
  if (query.filters.site_id && spec.siteColumn) q = q.eq(spec.siteColumn, query.filters.site_id);
  if (query.filters.q && resource === "incidents") {
    const term = query.filters.q;
    q = q.or(`title.ilike."%${term}%",event_number.ilike."%${term}%"`);
  }

  const { data, error, count } = await q;
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({
    data: data ?? [],
    page: query.page,
    pageSize: query.pageSize,
    total: count ?? 0,
  });
}

export async function handleResourceGet(request: Request, resource: string, id: string) {
  const spec = RESOURCE_TABLE[resource];
  if (!spec) return Response.json(unknownResourceResponse(), { status: 404 });
  const auth = await authenticatePublicApi(request);
  if (!auth.ok) return Response.json(auth.body, { status: auth.status });
  if (!hasScope(auth.auth.scopes, spec.scope)) {
    return Response.json(forbiddenResponse(), { status: 403 });
  }
  const tenantId = resolveTenantId(auth.auth, new URL(request.url).searchParams.get("organization_id"));
  if (auth.auth.userId) {
    const allowed = await assertSessionResourcePermission(
      auth.supabase,
      auth.auth,
      tenantId,
      spec.scope,
    );
    if (!allowed) return Response.json(forbiddenResponse(), { status: 403 });
  }
  const { data, error } = await auth.supabase
    .from(spec.table)
    .select(spec.select)
    .eq("id", id)
    .eq("organization_id", tenantId)
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "not_found", message: "Resource not found" }, { status: 404 });
  return Response.json({ data });
}

export async function handleInboundWebhook(request: Request, connector: string) {
  const raw = await request.text();
  let body: Record<string, unknown> = {};
  try {
    body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const orgFromHeader = request.headers.get("x-ehs-organization-id");
  if (!orgFromHeader) {
    return Response.json({ error: "unauthorized", message: "Missing organization header" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: connections } = await admin
    .from("integration_connections")
    .select("id, organization_id, integrations:integration_id(code)")
    .eq("organization_id", orgFromHeader)
    .is("deleted_at", null);
  const connection =
    (connections ?? []).find((row) => {
      const integ = row.integrations as { code?: string } | { code?: string }[] | null;
      const code = Array.isArray(integ) ? integ[0]?.code : integ?.code;
      return code === connector;
    }) ?? null;

  const { data: cred } = connection
    ? await admin
        .from("integration_credentials")
        .select("encrypted_payload, secret_ref")
        .eq("connection_id", connection.id)
        .eq("organization_id", orgFromHeader)
        .maybeSingle()
    : { data: null };

  let secret = "";
  try {
    secret = cred?.encrypted_payload ? decryptSecret(cred.encrypted_payload) : "";
  } catch {
    secret = "";
  }
  const verified = verifyWebhookSignature({
    secret,
    header: request.headers.get("x-ehs-signature"),
    body: raw,
  });
  if (!verified.ok) {
    return Response.json({ error: "unauthorized", message: verified.reason }, { status: 401 });
  }

  const externalId = String(body.external_id || body.id || request.headers.get("x-ehs-delivery-id") || "");
  if (!externalId) {
    return Response.json({ error: "bad_request", message: "external_id required" }, { status: 400 });
  }

  const { error } = await admin.from("integration_inbound_receipts").insert({
    organization_id: orgFromHeader,
    external_system: connector,
    external_id: externalId,
    signature_ok: true,
    payload: body,
  });
  if (error?.code === "23505") {
    return Response.json({ ok: true, duplicate: true }, { status: 200 });
  }
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
