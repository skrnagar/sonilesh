import { describe, expect, it, vi } from "vitest";
import { DOCUMENT_NUMBER_KEYS, nextDocumentNumber } from "@/lib/services/document-numbers";

describe("nextDocumentNumber", () => {
  it("calls next_event_number RPC and returns string", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "LMRA-2026-00042", error: null });
    const supabase = { rpc } as never;

    const result = await nextDocumentNumber(supabase, "org-1", "lmra:org-1", "LMRA-");
    expect(result).toBe("LMRA-2026-00042");
    expect(rpc).toHaveBeenCalledWith("next_event_number", {
      p_organization_id: "org-1",
      p_sequence_key: "lmra:org-1",
      p_prefix: "LMRA-",
    });
  });

  it("throws when RPC fails", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "denied" } }),
    } as never;
    await expect(
      nextDocumentNumber(supabase, "org-1", "lmra:org-1", "LMRA-"),
    ).rejects.toThrow("denied");
  });
});

describe("DOCUMENT_NUMBER_KEYS", () => {
  it("scopes LMRA keys per organization", () => {
    const { key, prefix } = DOCUMENT_NUMBER_KEYS.lmra("abc");
    expect(key).toBe("lmra:abc");
    expect(prefix).toBe("LMRA-");
  });

  it("scopes site visit keys by type", () => {
    const { key, prefix } = DOCUMENT_NUMBER_KEYS.siteVisit("abc", "hsv");
    expect(key).toBe("site_visit_hsv:abc");
    expect(prefix).toBe("HSV-");
  });
});
