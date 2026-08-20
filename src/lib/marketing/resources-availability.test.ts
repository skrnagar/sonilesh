import { describe, expect, it } from "vitest";
import { marketingResources } from "@/lib/marketing/content";
import { getResourcePost } from "@/lib/marketing/mdx";

describe("marketing resources availability", () => {
  it("marks available resources only when href and content exist", () => {
    for (const resource of marketingResources) {
      if (resource.availability === "AVAILABLE") {
        expect(resource.href, resource.id).toBeTruthy();
      }
      if (resource.availability === "COMING_SOON") {
        expect(resource.href, resource.id).toBeUndefined();
      }
    }
  });

  it("ships BRSR checker as available (never Coming soon)", () => {
    const brsr = marketingResources.find((item) => item.id === "brsr-applicability");
    expect(brsr?.availability).toBe("AVAILABLE");
    expect(brsr?.href).toBe("/resources/brsr-applicability");
  });

  it("publishes the four Phase 16A guides as MDX", () => {
    const slugs = [
      "implementation-overview",
      "field-adoption",
      "closed-loop-capa-playbook",
      "analytics-for-hse-leadership",
    ];
    for (const slug of slugs) {
      const post = getResourcePost(slug);
      expect(post, slug).toBeTruthy();
      expect(post?.draft).toBe(false);
    }
  });
});
