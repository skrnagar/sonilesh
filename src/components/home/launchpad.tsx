import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  FileText,
  Gauge,
  HardHat,
  Inbox,
  LayoutDashboard,
  MapPin,
  PlusCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { cn } from "@/lib/utils";

export type LaunchTile = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent?: "navy" | "teal" | "amber" | "red" | "slate";
};

const ACCENT: Record<string, string> = {
  navy: "border-[var(--mkt-navy)]/20 bg-[var(--mkt-navy)]/5 hover:border-[var(--mkt-navy)]/40",
  teal: "border-[var(--mkt-safety)]/25 bg-[var(--mkt-safety)]/8 hover:border-[var(--mkt-safety)]/45",
  amber: "border-amber-500/25 bg-amber-500/8 hover:border-amber-500/45",
  red: "border-red-500/20 bg-red-500/5 hover:border-red-500/40",
  slate: "border-border bg-muted/30 hover:border-border/80",
};

export const WORKER_TILES: LaunchTile[] = [
  { key: "ua-uc", label: "Report UA / UC", description: "Unsafe act or condition", href: "/app/reports/new?type=unsafe_act", icon: Eye, accent: "teal" },
  { key: "incident", label: "Report incident", description: "Injury or property damage", href: "/app/incidents/new", icon: AlertTriangle, accent: "red" },
  { key: "near-miss", label: "Near miss", description: "Potential incident", href: "/app/near-misses/new", icon: ShieldAlert, accent: "amber" },
  { key: "lmra", label: "LMRA", description: "Last minute risk assessment", href: "/field/lmra", icon: ClipboardCheck, accent: "navy" },
  { key: "actions", label: "My actions", description: "Assigned CAPA items", href: "/app/action-items", icon: CheckSquare, accent: "slate" },
];

export const SAFETY_OFFICER_TILES: LaunchTile[] = [
  { key: "uauc-queue", label: "UA / UC queue", description: "Allocate and close observations", href: "/app/observations", icon: Eye, accent: "teal" },
  { key: "lmra-approvals", label: "LMRA approvals", description: "Review submitted LMRAs", href: "/app/lmra?status=submitted", icon: ClipboardCheck, accent: "navy" },
  { key: "reporting-queue", label: "Reporting queue", description: "Pending submissions", href: "/app/reporting/queue", icon: Inbox, accent: "amber" },
  { key: "incidents", label: "Incidents", description: "Investigate and close", href: "/app/incidents", icon: AlertTriangle, accent: "red" },
  { key: "capa", label: "CAPA overdue", description: "Corrective actions", href: "/app/capa", icon: CheckSquare, accent: "slate" },
  { key: "new-report", label: "New report", description: "Create any report type", href: "/app/reports/new", icon: PlusCircle, accent: "teal" },
];

export const PM_TILES: LaunchTile[] = [
  { key: "incidents", label: "Incidents", description: "Project incidents", href: "/app/incidents", icon: AlertTriangle, accent: "red" },
  { key: "permits", label: "Permits", description: "Active PTW", href: "/app/permits/active", icon: FileText, accent: "navy" },
  { key: "visits", label: "Site visits", description: "HSV / RSV / TSV", href: "/app/site-visits", icon: MapPin, accent: "teal" },
  { key: "capa", label: "Project CAPA", description: "Open actions", href: "/app/capa", icon: CheckSquare, accent: "slate" },
  { key: "dashboard", label: "Dashboard", description: "Operational KPIs", href: "/app/dashboard", icon: LayoutDashboard, accent: "navy" },
];

export const CORPORATE_EHS_TILES: LaunchTile[] = [
  { key: "executive", label: "Control Tower", description: "Executive overview", href: "/app/executive", icon: LayoutDashboard, accent: "navy" },
  { key: "mis", label: "EHS MIS", description: "Management information", href: "/app/mis", icon: FileSpreadsheet, accent: "teal" },
  { key: "scorecard", label: "EHS Scorecard", description: "Dimensional scoring", href: "/app/ehs-score", icon: Gauge, accent: "amber" },
  { key: "analytics", label: "Analytics", description: "Trends and drill-down", href: "/app/analytics", icon: BarChart3, accent: "slate" },
  { key: "report-hub", label: "Report Hub", description: "Registers and exports", href: "/app/reports/hub", icon: FileText, accent: "navy" },
  { key: "ai", label: "EHS Copilot", description: "Assistive intelligence", href: "/app/ai", icon: Sparkles, accent: "teal" },
];

export const AUDITOR_TILES: LaunchTile[] = [
  { key: "audits", label: "Audits", description: "Audit programs", href: "/app/audits", icon: ClipboardCheck, accent: "navy" },
  { key: "findings", label: "Findings", description: "Open findings", href: "/app/findings", icon: Eye, accent: "amber" },
  { key: "search", label: "Evidence search", description: "Cross-module search", href: "/app/search", icon: FileText, accent: "slate" },
  { key: "reports", label: "Reports", description: "Audit registers", href: "/app/reports", icon: FileText, accent: "navy" },
];

export function resolvePersonaTiles(roleCodes: string[]): {
  persona: string;
  tiles: LaunchTile[];
} {
  if (roleCodes.includes("auditor")) {
    return { persona: "Auditor", tiles: AUDITOR_TILES };
  }
  if (
    roleCodes.some((c) =>
      ["ehs_admin", "ehs_manager", "tenant_admin", "super_admin"].includes(c),
    )
  ) {
    return { persona: "Corporate EHS", tiles: CORPORATE_EHS_TILES };
  }
  if (roleCodes.some((c) => ["ehs_officer", "investigator"].includes(c))) {
    return { persona: "Safety Officer", tiles: SAFETY_OFFICER_TILES };
  }
  if (roleCodes.some((c) => ["site_manager", "department_head", "supervisor"].includes(c))) {
    return { persona: "Site / Project Manager", tiles: PM_TILES };
  }
  if (roleCodes.includes("contractor")) {
    return {
      persona: "Contractor",
      tiles: WORKER_TILES.filter((t) => t.key !== "lmra").concat([
        { key: "contractor", label: "Contractor portal", description: "Induction and docs", href: "/contractor", icon: HardHat, accent: "navy" },
      ]),
    };
  }
  return { persona: "Worker", tiles: WORKER_TILES };
}

export function OpsTileGrid({ tiles }: { tiles: LaunchTile[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link
            key={tile.key}
            href={tile.href}
            className={cn(
              "group flex min-h-[7.5rem] flex-col rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-200 hover:shadow-[var(--shadow-md)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
              ACCENT[tile.accent ?? "slate"],
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-[var(--shadow-sm)]">
              <Icon className="h-4.5 w-4.5 text-foreground" />
            </span>
            <span className="mt-3 font-display text-sm font-semibold tracking-tight text-foreground group-hover:text-primary">
              {tile.label}
            </span>
            <span className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {tile.description}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function HomeLaunchpad({
  persona,
  tiles,
  organizationName,
  userName,
}: {
  persona: string;
  tiles: LaunchTile[];
  organizationName: string;
  userName: string;
}) {
  return (
    <div className="app-page-stagger min-w-0 space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Home", href: "/app/home" }]} className="mb-2" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">
          Enterprise launchpad
        </p>
        <h1 className="mt-1 font-display text-[length:var(--text-app-title)] font-semibold tracking-tight text-foreground">
          Welcome back{userName ? `, ${userName.split(/\s+/)[0]}` : ""}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {persona} workspace for {organizationName}. Launch daily safety operations — not a marketplace.
        </p>
      </div>
      <OpsTileGrid tiles={tiles} />
    </div>
  );
}
