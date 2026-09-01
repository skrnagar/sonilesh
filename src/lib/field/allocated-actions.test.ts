import { describe, expect, it } from "vitest";
import { formatFieldActionDate } from "@/lib/field/allocated-actions";

describe("formatFieldActionDate", () => {
  it("returns dash for empty values", () => {
    expect(formatFieldActionDate(null)).toBe("—");
    expect(formatFieldActionDate(undefined)).toBe("—");
  });

  it("formats valid timestamps", () => {
    const formatted = formatFieldActionDate("2026-09-01T09:59:00Z");
    expect(formatted).toMatch(/2026/);
    expect(formatted).not.toBe("—");
  });
});
