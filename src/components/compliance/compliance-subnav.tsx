import Link from "next/link";

const LINKS = [
  { href: "/app/compliance/dashboard", label: "Dashboard" },
  { href: "/app/compliance/calendar", label: "Calendar" },
  { href: "/app/compliance/heatmap", label: "Heatmap" },
  { href: "/app/compliance/legal-register", label: "Legal register" },
  { href: "/app/compliance/requirements", label: "Requirements" },
  { href: "/app/compliance/assessments", label: "Assessments" },
  { href: "/app/compliance/licenses", label: "Licenses" },
  { href: "/app/compliance/reviews", label: "Change reviews" },
  { href: "/app/compliance/jurisdictions", label: "Jurisdictions" },
  { href: "/app/compliance/regulations", label: "Regulations" },
];

export function ComplianceSubnav() {
  return (
    <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
      {LINKS.map((link) => (
        <Link key={link.href} className="underline-offset-2 hover:text-foreground hover:underline" href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
