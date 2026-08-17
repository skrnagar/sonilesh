import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app/contractors", label: "Register" },
  { href: "/app/contractors/dashboard", label: "Dashboard" },
  { href: "/app/contractors/prequalification", label: "Prequalification" },
  { href: "/app/contractors/contracts", label: "Contracts" },
  { href: "/app/contractors/assignments", label: "Assignments" },
  { href: "/app/contractors/inductions", label: "Inductions" },
  { href: "/app/contractors/assessments", label: "Assessments" },
  { href: "/app/contractors/performance", label: "Performance" },
  { href: "/app/contractors/readiness", label: "Readiness" },
  { href: "/app/settings/contractors/categories", label: "Settings" },
];

export function ContractorsNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Contractor module">
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
