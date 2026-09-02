import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  Gauge,
  GraduationCap,
  LayoutGrid,
  LayoutTemplate,
  MapPin,
  ScanSearch,
  Shield,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import { canFieldAction, type FieldAction, type FieldRole } from "@/lib/auth/field-roles";

export type EhsOperationsTileKey =
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

export type EhsOperationsTile = {
  key: EhsOperationsTileKey;
  label: string;
  fieldAction: FieldAction;
  icon: LucideIcon;
  fieldHref: string;
  webHref: string;
  prefetch?: boolean;
};

/** Field EHS operations modules — accessible from My Zone, not branded as Raksha. */
export const EHS_OPERATIONS_TILES: EhsOperationsTile[] = [
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

export type ResolvedEhsOperationsTile = {
  key: EhsOperationsTileKey;
  label: string;
  href: string;
  prefetch?: boolean;
};

export function filterEhsOperationsForField(role: FieldRole): ResolvedEhsOperationsTile[] {
  return EHS_OPERATIONS_TILES.filter((tile) => canFieldAction(role, tile.fieldAction)).map(
    (tile) => ({
      key: tile.key,
      label: tile.label,
      href: tile.fieldHref,
      prefetch: tile.prefetch,
    }),
  );
}
