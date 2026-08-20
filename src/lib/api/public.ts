import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const API_KEY_PREFIX = "ehs_live_";

export function hashApiKey(plaintext: string) {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function generateApiKey() {
  const secret = randomBytes(24).toString("base64url");
  const plaintext = `${API_KEY_PREFIX}${secret}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, 16),
    hash: hashApiKey(plaintext),
  };
}

export function parseBearer(header: string | null) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim();
}

export function timingSafeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export const API_SCOPES = [
  "incidents.read",
  "capa.read",
  "sites.read",
  "projects.read",
  "permits.read",
  "training.read",
  "webhooks.manage",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export function hasScope(granted: string[], needed: string) {
  if (granted.includes("*")) return true;
  return granted.includes(needed);
}

export type PublicApiAuth = {
  organizationId: string;
  userId: string | null;
  scopes: string[];
  via: "session" | "api_key";
};

/** Client-supplied organization_id is never trusted. */
export function resolveTenantId(auth: PublicApiAuth, _clientOrgId?: string | null) {
  void _clientOrgId;
  return auth.organizationId;
}

export type ListQuery = {
  page: number;
  pageSize: number;
  sort: string;
  order: "asc" | "desc";
  filters: Record<string, string>;
};

const MAX_PAGE_SIZE = 100;
const ALLOWED_SORT = new Set([
  "created_at",
  "updated_at",
  "status",
  "name",
  "code",
  "event_number",
  "due_date",
]);

export function parseListQuery(url: URL): ListQuery {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? "25") || 25),
  );
  const sortRaw = url.searchParams.get("sort") ?? "created_at";
  const sort = ALLOWED_SORT.has(sortRaw) ? sortRaw : "created_at";
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";
  const filters: Record<string, string> = {};
  for (const key of ["status", "site_id", "q"] as const) {
    const value = url.searchParams.get(key);
    if (value) filters[key] = value;
  }
  if (filters.q) {
    filters.q = escapePostgrestFilter(filters.q);
    if (!filters.q) delete filters.q;
  }
  return { page, pageSize, sort, order, filters };
}

export function rangeForPage(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

export type RateLimitResult = { allowed: true; remaining: number } | { allowed: false; remaining: 0 };

type Bucket = { windowStart: number; count: number };
const memory = new Map<string, Bucket>();

export function checkApiRateLimit(input: {
  organizationId: string;
  limit: number;
  now?: number;
}) {
  const start = Math.floor((input.now ?? Date.now()) / 3_600_000) * 3_600_000;
  const key = `${input.organizationId}:${start}`;
  const bucket = memory.get(key) ?? { windowStart: start, count: 0 };
  const next = bucket.count + 1;
  if (next > input.limit) {
    return { allowed: false as const, remaining: 0 as const };
  }
  memory.set(key, { windowStart: start, count: next });
  return { allowed: true as const, remaining: input.limit - next };
}

export function resetApiRateLimitForTests() {
  memory.clear();
}

export const RESOURCE_TABLE: Record<
  string,
  { table: string; scope: ApiScope; select: string; siteColumn?: string }
> = {
  incidents: {
    table: "ehs_events",
    scope: "incidents.read",
    select: "id, organization_id, event_number, status, site_id, project_id, title, occurred_at, created_at, updated_at",
    siteColumn: "site_id",
  },
  capa: {
    table: "capa_items",
    scope: "capa.read",
    select: "id, organization_id, title, status, due_date, created_at, updated_at",
  },
  sites: {
    table: "sites",
    scope: "sites.read",
    select: "id, organization_id, name, code, city, country, timezone, locale, currency, jurisdiction_id, created_at, updated_at",
  },
  projects: {
    table: "projects",
    scope: "projects.read",
    select: "id, organization_id, name, code, site_id, status, created_at, updated_at",
    siteColumn: "site_id",
  },
  permits: {
    table: "permits",
    scope: "permits.read",
    select: "id, organization_id, permit_number, status, site_id, created_at, updated_at",
    siteColumn: "site_id",
  },
  training: {
    table: "training_assignments",
    scope: "training.read",
    select: "id, organization_id, course_id, user_id, status, due_date, completed_at, created_at, updated_at",
  },
};

export function unknownResourceResponse() {
  return { error: "not_found", message: "Unknown resource" };
}

export function crossTenantResponse() {
  return { error: "not_found", message: "Resource not found" };
}

export function forbiddenResponse() {
  return { error: "forbidden", message: "Insufficient scope or permission" };
}

/** Strip PostgREST `.or()` metacharacters so search terms cannot inject extra filters. */
export function escapePostgrestFilter(value: string) {
  return value.replace(/[,()\\%_*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}
