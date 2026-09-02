import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Leaf,
  MapPinned,
  ScanSearch,
  Shield,
} from "lucide-react";
import { canFieldAction, type FieldAction, type FieldRole } from "@/lib/auth/field-roles";
import { filterEhsOperationsForField } from "@/lib/navigation/ehs-operations-launchpad";

export type MyZoneTileKey =
  | "iquality"
  | "reports"
  | "brsr"
  | "data-hub"
  | "my-attendance"
  | "i-track"
  | "ia-tracker"
  | "ehs-operations";

export type MyZoneTileDef = {
  key: MyZoneTileKey;
  label: string;
  href: string;
  icon: LucideIcon;
  fieldAction: FieldAction;
  prefetch?: boolean;
  /** Show when user has any EHS operations module (computed dynamically). */
  dynamicEhsOps?: boolean;
};

/** KEC MyZone-style app launcher — field home at `/field`. */
export const MY_ZONE_TILES: MyZoneTileDef[] = [
  {
    key: "iquality",
    label: "iQuality",
    href: "/field/iquality",
    icon: ClipboardCheck,
    fieldAction: "my_zone",
    prefetch: true,
  },
  {
    key: "reports",
    label: "Reports",
    href: "/field/reports",
    icon: FileText,
    fieldAction: "raksha_reports",
  },
  {
    key: "brsr",
    label: "BRSR",
    href: "/field/reports/brsr",
    icon: Leaf,
    fieldAction: "raksha_reports",
  },
  {
    key: "data-hub",
    label: "Data Hub",
    href: "/field/data-hub",
    icon: BarChart3,
    fieldAction: "my_zone",
  },
  {
    key: "my-attendance",
    label: "My Attendance",
    href: "/field/attendance",
    icon: CalendarCheck,
    fieldAction: "my_zone",
  },
  {
    key: "i-track",
    label: "i-Track",
    href: "/field/i-track",
    icon: MapPinned,
    fieldAction: "my_zone",
  },
  {
    key: "ia-tracker",
    label: "IA Tracker",
    href: "/field/ia-tracker",
    icon: ScanSearch,
    fieldAction: "my_zone",
  },
  {
    key: "ehs-operations",
    label: "EHS Operations",
    href: "/field/operations",
    icon: Shield,
    fieldAction: "my_zone",
    prefetch: true,
    dynamicEhsOps: true,
  },
];

export type ResolvedMyZoneTile = {
  key: MyZoneTileKey;
  label: string;
  href: string;
  prefetch?: boolean;
};

export function filterMyZoneTilesForField(role: FieldRole): ResolvedMyZoneTile[] {
  const ehsOps = filterEhsOperationsForField(role);

  return MY_ZONE_TILES.filter((tile) => {
    if (tile.dynamicEhsOps) return ehsOps.length > 0;
    return canFieldAction(role, tile.fieldAction);
  }).map((tile) => ({
    key: tile.key,
    label: tile.label,
    href: tile.href,
    prefetch: tile.prefetch,
  }));
}

