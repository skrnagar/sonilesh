import Link from "next/link";
import { ScanSearch } from "lucide-react";
import {
  FIELD_REPORT_CATEGORIES,
  getFieldReportLinksForCategory,
  type FieldReportLink,
} from "@/lib/field/report-links";
import type { FieldRole } from "@/lib/auth/field-roles";
import { FieldMark } from "@/components/field/field-ui";
import { cn } from "@/lib/utils";

function ReportLinkButton({ link }: { link: FieldReportLink }) {
  return (
    <Link
      href={link.href}
      className={cn(
        "block rounded-[var(--radius-md)] border border-border/80 bg-card px-3.5 py-3 text-center text-sm font-medium text-foreground shadow-[var(--shadow-sm)] transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/35 hover:bg-primary/5 hover:shadow-[var(--shadow-md)]",
        link.status === "scaffold" && "opacity-90",
      )}
    >
      {link.label}
      {link.status === "scaffold" ? (
        <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
          Coming soon
        </span>
      ) : null}
    </Link>
  );
}

function CategoryHeader({
  category,
}: {
  category: (typeof FIELD_REPORT_CATEGORIES)[number];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {category.key === "raksha" ? (
          <FieldMark className="h-6 w-6" />
        ) : category.key === "iquality" ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--raksha-blue-light)]">
            <ScanSearch className="h-3.5 w-3.5 text-[var(--raksha-blue-dark)]" />
          </span>
        ) : null}
        <h2 className="text-sm font-semibold text-[var(--raksha-blue-dark)]">{category.label}</h2>
      </div>
      {category.subtitle ? (
        <p className="text-base font-bold text-foreground">{category.subtitle}</p>
      ) : null}
    </div>
  );
}

export function FieldReportsHub({ role }: { role: FieldRole }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-md)] border border-border/80 bg-muted/40 px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--raksha-blue-dark)]">Report</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          All the data / reports on this page is made available through the Analytics platform.
          Please visit KEC MyZone &gt; KEC BI for advanced dashboards.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {FIELD_REPORT_CATEGORIES.map((category) => {
          const links = getFieldReportLinksForCategory(category.key, role);
          if (!links.length) return null;

          return (
            <section key={category.key} className="space-y-3">
              <CategoryHeader category={category} />
              <div className="space-y-2">
                {links.map((link) => (
                  <ReportLinkButton key={link.key} link={link} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
