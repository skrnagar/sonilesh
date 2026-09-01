import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  ClipboardList,
  Home,
  PlusCircle,
  Shield,
} from "lucide-react";

export type FieldNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  prefetch?: boolean;
  match: (pathname: string) => boolean;
};

export const FIELD_NAV_ITEMS: FieldNavItem[] = [
  {
    href: "/field",
    label: "Home",
    icon: Home,
    prefetch: true,
    match: (p) => p === "/field" || p === "/field/home",
  },
  {
    href: "/field/report",
    label: "Report",
    icon: PlusCircle,
    prefetch: true,
    match: (p) =>
      p.startsWith("/field/report") ||
      p.startsWith("/field/new") ||
      p.startsWith("/field/incident") ||
      p.startsWith("/field/near-miss") ||
      p.startsWith("/field/lmra") ||
      p.startsWith("/field/hazard") ||
      p.startsWith("/field/site-visits") ||
      p.startsWith("/field/bbs") ||
      p.startsWith("/field/reports"),
  },
  {
    href: "/field/actions",
    label: "Actions",
    icon: ClipboardList,
    prefetch: false,
    match: (p) => p.startsWith("/field/actions") || p.startsWith("/field/action-list"),
  },
  {
    href: "/field/permits",
    label: "Permits",
    icon: Shield,
    prefetch: false,
    match: (p) => p.startsWith("/field/permits"),
  },
  {
    href: "/field/inspection",
    label: "Inspect",
    icon: ClipboardCheck,
    prefetch: false,
    match: (p) =>
      p.startsWith("/field/inspection") ||
      p.startsWith("/field/checklist") ||
      p.startsWith("/field/nc"),
  },
];

/** Shared shell width — mobile stays full-width; desktop uses a wide centered column. */
export const FIELD_SHELL_CLASS = "mx-auto w-full max-w-5xl px-3 sm:px-4 lg:max-w-7xl lg:px-6";
