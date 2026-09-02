import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  Gauge,
  Headphones,
  Lightbulb,
  MapPin,
  MessageSquareQuote,
  OctagonAlert,
} from "lucide-react";
import { canFieldAction, type FieldAction, type FieldRole } from "@/lib/auth/field-roles";

export type IQualityTileKey =
  | "quality-observation"
  | "nc"
  | "wsn"
  | "checklist-template"
  | "quality-visit"
  | "checklist"
  | "scorecard"
  | "mis-report"
  | "audit-schedule"
  | "support-request"
  | "kaizen"
  | "customer-feedback";

export type IQualityTileDef = {
  key: IQualityTileKey;
  label: string;
  href: string;
  icon: LucideIcon;
  fieldAction: FieldAction;
  prefetch?: boolean;
};

/** iQuality sub-hub tiles — `/field/iquality`. */
export const IQUALITY_TILES: IQualityTileDef[] = [
  {
    key: "quality-observation",
    label: "Quality Observation",
    href: "/field/reports/quality-observations",
    icon: Eye,
    fieldAction: "raksha_reports",
    prefetch: true,
  },
  {
    key: "nc",
    label: "NC",
    href: "/field/nc",
    icon: ClipboardList,
    fieldAction: "nc",
  },
  {
    key: "wsn",
    label: "WSN",
    href: "/field/ualist",
    icon: OctagonAlert,
    fieldAction: "report_hazard",
    prefetch: true,
  },
  {
    key: "checklist-template",
    label: "Checklist Template",
    href: "/field/checklist/templates",
    icon: ClipboardCheck,
    fieldAction: "checklist_template",
  },
  {
    key: "quality-visit",
    label: "Quality Visit",
    href: "/field/site-visits",
    icon: MapPin,
    fieldAction: "site_visit",
  },
  {
    key: "checklist",
    label: "Checklist",
    href: "/field/inspection",
    icon: ClipboardCheck,
    fieldAction: "inspection",
  },
  {
    key: "scorecard",
    label: "Scorecard",
    href: "/field/iquality/scorecard",
    icon: Gauge,
    fieldAction: "ehs_score",
  },
  {
    key: "mis-report",
    label: "MIS Report",
    href: "/field/mis",
    icon: FileSpreadsheet,
    fieldAction: "ehs_mis",
  },
  {
    key: "audit-schedule",
    label: "Audit Schedule",
    href: "/field/iquality/audit-schedule",
    icon: CalendarClock,
    fieldAction: "my_zone",
  },
  {
    key: "support-request",
    label: "Support Request",
    href: "/field/iquality/support",
    icon: Headphones,
    fieldAction: "my_zone",
  },
  {
    key: "kaizen",
    label: "Kaizen",
    href: "/field/iquality/kaizen",
    icon: Lightbulb,
    fieldAction: "my_zone",
  },
  {
    key: "customer-feedback",
    label: "Customer Feedback",
    href: "/field/iquality/customer-feedback",
    icon: MessageSquareQuote,
    fieldAction: "my_zone",
  },
];

export type ResolvedIQualityTile = {
  key: IQualityTileKey;
  label: string;
  href: string;
  prefetch?: boolean;
};

export function filterIQualityTilesForField(role: FieldRole): ResolvedIQualityTile[] {
  return IQUALITY_TILES.filter((tile) => canFieldAction(role, tile.fieldAction)).map((tile) => ({
    key: tile.key,
    label: tile.label,
    href: tile.href,
    prefetch: tile.prefetch,
  }));
}

