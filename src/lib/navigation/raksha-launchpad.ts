import type { LucideIcon } from "lucide-react";
import { FileText, Home } from "lucide-react";
import { canFieldAction, type FieldAction, type FieldRole } from "@/lib/auth/field-roles";
import { EHS_OPERATIONS_TILES } from "@/lib/navigation/ehs-operations-launchpad";
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

/** RAKSHA-style launchpad for web home — includes My Zone hub tile and Report. */
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
    label: "REPORT",
    fieldAction: "raksha_reports",
    icon: FileText,
    fieldHref: "/field/reports",
    webHref: "/app/reports/hub",
  },
  ...EHS_OPERATIONS_TILES.map((tile) => ({
    key: tile.key as RakshaLaunchpadKey,
    label: tile.label,
    fieldAction: tile.fieldAction,
    icon: tile.icon,
    fieldHref: tile.fieldHref,
    webHref: tile.webHref,
    prefetch: tile.prefetch,
  })),
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
