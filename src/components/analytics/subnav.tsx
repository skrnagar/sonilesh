import Link from "next/link";
import { cn } from "@/lib/utils";

const EXECUTIVE = [
  { href: "/app/executive", label: "Control Tower" },
  { href: "/app/executive/critical", label: "Critical" },
  { href: "/app/executive/report", label: "Report" },
  { href: "/app/executive/compliance", label: "Compliance" },
];

const ANALYTICS = [
  { href: "/app/analytics", label: "Overview" },
  { href: "/app/analytics/safety", label: "Safety" },
  { href: "/app/analytics/risk", label: "Risk" },
  { href: "/app/analytics/permits", label: "Permits" },
  { href: "/app/analytics/capa", label: "CAPA" },
  { href: "/app/analytics/inspections", label: "Inspections" },
  { href: "/app/analytics/workforce", label: "Workforce" },
  { href: "/app/analytics/sites", label: "Sites" },
  { href: "/app/analytics/projects", label: "Projects" },
  { href: "/app/analytics/dashboards", label: "Dashboards" },
  { href: "/app/analytics/data-quality", label: "Data quality" },
];

export function ExecutiveSubnav({ current }: { current: string }) {
  return <ChipNav links={EXECUTIVE} current={current} label="Executive" />;
}

export function AnalyticsSubnav({ current }: { current: string }) {
  return <ChipNav links={ANALYTICS} current={current} label="Analytics" />;
}

function ChipNav({
  links,
  current,
  label,
}: {
  links: Array<{ href: string; label: string }>;
  current: string;
  label: string;
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label={label}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium",
            current === link.href
              ? "bg-primary text-white dark:text-[#071f2d]"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
