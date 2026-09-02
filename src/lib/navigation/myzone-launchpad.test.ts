import { describe, expect, it } from "vitest";
import { filterMyZoneTilesForField, MY_ZONE_TILES } from "@/lib/navigation/myzone-launchpad";
import { filterIQualityTilesForField, IQUALITY_TILES } from "@/lib/navigation/iquality-launchpad";
import {
  EHS_OPERATIONS_TILES,
  filterEhsOperationsForField,
} from "@/lib/navigation/ehs-operations-launchpad";

describe("My Zone launchpad", () => {
  it("defines 7 app hub tiles without Raksha", () => {
    expect(MY_ZONE_TILES).toHaveLength(7);
    expect(MY_ZONE_TILES.some((t) => t.label.toLowerCase().includes("raksha"))).toBe(false);
    expect(MY_ZONE_TILES.some((t) => t.key === "iquality")).toBe(true);
    expect(MY_ZONE_TILES.some((t) => t.key === "reports")).toBe(true);
  });

  it("shows core apps for employees", () => {
    const tiles = filterMyZoneTilesForField("employee");
    expect(tiles.some((t) => t.key === "iquality")).toBe(true);
    expect(tiles.some((t) => t.key === "reports")).toBe(true);
    expect(tiles.some((t) => t.key === "i-track")).toBe(true);
  });

  it("hides reports for contractors without report access", () => {
    const tiles = filterMyZoneTilesForField("contractor");
    expect(tiles.some((t) => t.key === "reports")).toBe(false);
    expect(tiles.some((t) => t.key === "iquality")).toBe(true);
  });
});

describe("iQuality launchpad", () => {
  it("defines 12 quality modules", () => {
    expect(IQUALITY_TILES).toHaveLength(12);
  });

  it("filters NC for ehs officers", () => {
    const tiles = filterIQualityTilesForField("ehs_officer");
    expect(tiles.some((t) => t.key === "nc")).toBe(true);
    expect(tiles.some((t) => t.key === "quality-observation")).toBe(true);
  });

  it("hides NC for employees", () => {
    const tiles = filterIQualityTilesForField("employee");
    expect(tiles.some((t) => t.key === "nc")).toBe(false);
    expect(tiles.some((t) => t.key === "checklist")).toBe(false);
  });
});

describe("EHS operations launchpad", () => {
  it("defines 15 field operations modules", () => {
    expect(EHS_OPERATIONS_TILES).toHaveLength(15);
  });

  it("excludes my-zone and report duplicates", () => {
    const keys = EHS_OPERATIONS_TILES.map((t) => t.key);
    expect(keys).not.toContain("my-zone");
    expect(keys).not.toContain("raksha-reports");
  });

  it("filters tiles for supervisor role", () => {
    const tiles = filterEhsOperationsForField("supervisor");
    expect(tiles.some((t) => t.key === "incident")).toBe(true);
    expect(tiles.some((t) => t.key === "utilities")).toBe(false);
  });
});
