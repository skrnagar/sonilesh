import { describe, expect, it } from "vitest";
import { GET as healthGet } from "@/app/api/health/route";
import { API_ERROR_CODES, jsonError, jsonOk } from "@/lib/http/api-response";
import { billingWebhookEventId } from "@/lib/billing/webhook";
import { assertOrgScopedStoragePath, assertPrivateAttachmentPath } from "@/lib/services/attachments";
import { authorizeOrganizationAccess } from "@/lib/auth/access";

describe("GET /api/health", () => {
  it("returns ok without leaking configuration", async () => {
    const response = await healthGet(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(JSON.stringify(body)).not.toMatch(/service_role|secret|password/i);
  });
});

describe("API error envelopes", () => {
  it("includes structured codes and never a stack", async () => {
    expect(API_ERROR_CODES).toContain("ENTITLEMENT_REQUIRED");
    const response = jsonError("FORBIDDEN", "Not allowed", 403);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(JSON.stringify(body)).not.toMatch(/at Object|Error: /);
    const ok = jsonOk({ ping: true });
    expect((await ok.json()).ok).toBe(true);
  });
});

describe("billing webhook idempotency key", () => {
  it("prefers the provider event header", () => {
    const request = new Request("http://localhost/api/billing/razorpay", {
      headers: { "x-razorpay-event-id": "evt_123" },
    });
    expect(billingWebhookEventId(request, "{}", { event: "subscription.charged" })).toBe("evt_123");
  });

  it("falls back to event plus entity id", () => {
    const request = new Request("http://localhost/api/billing/razorpay");
    expect(
      billingWebhookEventId(request, "{}", {
        event: "subscription.charged",
        payload: { subscription: { entity: { id: "sub_9" } } },
      }),
    ).toBe("subscription.charged:sub_9");
  });
});

describe("private storage paths", () => {
  it("rejects public object URLs and cross-tenant prefixes", () => {
    expect(() =>
      assertPrivateAttachmentPath("https://example.supabase.co/storage/v1/object/public/ehs-attachments/x"),
    ).toThrow(/public/i);
    expect(() =>
      assertOrgScopedStoragePath("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222/file.pdf"),
    ).toThrow(/outside this organization/);
    expect(
      assertOrgScopedStoragePath(
        "11111111-1111-1111-1111-111111111111",
        "11111111-1111-1111-1111-111111111111/field/photo.jpg",
      ),
    ).toContain("field/photo.jpg");
  });
});

describe("tenant isolation contract", () => {
  it("does not authorize org B from a URL/form org id alone", () => {
    expect(
      authorizeOrganizationAccess({
        requestedOrganizationId: "org-b",
        membershipOrganizationIds: ["org-a"],
        isPlatformAdmin: false,
      }),
    ).toBe(false);
  });
});
