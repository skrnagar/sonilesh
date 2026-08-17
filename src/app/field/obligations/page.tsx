import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/org-context";
import { FieldEmpty, FieldPageHeader, FieldSection } from "@/components/field/field-ui";
import { hasFeature } from "@/lib/services/entitlements";

export default async function FieldObligationsPage() {
  const { supabase, user, organization } = await requireOrgContext();
  const entitled = await hasFeature(supabase, organization.id, "regulatory_compliance");
  if (!entitled) {
    return (
      <div className="space-y-4">
        <FieldPageHeader title="My obligations" subtitle="Regulatory filings assigned to you." />
        <FieldEmpty text="Regulatory compliance is not enabled for this organization." />
      </div>
    );
  }

  const { data: owned } = await supabase
    .from("org_applicable_compliances")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("owner_id", user.id);

  const ownedIds = (owned ?? []).map((row) => row.id);
  const { data: tasks } = ownedIds.length
    ? await supabase
        .from("compliance_task_instances")
        .select(
          "id, period_label, due_date, status, org_applicable_compliances(compliance_obligations(title))",
        )
        .eq("organization_id", organization.id)
        .in("org_applicable_compliance_id", ownedIds)
        .in("status", ["open", "in_progress", "overdue"])
        .order("due_date")
        .limit(50)
    : { data: [] as Array<{ id: string; period_label: string; due_date: string; status: string; org_applicable_compliances: { compliance_obligations: { title?: string } | null } | null }> };

  const { data: requirements } = await supabase
    .from("compliance_requirements")
    .select("id, title, status")
    .eq("organization_id", organization.id)
    .eq("owner_id", user.id)
    .in("status", ["open", "in_progress"])
    .limit(50);

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="My obligations"
        subtitle="Filings and requirements assigned to you. Not legal advice."
      />
      <FieldSection title="Filings">
        {(tasks ?? []).length ? (
          (tasks ?? []).map((task) => {
            const title =
              (task.org_applicable_compliances as { compliance_obligations?: { title?: string } | null } | null)
                ?.compliance_obligations?.title ?? "Filing";
            return (
              <Link
                key={task.id}
                href={`/app/compliance/tasks/${task.id}`}
                className="block rounded-xl border border-border bg-card px-4 py-3 text-sm"
              >
                <p className="font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.period_label} · due {task.due_date} · {task.status}
                </p>
              </Link>
            );
          })
        ) : (
          <FieldEmpty text="No open filings assigned to you." />
        )}
      </FieldSection>
      <FieldSection title="Requirements">
        {(requirements ?? []).length ? (
          (requirements ?? []).map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <p className="font-medium">{row.title}</p>
              <p className="text-xs text-muted-foreground">{row.status}</p>
            </div>
          ))
        ) : (
          <FieldEmpty text="No open requirements assigned to you." />
        )}
      </FieldSection>
    </div>
  );
}
