import { describe, expect, it } from "vitest";
import { authorizeOrganizationAccess } from "@/lib/auth/access";
import { DEFAULT_MAPPINGS, transformRecord, validateExternalRecord } from "@/lib/integrations/mapping";
import { dedupeKey, runSyncPipeline } from "@/lib/integrations/sync";
import { providerFor } from "@/lib/integrations/providers";
import type { ExternalRecord } from "@/lib/integrations/types";

const record = (id: string, extra: Partial<ExternalRecord> = {}): ExternalRecord => ({
  externalSystem: "hrms_workday",
  externalId: id,
  entityType: "employee",
  updatedAt: "2026-01-02T00:00:00.000Z",
  fields: { employee_id: id, full_name: "Ada Lovelace", email: "ada@example.com" },
  ...extra,
});

describe("tenant isolation", () => {
  it("never grants access from a client-supplied organization id alone", () => {
    expect(
      authorizeOrganizationAccess({
        requestedOrganizationId: "org-b",
        membershipOrganizationIds: ["org-a"],
        isPlatformAdmin: false,
      }),
    ).toBe(false);
  });

  it("rejects sync writes when the tenant does not match", () => {
    const result = runSyncPipeline({
      mode: "full",
      records: [record("E-1")],
      cursor: {},
      rules: DEFAULT_MAPPINGS,
      seen: new Set(),
      auth: {
        organizationId: "org-a",
        allowedOrganizationId: "org-b",
        canWrite: true,
      },
    });
    expect(result.written).toHaveLength(0);
    expect(result.failed[0]?.error).toMatch(/tenant mismatch/);
  });
});

describe("duplicate sync prevention", () => {
  it("dedupes on external_system + external_id", () => {
    const seen = new Set([dedupeKey("hrms_workday", "E-1")]);
    const result = runSyncPipeline({
      mode: "full",
      records: [record("E-1"), record("E-2")],
      cursor: {},
      rules: DEFAULT_MAPPINGS,
      seen,
      auth: { organizationId: "org-a", allowedOrganizationId: "org-a", canWrite: true },
    });
    expect(result.deduped.map((r) => r.externalId)).toEqual(["E-1"]);
    expect(result.written.map((r) => r.externalId)).toEqual(["E-2"]);
  });

  it("filters incremental records by cursor updated_at", () => {
    const result = runSyncPipeline({
      mode: "incremental",
      records: [
        record("old", { updatedAt: "2026-01-01T00:00:00.000Z" }),
        record("new", { updatedAt: "2026-01-03T00:00:00.000Z" }),
      ],
      cursor: { updatedAt: "2026-01-02T00:00:00.000Z" },
      rules: DEFAULT_MAPPINGS,
      seen: new Set(),
      auth: { organizationId: "org-a", allowedOrganizationId: "org-a", canWrite: true },
    });
    expect(result.written.map((r) => r.externalId)).toEqual(["new"]);
  });
});

describe("mapping engine", () => {
  it("maps employee fields onto worker/member", () => {
    expect(validateExternalRecord(record("E-1"))).toBeNull();
    const mapped = transformRecord(record("E-1"), DEFAULT_MAPPINGS);
    expect(mapped.internalEntity).toBe("worker");
    expect(mapped.fields.employee_number).toBe("E-1");
    expect(mapped.fields.full_name).toBe("Ada Lovelace");
  });
});

describe("iot adapter", () => {
  it("never invents meter readings", async () => {
    const fetched = await providerFor("iot_meters").fetch({
      mode: "full",
      cursor: {},
      config: {},
    });
    expect(fetched.records).toEqual([]);
    expect(fetched.note).toMatch(/not implemented/i);
  });
});
