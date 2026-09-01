import Link from "next/link";
import { createSiteVisitAction } from "@/app/actions/enterprise";
import { ActionForm } from "@/components/shared/action-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleShell } from "@/components/modules/module-shell";
import { StatusPill } from "@/components/modules/records-table";
import { EmptyState } from "@/components/shared/state-panels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getUserPermissions } from "@/lib/services/rbac";
import { listSiteVisits } from "@/lib/services/site-visits";
import { formatDate } from "@/lib/utils";

const VISIT_TYPES = [
  { code: "hsv" as const, label: "Head Safety Visit (HSV)", permission: "visits.hsv.create" },
  { code: "rsv" as const, label: "Regional Safety Visit (RSV)", permission: "visits.rsv.create" },
  { code: "tsv" as const, label: "Team Safety Visit (TSV)", permission: "visits.tsv.create" },
];

export default async function SiteVisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const access = await requireModuleAccess({ permission: "visits.view" });
  const visitType = params.type as "hsv" | "rsv" | "tsv" | undefined;

  const [permissions, rows] = await Promise.all([
    getUserPermissions(access.supabase, access.organization.id, access.user.id),
    access.permitted
      ? listSiteVisits(access.supabase, access.organization.id, { visitType })
      : Promise.resolve([]),
  ]);

  const creatableTypes = VISIT_TYPES.filter((t) => permissions.includes(t.permission));
  const sites = access.sites;

  return (
    <ModuleShell
      title="Site visits"
      description="HSV, RSV, and TSV programs with role-gated creation."
      permission="visits.view"
    >
      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Site visits" }]} className="mb-4" />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant={!params.type ? "default" : "outline"} size="sm">
          <Link href="/app/site-visits">All</Link>
        </Button>
        {VISIT_TYPES.map((t) => (
          <Button
            key={t.code}
            asChild
            variant={params.type === t.code ? "default" : "outline"}
            size="sm"
          >
            <Link href={`/app/site-visits?type=${t.code}`}>{t.code.toUpperCase()}</Link>
          </Button>
        ))}
      </div>

      {creatableTypes.length ? (
        <ActionForm
          action={createSiteVisitAction}
          className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2"
        >
          <div className="space-y-1 md:col-span-2">
            <h2 className="text-sm font-semibold">Record a site visit</h2>
          </div>
          <div className="space-y-1">
            <Label htmlFor="visitType">Visit type</Label>
            <select
              id="visitType"
              name="visitType"
              defaultValue={params.type ?? creatableTypes[0]?.code ?? "tsv"}
              className="flex h-10 w-full rounded-md border border-border bg-card px-2 text-sm"
            >
              {creatableTypes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="siteId">Site</Label>
            <select
              id="siteId"
              name="siteId"
              className="flex h-10 w-full rounded-md border border-border bg-card px-2 text-sm"
            >
              <option value="">Select site</option>
              {(sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" name="summary" required rows={2} placeholder="Visit findings and actions" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" name="submit" value="true">
              Submit visit
            </Button>
          </div>
        </ActionForm>
      ) : null}

      {rows.length ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">
                  {row.visit_number}{" "}
                  <span className="text-muted-foreground">· {row.visit_type.toUpperCase()}</span>
                </p>
                <p className="truncate text-muted-foreground">{row.summary || "No summary"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(row.visit_date)}</span>
                <StatusPill value={row.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No site visits yet"
          description="Create HSV, RSV, or TSV records when your role permits. Visit workflow supports allocate and final closure in future phases."
        />
      )}
    </ModuleShell>
  );
}
