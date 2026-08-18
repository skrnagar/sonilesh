import { describe, expect, it } from "vitest";
import {
  assertOrgMatch,
  assertVersionMutable,
  canTransitionDocument,
  suggestNextVersion,
} from "@/lib/services/documents";
import {
  assertPrivateAttachmentPath,
  assertOrgScopedStoragePath,
  isSignedUrl,
} from "@/lib/services/attachments";

describe("document engine", () => {
  it("isolates records by organization id", () => {
    expect(() => assertOrgMatch("org-a", "org-b", "Document")).toThrow(/this organization/i);
    expect(() => assertOrgMatch("org-a", "org-a")).not.toThrow();
  });

  it("cannot modify a historical published version", () => {
    expect(() => assertVersionMutable("published")).toThrow(/historical published version/i);
    expect(() => assertVersionMutable("superseded")).toThrow(/historical published version/i);
    expect(() => assertVersionMutable("draft")).not.toThrow();
  });

  it("follows draft to published workflow", () => {
    expect(canTransitionDocument("draft", "in_review")).toBe(true);
    expect(canTransitionDocument("approved", "published")).toBe(true);
    expect(canTransitionDocument("obsolete", "draft")).toBe(false);
  });

  it("suggests the next version number", () => {
    expect(suggestNextVersion(["1", "2"])).toBe("3");
    expect(suggestNextVersion([])).toBe("1");
  });
});

describe("signed URL vs public path", () => {
  it("rejects public HTTP storage paths", () => {
    expect(() => assertPrivateAttachmentPath("https://example.com/file.pdf")).toThrow(/private storage path/i);
    expect(() => assertPrivateAttachmentPath("/storage/v1/object/public/ehs-attachments/x")).toThrow(
      /public storage/i,
    );
  });

  it("accepts tenant-scoped private paths", () => {
    expect(assertPrivateAttachmentPath("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/documents/id/file.pdf")).toContain(
      "documents",
    );
  });

  it("detects signed URLs not public object paths", () => {
    expect(isSignedUrl("https://proj.supabase.co/storage/v1/object/sign/ehs-attachments/x?token=abc")).toBe(true);
    expect(isSignedUrl("https://proj.supabase.co/storage/v1/object/public/ehs-attachments/x")).toBe(false);
  });

  it("rejects storage paths outside the organization prefix", () => {
    expect(() =>
      assertOrgScopedStoragePath("org-a", "org-b/events/id/file.pdf"),
    ).toThrow(/outside this organization/i);
    expect(assertOrgScopedStoragePath("org-a", "org-a/events/id/file.pdf")).toBe("org-a/events/id/file.pdf");
  });
});
