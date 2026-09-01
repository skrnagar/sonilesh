import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { UaucWorkflowBar } from "@/components/events/uauc-workflow-bar";
import { StatusPill } from "@/components/modules/records-table";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listEventsByType } from "@/lib/events/queries";
import { getUserPermissions } from "@/lib/services/rbac";
import { formatDate } from "@/lib/utils";

export default async function ObservationsPage() {
  const access = await requireModuleAccess({
    featureCode: "hazard_reporting",
    permission: "hazards.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Observations" />;
  if (!access.permitted) return <ForbiddenState />;

  const [unsafeActs, unsafeConditions, observations, permissions, membersRes] = await Promise.all([
    listEventsByType(access.supabase, access.organization.id, "unsafe_act"),
    listEventsByType(access.supabase, access.organization.id, "unsafe_condition"),
    listEventsByType(access.supabase, access.organization.id, "safety_observation"),
    getUserPermissions(access.supabase, access.organization.id, access.user.id),
    access.supabase
      .from("organization_members")
      .select("user_id, profiles:user_id(id, full_name, email)")
      .eq("organization_id", access.organization.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(50),
  ]);

  const rows = [...unsafeActs, ...unsafeConditions, ...observations].sort(
    (a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at),
  );

  const assignees = (membersRes.data ?? []).map((m) => {
    const p = m.profiles as { id?: string; full_name?: string; email?: string } | null;
    return {
      id: p?.id ?? m.user_id,
      name: p?.full_name || p?.email || "Member",
    };
  });

  const uaucOpen = rows.filter(
    (r) =>
      (r.event_types as { code?: string } | null)?.code === "unsafe_act" ||
      (r.event_types as { code?: string } | null)?.code === "unsafe_condition",
  ).filter((r) => !["closed", "cancelled"].includes(r.status));

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "UA / UC" }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">UA / UC observations</h1>
          <p className="text-sm text-muted-foreground">
            Unsafe acts, unsafe conditions, and safety observations.
          </p>
        </div>
        <Link
          href="/app/reports/new"
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          New report
        </Link>
      </div>

      {uaucOpen.length && permissions.some((p) => p.startsWith("hazards.")) ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Open UA/UC workflow queue</h2>
          {uaucOpen.slice(0, 5).map((row) => (
            <UaucWorkflowBar
              key={row.id}
              eventId={row.id}
              organizationId={access.organization.id}
              status={row.status}
              uaucStage={(row as { uauc_stage?: string }).uauc_stage}
              typeCode={(row.event_types as { code?: string } | null)?.code}
              assignees={assignees}
              permissions={permissions}
            />
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Number</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Occurred</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link href={`/app/incidents/${row.id}`} className="font-medium text-accent hover:underline">
                    {row.event_number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {(row.event_types as { name?: string } | null)?.name ?? "—"}
                </td>
                <td className="max-w-xs truncate px-4 py-3">{row.title || "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill value={row.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(row.occurred_at)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No observations yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
