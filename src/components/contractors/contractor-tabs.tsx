import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "workers", label: "Workers" },
  { id: "documents", label: "Documents" },
  { id: "prequalification", label: "Prequalification" },
  { id: "contracts", label: "Contracts" },
  { id: "assignments", label: "Assignments" },
  { id: "inductions", label: "Inductions" },
  { id: "assessments", label: "Assessments" },
  { id: "performance", label: "Performance" },
  { id: "readiness", label: "Readiness" },
  { id: "history", label: "History" },
];

export function ContractorTabs({
  companyId,
  current,
}: {
  companyId: string;
  current: string;
}) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-2" aria-label="Contractor record">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/app/contractors/${companyId}?tab=${tab.id}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium",
            current === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
