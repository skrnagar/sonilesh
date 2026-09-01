import Link from "next/link";
import { createFieldSiteVisitAction } from "@/app/actions/field";
import {
  FieldCard,
  FieldEmpty,
  FieldForbidden,
  FieldPageHeader,
  FieldRow,
  fieldControlClass,
  fieldPrimaryBtnClass,
} from "@/components/field/field-ui";
import { FieldSubmitForm } from "@/components/field/field-submit-form";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { FIELD_LABELS } from "@/lib/field/labels";
import { getUserPermissions } from "@/lib/services/rbac";
import { listSiteVisits } from "@/lib/services/site-visits";
import { formatDate } from "@/lib/utils";

const VISIT_TYPES = [
  { code: "hsv" as const, label: "Head Safety Visit (HSV)", permission: "visits.hsv.create" },
  { code: "rsv" as const, label: "Regional Safety Visit (RSV)", permission: "visits.rsv.create" },
  { code: "tsv" as const, label: "Team Safety Visit (TSV)", permission: "visits.tsv.create" },
];

export default async function FieldSiteVisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const access = await requireOrgContext();
  const role = await resolveFieldRole(access.supabase, access.membershipId);
  if (!canFieldAction(role, "site_visit")) return <FieldForbidden />;

  const visitType = ["hsv", "rsv", "tsv"].includes(params.type ?? "")
    ? (params.type as "hsv" | "rsv" | "tsv")
    : undefined;

  const [permissions, rows] = await Promise.all([
    getUserPermissions(access.supabase, access.organization.id, access.user.id),
    listSiteVisits(access.supabase, access.organization.id, { visitType }),
  ]);

  const creatableTypes = VISIT_TYPES.filter((t) => permissions.includes(t.permission));
  const sites = access.sites;

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title={FIELD_LABELS.siteVisits.title}
        subtitle={FIELD_LABELS.siteVisits.subtitle}
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/field/site-visits"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !visitType ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          All
        </Link>
        {VISIT_TYPES.map((t) => (
          <Link
            key={t.code}
            href={`/field/site-visits?type=${t.code}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              visitType === t.code ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {t.code.toUpperCase()}
          </Link>
        ))}
      </div>

      {creatableTypes.length ? (
        <FieldCard>
          <p className="mb-3 text-sm font-semibold text-foreground">Record a site visit</p>
          <FieldSubmitForm action={createFieldSiteVisitAction} submitLabel="Submit visit">
            <input type="hidden" name="submit" value="true" />
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Visit type
              </span>
              <select
                name="visitType"
                defaultValue={visitType ?? creatableTypes[0]?.code ?? "tsv"}
                className={fieldControlClass}
              >
                {creatableTypes.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Site
              </span>
              <select
                name="siteId"
                defaultValue={access.siteId ?? ""}
                className={fieldControlClass}
              >
                <option value="">Select site</option>
                {(sites ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Summary
              </span>
              <textarea
                name="summary"
                required
                minLength={8}
                rows={3}
                placeholder="Visit findings and actions"
                className={fieldControlClass}
              />
            </label>
          </FieldSubmitForm>
        </FieldCard>
      ) : (
        <FieldEmpty text="Your role cannot create site visits. You can still open visits assigned to you." />
      )}

      {rows.length ? (
        <div className="space-y-2">
          {rows.map((row) => (
            <FieldRow
              key={row.id}
              href={`/field/site-visits/${row.id}`}
              title={`${row.visit_number} · ${row.visit_type.toUpperCase()}`}
              meta={`${row.summary || "No summary"} · ${formatDate(row.visit_date)} · ${String(row.status).replaceAll("_", " ")}`}
            />
          ))}
        </div>
      ) : (
        <FieldEmpty text="No site visits yet. Submit HSV, RSV, or TSV when your role permits." />
      )}

      <Link href="/field" className={`${fieldPrimaryBtnClass} block text-center`}>
        Back to home
      </Link>
    </div>
  );
}
