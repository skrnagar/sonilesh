import { describe, expect, it } from "vitest";
import {
  bucketCalendarEvent,
  eventsInRange,
  filterHitsBySessionOrg,
  monthGrid,
  nextExpiryReminder,
  sanitizeSearchQuery,
  startOfWeekUtc,
  type CalendarEvent,
  type SearchHit,
} from "@/lib/compliance/calendar";
import { applyEsgVerification, canAdvanceEsgVerification } from "@/lib/esg/verification";

const sessionOrg = "org-session";
const urlOrg = "org-from-url";

describe("global compliance search isolation", () => {
  it("keeps only the session organization and ignores a URL org id", () => {
    const hits: SearchHit[] = [
      { organization_id: sessionOrg, kind: "license", id: "1", title: "CTO", href: "/a" },
      { organization_id: urlOrg, kind: "license", id: "2", title: "Other", href: "/b" },
    ];
    const scoped = filterHitsBySessionOrg(hits, sessionOrg, urlOrg);
    expect(scoped).toHaveLength(1);
    expect(scoped[0].id).toBe("1");
    expect(scoped[0].organization_id).not.toBe(urlOrg);
  });

  it("strips ilike wildcards from the user query", () => {
    expect(sanitizeSearchQuery("%secret_")).toBe("secret");
  });
});

describe("compliance calendar views", () => {
  const events: CalendarEvent[] = [
    { id: "1", title: "A", date: "2026-08-18", kind: "task", status: "open", href: "/t/1" },
    { id: "2", title: "B", date: "2026-08-10", kind: "task", status: "open", href: "/t/2" },
    { id: "3", title: "C", date: "2026-08-25", kind: "license", status: "filed", href: "/l/3", completed: true },
  ];

  it("buckets overdue / today / soon / completed", () => {
    expect(bucketCalendarEvent(events[0], "2026-08-18")).toBe("due_today");
    expect(bucketCalendarEvent(events[1], "2026-08-18")).toBe("overdue");
    expect(bucketCalendarEvent(events[2], "2026-08-18")).toBe("completed");
  });

  it("supports month grid and week range", () => {
    const days = monthGrid(2026, 7);
    expect(days).toHaveLength(42);
    expect(startOfWeekUtc("2026-08-18")).toBe("2026-08-17");
    const week = eventsInRange(events, "2026-08-17", "2026-08-23");
    expect(week.map((e) => e.id)).toEqual(["1"]);
  });
});

describe("ESG verification historical integrity", () => {
  it("advances Draft → Published without changing the recorded value", () => {
    const original = { value: 42, unit: "tCO2e", verification_status: "draft" as const };
    const submitted = applyEsgVerification(original, "submitted");
    const verified = applyEsgVerification(submitted, "verified");
    const published = applyEsgVerification(verified, "published");
    expect(published.value).toBe(42);
    expect(published.unit).toBe("tCO2e");
    expect(published.verification_status).toBe("published");
    expect(original.verification_status).toBe("draft");
    expect(canAdvanceEsgVerification("draft", "published")).toBe(false);
    expect(canAdvanceEsgVerification("verified", "published")).toBe(true);
  });
});

describe("expiry reminder events", () => {
  it("emits license/evidence event keys from the spec ladder", () => {
    expect(nextExpiryReminder(5, "none")?.eventKey).toBe("compliance.review_due");
    expect(nextExpiryReminder(-1, "none")?.eventKey).toBe("compliance.overdue");
  });
});
