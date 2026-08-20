import { describe, expect, it } from "vitest";
import { safeRelativePath } from "@/lib/http/safe-path";

describe("safeRelativePath", () => {
  it("allows in-app paths and query strings", () => {
    expect(safeRelativePath("/field/home")).toBe("/field/home");
    expect(safeRelativePath("/app/incidents?tab=open")).toBe("/app/incidents?tab=open");
  });

  it("rejects protocol-relative and userinfo open redirects", () => {
    expect(safeRelativePath("//evil.example")).toBe("/app/dashboard");
    expect(safeRelativePath("/\\evil.example")).toBe("/app/dashboard");
    expect(safeRelativePath("/@evil.example")).toBe("/app/dashboard");
  });

  it("falls back for empty or absolute URLs", () => {
    expect(safeRelativePath(null, "/login")).toBe("/login");
    expect(safeRelativePath("https://evil.example/phish", "/login")).toBe("/login");
  });
});
