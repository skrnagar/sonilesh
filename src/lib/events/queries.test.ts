import { describe, expect, it } from "vitest";
import { EVENT_LIST_PAGE_SIZE } from "@/lib/events/queries";

describe("event list pagination", () => {
  it("caps list pages so the browser never receives an unbounded dump", () => {
    expect(EVENT_LIST_PAGE_SIZE).toBe(50);
    expect(EVENT_LIST_PAGE_SIZE).toBeLessThanOrEqual(100);
  });
});
