import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  LayoutTemplate,
  Eye,
  FileSpreadsheet,
  FileText,
  Gauge,
  GraduationCap,
  Home,
  LayoutGrid,
  MapPin,
  ScanSearch,
  Shield,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import { canFieldAction, type FieldAction, type FieldRole } from "@/lib/auth/field-roles";

export type RakshaLaunchpadKey =
  | "my-zone"
  | "raksha-reports"
  | "ua-uc-wsn"
  | "incident"
  | "hsv-rsv"
  | "tsv-hsr-rsr-wer"
  | "utilities"
  | "training"
  | "ehs-mis"
  | "ehs-score"
  | "nc"
  | "checklist"
  | "new-checklist"
  | "checklist-template"
  | "lmra"
  | "work-permit"
  | "bbs";

export type RakshaLaunchpadTile = {
  key: RakshaLaunchpadKey;
  label: string;
  fieldAction: FieldAction;
  icon: LucideIcon;
  fieldHref: string;
  webHref: string;
  prefetch?: boolean;
};

/** RAKSHA MyZone launchpad — 17 modules shared by field and web home. */
export const RAKSHA_LAUNCHPAD_TILES: RakshaLaunchpadTile[] = [
  {
    key: "my-zone",
    label: "MY ZONE",
    fieldAction: "my_zone",
    icon: Home,
    fieldHref: "/field",
    webHref: "/app/home",
    prefetch: true,
  },
  {
    key: "raksha-reports",
    label: "RAKSHA REPORTS",
    fieldAction: "raksha_reports",
    icon: FileText,
    fieldHref: "/field/reports",
    webHref: "/app/reports/hub",
  },
  {
    key: "ua-uc-wsn",
    label: "UA/UC/WSN",
    fieldAction: "report_hazard",
    icon: Eye,
    fieldHref: "/field/ualist",
    webHref: "/app/observations",
    prefetch: true,
  },
  {
    key: "incident",
    label: "INCIDENT",
    fieldAction: "report_incident",
    icon: AlertTriangle,
    fieldHref: "/field/incident",
    webHref: "/app/incidents",
    prefetch: true,
  },
  {
    key: "hsv-rsv",
    label: "HSV/RSV",
    fieldAction: "site_visit",
    icon: MapPin,
    fieldHref: "/field/site-visits?type=hsv",
    webHref: "/app/site-visits?type=hsv",
  },
  {
    key: "tsv-hsr-rsr-wer",
    label: "TSV/HSR/RSR/WER",
    fieldAction: "site_visit",
    icon: Shield,
    fieldHref: "/field/site-visits?type=tsv",
    webHref: "/app/site-visits?type=tsv",
  },
  {
    key: "utilities",
    label: "UTILITIES",
    fieldAction: "utilities",
    icon: Wrench,
    fieldHref: "/field/utilities",
    webHref: "/app/settings",
  },
  {
    key: "training",
    label: "TRAINING",
    fieldAction: "training",
    icon: GraduationCap,
    fieldHref: "/field/training",
    webHref: "/app/training",
  },
  {
    key: "ehs-mis",
    label: "EHS MIS REPORT",
    fieldAction: "ehs_mis",
    icon: FileSpreadsheet,
    fieldHref: "/field/mis",
    webHref: "/app/mis",
  },
  {
    key: "ehs-score",
    label: "EHS SCORE CARD",
    fieldAction: "ehs_score",
    icon: Gauge,
    fieldHref: "/field/ehs-score",
    webHref: "/app/ehs-score",
  },
  {
    key: "nc",
    label: "NC",
    fieldAction: "nc",
    icon: ClipboardList,
    fieldHref: "/field/nc",
    webHref: "/app/nc",
  },
  {
    key: "checklist",
    label: "CHECKLIST",
    fieldAction: "inspection",
    icon: ClipboardCheck,
    fieldHref: "/field/inspection",
    webHref: "/app/inspections",
  },
  {
    key: "new-checklist",
    label: "NEW CHECKLIST",
    fieldAction: "new_checklist",
    icon: LayoutGrid,
    fieldHref: "/field/checklist/new",
    webHref: "/app/inspections/new",
  },
  {
    key: "checklist-template",
    label: "CHECKLIST TEMPLATE",
    fieldAction: "checklist_template",
    icon: LayoutTemplate,
    fieldHref: "/field/checklist/templates",
    webHref: "/app/settings/ehs/checklists",
  },
  {
    key: "lmra",
    label: "LMRA",
    fieldAction: "lmra",
    icon: ScanSearch,
    fieldHref: "/field/lmra",
    webHref: "/app/lmra",
    prefetch: true,
  },
  {
    key: "work-permit",
    label: "WORK PERMIT",
    fieldAction: "my_permits",
    icon: Shield,
    fieldHref: "/field/permits",
    webHref: "/app/permits",
  },
  {
    key: "bbs",
    label: "BBS",
    fieldAction: "bbs",
    icon: ThumbsUp,
    fieldHref: "/field/bbs",
    webHref: "/app/observations?type=safety_observation",
  },
];

/** Serializable tile props safe to pass from Server Components to RakshaLaunchpadGrid. */
export type ResolvedRakshaTile = {
  key: RakshaLaunchpadKey;
  label: string;
  href: string;
  prefetch?: boolean;
};

export function filterRakshaLaunchpadForField(role: FieldRole): ResolvedRakshaTile[] {
  return RAKSHA_LAUNCHPAD_TILES.filter((tile) => canFieldAction(role, tile.fieldAction)).map(
    (tile) => ({
      key: tile.key,
      label: tile.label,
      href: tile.fieldHref,
      prefetch: tile.prefetch,
    }),
  );
}

const WEB_TILE_PERMISSIONS: Partial<Record<RakshaLaunchpadKey, string>> = {
  "my-zone": "dashboard.view",
  "raksha-reports": "reports.view",
  "ua-uc-wsn": "hazards.view",
  incident: "incidents.view",
  "hsv-rsv": "visits.view",
  "tsv-hsr-rsr-wer": "visits.view",
  utilities: "settings.manage",
  training: "training.view",
  "ehs-mis": "mis.view",
  "ehs-score": "score.view",
  nc: "findings.view",
  checklist: "inspections.view",
  "new-checklist": "inspections.create",
  "checklist-template": "checklists.manage",
  lmra: "lmra.view",
  "work-permit": "permits.view",
  bbs: "hazards.view",
};

export function filterRakshaLaunchpadForWeb(permissions: string[]): ResolvedRakshaTile[] {
  return RAKSHA_LAUNCHPAD_TILES.filter((tile) => {
    const required = WEB_TILE_PERMISSIONS[tile.key];
    if (!required) return true;
    return permissions.includes(required);
  }).map((tile) => ({
    key: tile.key,
    label: tile.label,
    href: tile.webHref,
    prefetch: tile.prefetch,
  }));
}
