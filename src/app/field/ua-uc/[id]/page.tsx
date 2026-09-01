import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FieldCard,
  FieldForbidden,
  FieldPageHeader,
  fieldSecondaryBtnClass,
} from "@/components/field/field-ui";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import {
  formatQualityObservationDate,
  getQualityObservationById,
} from "@/lib/services/quality-observations";
import { getUaucEventDetail } from "@/lib/services/uauc-list";
import { formatDateTime } from "@/lib/utils";

function UaucStatusPill({ label }: { label: string }) {
  const open = label === "Open";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
        open ? "bg-teal-600 text-white" : "border border-border bg-muted text-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-[var(--raksha-blue)]">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default async function FieldUaucDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await resolveFieldRole();
  const canView =
    canFieldAction(role, "report_hazard") || canFieldAction(role, "raksha_reports");
  if (!canView) return <FieldForbidden />;

  const access = await requireOrgContext();
  const detail = await getUaucEventDetail(access.supabase, access.organization.id, id);
  if (!detail) {
    const qualityDetail = await getQualityObservationById(
      access.supabase,
      access.organization.id,
      id,
    );
    if (!qualityDetail) notFound();

    return (
      <div className="space-y-4">
        <FieldPageHeader title={qualityDetail.eventNumber} />

        <FieldCard>
          <dl className="grid gap-4 sm:grid-cols-3">
            <DetailField label="SBU" value={qualityDetail.businessUnitName ?? "—"} />
            <DetailField label="Region" value={qualityDetail.regionName ?? "—"} />
            <DetailField label="Project" value={qualityDetail.projectName ?? "—"} />
            <DetailField label="Category" value={qualityDetail.categoryName ?? "—"} />
            <DetailField label="Subcategory" value={qualityDetail.subcategoryName ?? "—"} />
            <DetailField label="Location No" value={qualityDetail.locationNo ?? "—"} />
          </dl>

          <div className="mt-4">
            <DetailField label="Description" value={qualityDetail.description} />
          </div>

          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <DetailField label="Reported By" value={qualityDetail.reportedByName} />
            <DetailField
              label="Created On"
              value={formatQualityObservationDate(qualityDetail.createdOn) || "—"}
            />
            <div>
              <dt className="text-xs font-semibold text-[var(--raksha-blue)]">Status</dt>
              <dd className="mt-1">
                <UaucStatusPill label={qualityDetail.statusLabel} />
              </dd>
            </div>
            <DetailField label="Closed By" value={qualityDetail.closedByName ?? "—"} />
            <DetailField
              label="Closed On"
              value={formatQualityObservationDate(qualityDetail.closedOn) || "—"}
            />
          </dl>
        </FieldCard>

        <div className="flex justify-end">
          <Link
            href="/field/reports/quality-observations"
            className={`${fieldSecondaryBtnClass} w-auto px-8`}
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FieldPageHeader title={detail.eventNumber} />

      <FieldCard>
        <dl className="grid gap-4 sm:grid-cols-3">
          <DetailField label="Business Unit" value={detail.businessUnitName ?? "—"} />
          <DetailField label="Region" value={detail.regionName ?? "—"} />
          <DetailField label="Project" value={detail.projectName ?? "—"} />
          <DetailField label="Incident Type" value={detail.incidentTypeLabel} />
          <DetailField label="Category" value={detail.categoryName ?? "—"} />
          <DetailField label="Subcategory" value={detail.subcategoryName ?? "—"} />
        </dl>

        <div className="mt-4">
          <DetailField label="Incident Description" value={detail.description} />
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailField label="Incident Date Time" value={formatDateTime(detail.occurredAt)} />
          <DetailField label="Location" value={detail.locationText ?? "—"} />
        </dl>

        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <DetailField label="Reported On" value={formatDateTime(detail.reportedAt)} />
          <DetailField label="Reported By" value={detail.createdByName} />
          <div>
            <dt className="text-xs font-semibold text-[var(--raksha-blue)]">Incident Status</dt>
            <dd className="mt-1">
              <UaucStatusPill label={detail.statusLabel} />
            </dd>
          </div>
        </dl>

        {detail.actionItems.length ? (
          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Action items</h2>
            <ul className="space-y-2">
              {detail.actionItems.map((item) => (
                <li key={item.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <Link href="/field/actions" className="font-medium text-[var(--raksha-blue)] hover:underline">
                    {item.title || "Action item"}
                  </Link>
                  <span className="ml-2 text-xs capitalize text-muted-foreground">
                    {String(item.status).replaceAll("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </FieldCard>

      <div className="flex justify-end">
        <Link href="/field/ualist" className={`${fieldSecondaryBtnClass} w-auto px-8`}>
          Back
        </Link>
      </div>
    </div>
  );
}
