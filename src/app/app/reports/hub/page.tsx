import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleShell } from "@/components/modules/module-shell";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  {
    key: "safety",
    label: "Safety",
    description: "Incidents, UA/UC, near misses, and operational registers.",
    links: [
      { href: "/app/incidents", label: "Incidents register" },
      { href: "/app/observations", label: "UA / UC observations" },
      { href: "/app/near-misses", label: "Near misses" },
      { href: "/app/reports?forceClosed=1", label: "Force-closure audit" },
    ],
  },
  {
    key: "ehs",
    label: "EHS",
    description: "CAPA, inspections, permits, and LMRA.",
    links: [
      { href: "/app/capa", label: "CAPA register" },
      { href: "/app/inspections", label: "Inspections" },
      { href: "/app/permits", label: "Permits" },
      { href: "/app/lmra", label: "LMRA" },
    ],
  },
  {
    key: "management",
    label: "Management",
    description: "Executive and MIS roll-ups.",
    links: [
      { href: "/app/executive", label: "Control Tower" },
      { href: "/app/mis", label: "EHS MIS" },
      { href: "/app/ehs-score", label: "EHS Scorecard" },
      { href: "/app/analytics", label: "Analytics hub" },
    ],
  },
  {
    key: "compliance",
    label: "Compliance",
    description: "Regulatory and contractor exports.",
    links: [
      { href: "/app/compliance/dashboard", label: "Compliance dashboard" },
      { href: "/app/compliance/legal-register", label: "Legal register" },
      { href: "/app/contractors/export", label: "Contractor export", comingSoon: true },
      { href: "/app/esg/brsr-report/export", label: "BRSR export", comingSoon: true },
    ],
  },
];

export default function ReportHubPage() {
  return (
    <ModuleShell
      title="Report Hub"
      description="Central entry for operational registers and exports."
      featureCode="advanced_reports"
      permission="reports.view"
    >
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "Reports", href: "/app/reports" },
          { label: "Report Hub" },
        ]}
        className="mb-4"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <section key={cat.key} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-sm font-semibold">{cat.label}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{cat.description}</p>
            <ul className="mt-3 space-y-2">
              {cat.links.map((link) => (
                <li key={link.href}>
                  {link.comingSoon ? (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {link.label}
                      <Badge variant="secondary">Coming soon</Badge>
                    </span>
                  ) : (
                    <Link href={link.href} className="text-sm font-medium text-accent hover:underline">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ModuleShell>
  );
}
