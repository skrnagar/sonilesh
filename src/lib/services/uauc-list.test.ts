import { describe, expect, it } from "vitest";
import {
  filterUaucRows,
  incidentTypeLabel,
  isUaucOpen,
  mapUaucStatusLabel,
  resolveUaucTypeCode,
  type UaucListRow,
} from "@/lib/services/uauc-list";

const sampleRow = (overrides: Partial<UaucListRow> = {}): UaucListRow => ({
  id: "1",
  eventNumber: "UA1093175",
  incidentTypeCode: "unsafe_act",
  incidentTypeLabel: "Unsafe Act",
  occurredAt: "2026-09-01T08:44:00.000Z",
  reportedAt: "2026-09-01T09:13:00.000Z",
  description: "Test",
  createdByName: "Mehadi Hasan",
  actionItemCount: 1,
  status: "submitted",
  statusLabel: "Open",
  businessUnitName: "T&D India & SAARC",
  regionName: "MP",
  projectName: "TA-505",
  businessUnitId: null,
  regionId: null,
  projectId: null,
  siteName: "Site A",
  categoryName: "Height Work",
  subcategoryName: null,
  locationText: "123/0",
  ...overrides,
});

describe("uauc list helpers", () => {
  it("maps open workflow statuses to Open label", () => {
    expect(mapUaucStatusLabel("submitted")).toBe("Open");
    expect(mapUaucStatusLabel("closed")).toBe("Closed");
    expect(isUaucOpen("triage")).toBe(true);
    expect(isUaucOpen("closed")).toBe(false);
  });

  it("resolves UA/UC/WSN aliases", () => {
    expect(resolveUaucTypeCode("ua")).toBe("unsafe_act");
    expect(resolveUaucTypeCode("uc")).toBe("unsafe_condition");
    expect(resolveUaucTypeCode("wsn")).toBe("safety_observation");
    expect(incidentTypeLabel("safety_observation")).toBe("WSN");
  });

  it("filters rows by serial number and open status", () => {
    const rows = [
      sampleRow(),
      sampleRow({ id: "2", eventNumber: "UC887086", incidentTypeCode: "unsafe_condition", status: "closed", statusLabel: "Closed" }),
    ];
    const openOnly = filterUaucRows(rows, { status: "open" });
    expect(openOnly).toHaveLength(1);
    expect(openOnly[0]?.eventNumber).toBe("UA1093175");

    const bySerial = filterUaucRows(rows, { serialNumber: "887" });
    expect(bySerial).toHaveLength(1);
    expect(bySerial[0]?.eventNumber).toBe("UC887086");
  });
});
