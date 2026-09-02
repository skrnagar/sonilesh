import type { AllocatedActionRow } from "@/lib/field/allocated-actions";
import type { UaucListRow } from "@/lib/services/uauc-list";

/** Demo tenants use slug prefix `demo-` (see supabase demo seed). */
export function isDemoOrg(slug: string | null | undefined): boolean {
  return Boolean(slug?.startsWith("demo-"));
}

const demoUaucBase = {
  businessUnitName: "Transmission",
  regionName: "Madhya Pradesh",
  projectName: "400 kV Pithampur LILO",
  businessUnitId: null,
  regionId: null,
  projectId: null,
  siteName: "Pithampur Substation",
  categoryName: null,
  subcategoryName: null,
  locationText: "Bay 12 — Transformer yard",
} as const;

export const DEMO_UAUC_ROWS: UaucListRow[] = [
  {
    ...demoUaucBase,
    id: "demo-ua-001",
    eventNumber: "UA-00001",
    incidentTypeCode: "unsafe_act",
    incidentTypeLabel: "Unsafe act",
    occurredAt: "2026-08-05T08:40:00.000Z",
    reportedAt: "2026-08-05T08:55:00.000Z",
    description: "Helper entered live-work buffer without briefing — stopped by supervisor.",
    createdByName: "Sunil Verma",
    actionItemCount: 1,
    status: "submitted",
    statusLabel: "Open",
  },
  {
    ...demoUaucBase,
    id: "demo-hz-001",
    eventNumber: "HZ-00001",
    incidentTypeCode: "unsafe_condition",
    incidentTypeLabel: "Unsafe condition",
    occurredAt: "2026-07-18T10:30:00.000Z",
    reportedAt: "2026-07-18T10:50:00.000Z",
    description: "Damaged earth mat riser near fence — corrosion and loose clamp.",
    createdByName: "Vikram Singh",
    actionItemCount: 0,
    status: "triage",
    statusLabel: "Open",
  },
  {
    ...demoUaucBase,
    id: "demo-so-001",
    eventNumber: "SO-00001",
    incidentTypeCode: "safety_observation",
    incidentTypeLabel: "Safety observation",
    occurredAt: "2026-08-01T03:00:00.000Z",
    reportedAt: "2026-08-01T03:15:00.000Z",
    description: "Crew used full body harness on gantry — positive observation.",
    createdByName: "Abhishek Patel",
    actionItemCount: 0,
    status: "closed",
    statusLabel: "Closed",
  },
];

export const DEMO_ACTION_ROWS: AllocatedActionRow[] = [
  {
    id: "demo-action-001",
    kind: "action_item",
    actionItem: "Verify trench cover locking pins — Bay 12",
    actionType: "incident",
    allocatedBy: "Harish Sharma",
    incidentRef: "INC-00001",
    allocatedOn: "2026-06-13T06:00:00.000Z",
    expectedDueDate: "2026-06-20",
    status: "open",
    statusLabel: "Open",
    canUpdate: true,
  },
  {
    id: "demo-action-002",
    kind: "capa",
    actionItem: "Fit locking pins on all Bay 12 trench covers",
    actionType: "corrective action",
    allocatedBy: "Harish Sharma",
    incidentRef: "INC-00001",
    allocatedOn: "2026-06-14T06:00:00.000Z",
    expectedDueDate: "2026-06-22",
    status: "in_progress",
    statusLabel: "Open",
    canUpdate: false,
  },
];

export type DemoSiteVisitRow = {
  id: string;
  visit_number: string;
  visit_type: "hsv" | "rsv" | "tsv";
  summary: string;
  visit_date: string;
  status: string;
};

export const DEMO_SITE_VISIT_ROWS: DemoSiteVisitRow[] = [
  {
    id: "demo-sv-001",
    visit_number: "HSV-00001",
    visit_type: "hsv",
    summary: "Head safety walkthrough — Pithampur substation. Housekeeping and PPE compliance reviewed.",
    visit_date: "2026-07-10",
    status: "completed",
  },
  {
    id: "demo-sv-002",
    visit_number: "TSV-00001",
    visit_type: "tsv",
    summary: "Team safety visit — Bay 12 transformer yard. Welding area barricades in place.",
    visit_date: "2026-08-02",
    status: "submitted",
  },
];

export function withDemoFallback<T>(rows: T[], demoRows: T[], slug: string | null | undefined): {
  rows: T[];
  isDemoPreview: boolean;
} {
  if (rows.length > 0) return { rows, isDemoPreview: false };
  if (!isDemoOrg(slug)) return { rows, isDemoPreview: false };
  return { rows: demoRows, isDemoPreview: true };
}
