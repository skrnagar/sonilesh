import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app/settings/organization", label: "Organization" },
  { href: "/app/settings/organization/structure", label: "Structure" },
  { href: "/app/settings/business-units", label: "Business units" },
  { href: "/app/settings/sites", label: "Sites" },
  { href: "/app/settings/projects", label: "Projects" },
  { href: "/app/settings/departments", label: "Departments" },
  { href: "/app/settings/locations", label: "Locations" },
  { href: "/app/settings/users", label: "Users" },
  { href: "/app/settings/ehs/report-types", label: "Report types" },
  { href: "/app/settings/ehs/categories", label: "Categories" },
  { href: "/app/settings/ehs/severities", label: "Severities" },
  { href: "/app/settings/ehs/risk-matrix", label: "Risk matrix" },
  { href: "/app/settings/ehs/permit-types", label: "Permit types" },
  { href: "/app/settings/ehs/checklists", label: "Checklists" },
  { href: "/app/settings/subscription", label: "Subscription" },
  { href: "/app/settings/billing", label: "Billing" },
];

export function SettingsNav({ current }: { current?: string }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3" aria-label="Settings">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium",
            current === link.href
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
