import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  FieldCard,
  FieldForbidden,
  FieldPageHeader,
  fieldPrimaryBtnClass,
  fieldSecondaryBtnClass,
} from "@/components/field/field-ui";
import { canFieldAction } from "@/lib/auth/field-roles";
import { getFieldReportLink, type FieldReportKey } from "@/lib/field/report-links";
import { resolveFieldRole } from "@/lib/field/resolve-role";

const REPORT_KEYS = new Set<string>([
  "covid-startup-checklist",
  "quality-observations",
  "observation-ageing",
  "quality-score",
  "quality-mis",
  "crs-checklist-tracking",
  "project-locations",
  "ims-audit-report",
  "project-role-matrix",
  "workforce-tracking",
  "projects",
  "myzone-installation-status",
  "communication-matrix",
  "brsr",
  "status-tracking-details",
]);

export default async function FieldReportScaffoldPage({
  params,
}: {
  params: Promise<{ reportKey: string }>;
}) {
  const { reportKey } = await params;
  if (!REPORT_KEYS.has(reportKey)) notFound();

  const link = getFieldReportLink(reportKey as FieldReportKey);
  if (!link || link.status !== "scaffold") notFound();

  const role = await resolveFieldRole();
  if (!canFieldAction(role, link.fieldAction)) return <FieldForbidden />;

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title={link.label}
        subtitle="This report is not yet available in the field app."
      />
      <FieldCard>
        <p className="rounded-md bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Coming soon
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {link.label} will be added to the field experience in a future release. Use the desktop
          portal for full filters, exports, and analytics in the meantime.
        </p>
        {link.nextSteps ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold">Next:</span> {link.nextSteps}
          </p>
        ) : null}
        {link.webHref ? (
          <Link
            href={link.webHref}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--raksha-blue-dark)] hover:underline"
          >
            Open on desktop
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </FieldCard>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/field/reports" className={`${fieldSecondaryBtnClass} sm:flex-1`}>
          Back to Raksha Reports
        </Link>
        {link.webHref ? (
          <Link href={link.webHref} className={`${fieldPrimaryBtnClass} sm:flex-1`}>
            Open desktop report
          </Link>
        ) : null}
      </div>
    </div>
  );
}
