import { describe, expect, it } from "vitest";
import {
  filterQualityObservationRows,
  formatQualityObservationDate,
  groupQualityObservations,
  isQualityObservation,
  type QualityObservationRow,
} from "@/lib/services/quality-observations";

const sampleRow = (overrides: Partial<QualityObservationRow> = {}): QualityObservationRow => ({
  id: "1",
  eventNumber: "QO028149",
  locationNo: "156/0",
  categoryName: "Stringing",
  subcategoryName: "Miscellaneous",
  categoryGroup: "Quality",
  description: "Steel wire rope used without gunny bag.",
  status: "submitted",
  statusLabel: "Open",
  reportedByName: "RITAN KUMAR PATRA",
  createdOn: "2026-08-13T08:00:00.000Z",
  closedByName: null,
  closedOn: null,
  businessUnitName: "T&D India & SAARC",
  regionName: "MP",
  projectName: "TA-505- 765 KV D/C Beawar - Mandsaur TL",
  businessUnitId: "bu-1",
  regionId: "reg-1",
  projectId: "proj-1",
  ...overrides,
});

describe("quality observations helpers", () => {
  it("detects QO prefix and quality metadata", () => {
    expect(isQualityObservation({ eventNumber: "QO028149" })).toBe(true);
    expect(
      isQualityObservation({
        eventNumber: "HZ-2026-00001",
        metadata: { report_domain: "quality" },
      }),
    ).toBe(true);
    expect(
      isQualityObservation({
        eventNumber: "HZ-2026-00001",
        metadata: { category_group: "Quality" },
      }),
    ).toBe(true);
    expect(isQualityObservation({ eventNumber: "UA1093175" })).toBe(false);
  });

  it("formats Raksha-style dates", () => {
    expect(formatQualityObservationDate("2026-08-13T08:00:00.000Z")).toMatch(/13-Aug-2026/);
  });

  it("filters by region and serial number", () => {
    const rows = [
      sampleRow(),
      sampleRow({
        id: "2",
        eventNumber: "QO28168",
        regionId: "reg-2",
        regionName: "GJ",
      }),
    ];
    const byRegion = filterQualityObservationRows(rows, { regionId: "reg-1" });
    expect(byRegion).toHaveLength(1);
    expect(byRegion[0]?.eventNumber).toBe("QO028149");

    const bySerial = filterQualityObservationRows(rows, { serialNumber: "28168" });
    expect(bySerial).toHaveLength(1);
    expect(bySerial[0]?.eventNumber).toBe("QO28168");
  });

  it("groups rows by SBU, region, project, and category", () => {
    const rows = [
      sampleRow(),
      sampleRow({ id: "2", eventNumber: "QO28168" }),
      sampleRow({
        id: "3",
        eventNumber: "QO99999",
        regionName: "GJ",
        regionId: "reg-2",
      }),
    ];
    const grouped = groupQualityObservations(rows);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.businessUnitName).toBe("T&D India & SAARC");
    expect(grouped[0]?.regions).toHaveLength(2);
    expect(grouped[0]?.regions[0]?.projects[0]?.categories[0]?.rows).toHaveLength(2);
  });
});
