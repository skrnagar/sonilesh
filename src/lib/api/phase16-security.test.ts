import { describe, expect, it } from "vitest";
import {
  crossTenantResponse,
  escapePostgrestFilter,
  hasScope,
  parseListQuery,
  resolveTenantId,
  unknownResourceResponse,
} from "@/lib/api/public";
import {
  signWebhookPayload,
  verifyWebhookSignature,
} from "@/lib/integrations/webhooks";
import {
  cannotEscalatePrivileges,
  parseCsv,
  sanitizeImportRow,
} from "@/lib/import/pipeline";
import { sanitizeBranding, brandingCssVars } from "@/lib/branding/validate";
import { filterSearchHits } from "@/lib/search/enterprise";

describe("API IDOR", () => {
  it("ignores client-supplied organization_id", () => {
    const tenant = resolveTenantId(
      { organizationId: "org-a", userId: "u1", scopes: ["*"], via: "session" },
      "org-b",
    );
    expect(tenant).toBe("org-a");
  });

  it("returns 404-shaped body for cross-tenant ids", () => {
    expect(crossTenantResponse().error).toBe("not_found");
    expect(unknownResourceResponse().error).toBe("not_found");
  });

  it("enforces scopes before listing", () => {
    expect(hasScope(["sites.read"], "incidents.read")).toBe(false);
    expect(hasScope(["*"], "incidents.read")).toBe(true);
  });

  it("caps page size and allowlists sort", () => {
    const q = parseListQuery(new URL("https://example.test/api/v1/incidents?pageSize=999&sort=drop_table"));
    expect(q.pageSize).toBe(100);
    expect(q.sort).toBe("created_at");
  });

  it("strips PostgREST filter injection from search q", () => {
    const q = parseListQuery(
      new URL("https://example.test/api/v1/incidents?q=foo,status.eq.open"),
    );
    expect(q.filters.q).toBe("foo status.eq.open");
    expect(q.filters.q).not.toContain(",");
    expect(escapePostgrestFilter("a,b(c)%_")).toBe("a b c");
  });
});

describe("webhook signature reject", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ id: "evt_1" });
  const timestamp = 1_700_000_000;

  it("accepts a valid HMAC signature inside the replay window", () => {
    const header = signWebhookPayload({ secret, timestamp, body });
    const result = verifyWebhookSignature({
      secret,
      header,
      body,
      now: timestamp,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a tampered body", () => {
    const header = signWebhookPayload({ secret, timestamp, body });
    const result = verifyWebhookSignature({
      secret,
      header,
      body: JSON.stringify({ id: "other" }),
      now: timestamp,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_signature");
  });

  it("rejects replay outside the window", () => {
    const header = signWebhookPayload({ secret, timestamp, body });
    const result = verifyWebhookSignature({
      secret,
      header,
      body,
      now: timestamp + 10_000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("replay_window_exceeded");
  });

  it("rejects a missing signature header", () => {
    const result = verifyWebhookSignature({ secret, header: null, body, now: timestamp });
    expect(result.ok).toBe(false);
  });
});

describe("bulk import cannot escalate privileges", () => {
  it("strips owner and platform admin fields", () => {
    const row = sanitizeImportRow("users", {
      email: "a@example.com",
      is_owner: "true",
      is_platform_admin: "true",
      platform_role: "super_admin",
      role: "super_admin",
    });
    expect(row.payload.is_owner).toBeUndefined();
    expect(row.payload.is_platform_admin).toBeUndefined();
    expect(row.payload.platform_role).toBeUndefined();
    expect(row.payload.role).toBe("employee");
    expect(cannotEscalatePrivileges(row)).toBe(true);
    expect(row.skippedPrivilegeFields.length).toBeGreaterThan(0);
  });

  it("parses csv rows without executing formulas as code", () => {
    const parsed = parseCsv("email,role\nsafe@example.com,viewer");
    expect(parsed.rows[0]?.email).toBe("safe@example.com");
  });
});

describe("branding sanitization", () => {
  it("rejects CSS injection in colors and labels", () => {
    const branding = sanitizeBranding({
      primaryColor: "red; background: url(javascript:alert(1))",
      secondaryColor: "#0b3a53",
      logoUrl: "javascript:alert(1)",
      terminology: { capaLabel: "<script>alert(1)</script>" },
    });
    expect(branding.primaryColor).toBeNull();
    expect(branding.secondaryColor).toBe("#0b3a53");
    expect(branding.logoUrl).toBeNull();
    expect(branding.terminology.capaLabel).toBeUndefined();
    expect(brandingCssVars({ primaryColor: "expression(alert(1))" })).toEqual({});
  });
});

describe("enterprise search security filter", () => {
  it("filters other tenants before keyword matching", () => {
    const hits = filterSearchHits({
      scope: { organizationId: "org-a" },
      query: "incident",
      module: "incidents",
      hrefFor: (row) => `/app/incidents/${row.id}`,
      rows: [
        { id: "1", organization_id: "org-b", title: "incident leak", status: "open" },
        { id: "2", organization_id: "org-a", title: "incident inside", status: "open" },
      ],
    });
    expect(hits.map((h) => h.id)).toEqual(["2"]);
  });
});
