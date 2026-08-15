import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils";

describe("slugify", () => {
  it("normalizes organization names", () => {
    expect(slugify("Acme Power & Grid")).toBe("acme-power-grid");
  });
});
