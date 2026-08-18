import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";
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
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return { ok: false, status: 403, body: forbiddenResponse() };
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
    const permByScope: Record<string, string> = {
      "incidents.read": "incidents.view",
      "capa.read": "capa.view",
      "sites.read": "sites.view",
      "permits.read": "permits.view",
    };
    const perm = permByScope[spec.scope];
    if (perm) {
      const allowed = await userHasPermission(auth.supabase, tenantId, auth.auth.userId, perm);
      if (!allowed) return Response.json(forbiddenResponse(), { status: 403 });
    }
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
    q = q.or(`title.ilike.%${query.filters.q}%,event_number.ilike.%${query.filters.q}%`);
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
  const { data: connection } = await admin
    .from("integration_connections")
    .select("id, organization_id, integrations:integration_id(code)")
    .eq("organization_id", orgFromHeader)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

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
