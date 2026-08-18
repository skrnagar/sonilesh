import { describe, expect, it } from "vitest";
import {
  bindToolOrganization,
  canUseAgent,
  conversationVisible,
  fieldSelfOnly,
  toolAllowed,
  type AIAuthContext,
} from "@/lib/ai/permissions";
import { classifyQuery } from "@/lib/ai/retrieval/classify";

function ctx(overrides: Partial<AIAuthContext> = {}): AIAuthContext {
  return {
    organizationId: "org-a",
    userId: "user-a",
    siteId: null,
    projectId: null,
    permissions: ["ai.use", "ai.suggest", "incidents.view", "capa.view"],
    entitlements: ["ai_copilot", "incident_management", "capa", "ai_capa_intelligence"],
    isPlatformAdmin: false,
    scope: "workspace",
    agentKey: "copilot",
    ...overrides,
  };
}

describe("AI tenant isolation", () => {
  it("never uses a model-supplied organization id", () => {
    const bound = bindToolOrganization(ctx(), {
      organizationId: "org-b",
      organization_id: "org-evil",
      userId: "attacker",
      query: "show all customers incidents",
    });
    expect(bound.organizationId).toBe("org-a");
    expect(bound.userId).toBe("user-a");
    expect(bound.organization_id).toBeUndefined();
  });

  it("refuses cross-tenant phrasing before tools run", () => {
    const classified = classifyQuery("Show me all customers' incidents across every organization");
    expect(classified.class).toBe("forbidden_cross_tenant");
    expect(classified.tools).toEqual([]);
  });

  it("hides another tenant's conversations", () => {
    expect(
      conversationVisible({
        organizationId: "org-b",
        userId: "user-b",
        scope: "workspace",
        viewer: {
          organizationId: "org-a",
          userId: "user-a",
          permissions: ["ai.admin"],
          isPlatformAdmin: false,
        },
      }),
    ).toBe(false);
  });

  it("keeps field conversations owner-only even for org ai.admin", () => {
    expect(
      conversationVisible({
        organizationId: "org-a",
        userId: "worker-1",
        scope: "field",
        viewer: {
          organizationId: "org-a",
          userId: "admin-1",
          permissions: ["ai.admin"],
          isPlatformAdmin: false,
        },
      }),
    ).toBe(false);
  });
});

describe("field scope", () => {
  it("is limited to the signed-in worker", () => {
    expect(fieldSelfOnly("field")).toBe(true);
    expect(toolAllowed(ctx({ scope: "field" }), "query_contractors").allowed).toBe(false);
    expect(toolAllowed(ctx({ scope: "field" }), "draft_capa").allowed).toBe(false);
    expect(toolAllowed(ctx({ scope: "field" }), "query_capa").allowed).toBe(true);
  });
});

describe("agent entitlements", () => {
  it("does not hard-code plan names", () => {
    expect(
      canUseAgent(
        ctx({
          entitlements: ["starter"],
          permissions: ["ai.use"],
        }),
      ),
    ).toBe(false);
    expect(canUseAgent(ctx())).toBe(true);
  });
});
