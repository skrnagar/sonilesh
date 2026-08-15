import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  canFieldAction,
  fieldRoleFromCodes,
  greetingForNow,
  type FieldAction,
} from "@/lib/auth/field-roles";
import { permitCountdown } from "@/lib/services/permits";

async function resolveFieldRole(
  supabase: SupabaseClient,
  membershipId: string,
) {
  const { data: memberRoles } = await supabase
    .from("member_roles")
    .select("roles:role_id(code)")
    .eq("member_id", membershipId)
    .is("deleted_at", null);

  const codes = (memberRoles ?? [])
    .map((mr) => (mr.roles as { code?: string } | null)?.code)
    .filter(Boolean) as string[];
  return fieldRoleFromCodes(codes);
}

export default async function FieldHomePage() {
  const { supabase, user, profile, organization, membershipId } =
    await requireOrgContext();
  const orgId = organization.id;
  const org = organization;

  const [role, { data: sites }, { data: projects }, lists] = await Promise.all([
    resolveFieldRole(supabase, membershipId),
    supabase
      .from("sites")
      .select("name")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .limit(1),
    supabase
      .from("projects")
      .select("name")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .limit(1),
    Promise.all([
      supabase
        .from("action_items")
        .select("id, title, status, due_date")
        .eq("organization_id", orgId)
        .eq("owner_id", user.id)
        .in("status", ["open", "in_progress"])
        .is("deleted_at", null)
        .limit(5),
      supabase
        .from("permits")
        .select("id, permit_number, title, status, valid_to")
        .eq("organization_id", orgId)
        .or(`requester_id.eq.${user.id},issuer_id.eq.${user.id}`)
        .in("status", ["active", "authorization", "requested"])
        .is("deleted_at", null)
        .limit(5),
      supabase
        .from("training_assignments")
        .select("id, status, due_date")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .in("status", ["assigned", "in_progress"])
        .is("deleted_at", null)
        .limit(5),
      supabase
        .from("ehs_events")
        .select("id, event_number, title, status, occurred_at")
        .eq("organization_id", orgId)
        .eq("reporter_id", user.id)
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .limit(5),
    ]),
  ]);

  const [
    { data: actions },
    { data: permits },
    { data: training },
    { data: recent },
  ] = lists;

  const quickAll: Array<{ action: FieldAction; href: string; label: string }> = [
    { action: "report_incident", href: "/field/report/incident", label: "+ REPORT INCIDENT" },
    { action: "report_near_miss", href: "/field/report/near-miss", label: "+ REPORT NEAR MISS" },
    { action: "report_hazard", href: "/field/report/hazard", label: "+ REPORT HAZARD" },
    { action: "inspection", href: "/field/inspection", label: "INSPECTION" },
    { action: "my_actions", href: "/field/actions", label: "MY ACTIONS" },
    { action: "my_permits", href: "/field/permits", label: "MY PERMITS" },
    { action: "training", href: "/field/training", label: "TRAINING" },
    { action: "toolbox", href: "/field/toolbox", label: "TOOLBOX TALK" },
  ];
  const quick = quickAll.filter((q) => canFieldAction(role, q.action));

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-teal-200/90">
          {greetingForNow()}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {profile?.full_name?.split(" ")[0] || "Field user"}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Site: {sites?.[0]?.name ?? "Unassigned"} · Project: {projects?.[0]?.name ?? "—"}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
          Role: {role.replaceAll("_", " ")} · Org: {org?.name}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-2.5">
        {quick.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="rounded-xl bg-[var(--mkt-safety)] px-4 py-4 text-center text-sm font-bold tracking-wide text-white shadow-[0_12px_28px_-12px_rgba(15,118,110,0.65)] transition-transform active:scale-[0.99] motion-reduce:transition-none"
          >
            {q.label}
          </Link>
        ))}
      </section>

      <Section title="My pending actions">
        {(actions ?? []).length ? (
          (actions ?? []).map((a) => (
            <Row key={a.id} title={a.title} meta={`${a.status} · due ${a.due_date ?? "—"}`} />
          ))
        ) : (
          <Empty text="No pending actions" />
        )}
      </Section>

      <Section title="My permits">
        {(permits ?? []).length ? (
          (permits ?? []).map((p) => {
            const c = permitCountdown(p.valid_to);
            return (
              <Row
                key={p.id}
                title={`${p.permit_number} · ${p.title}`}
                meta={
                  c
                    ? c.expired
                      ? "EXPIRED"
                      : `${p.status} · ${c.hours}h ${c.minutes}m left`
                    : p.status
                }
              />
            );
          })
        ) : (
          <Empty text="No active permits" />
        )}
      </Section>

      <Section title="My training">
        {(training ?? []).length ? (
          (training ?? []).map((t) => (
            <Row key={t.id} title={`Training ${t.id.slice(0, 8)}`} meta={`${t.status} · due ${t.due_date ?? "—"}`} />
          ))
        ) : (
          <Empty text="No assigned training" />
        )}
      </Section>

      <Section title="Recent reports">
        {(recent ?? []).length ? (
          (recent ?? []).map((e) => (
            <Row
              key={e.id}
              title={e.title || e.event_number}
              meta={`${e.status} · ${new Date(e.occurred_at).toLocaleString()}`}
            />
          ))
        ) : (
          <Empty text="No recent reports" />
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3.5 py-3.5">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs capitalize text-slate-400">{meta}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-white/10 px-3.5 py-4 text-sm text-slate-500">
      {text}
    </p>
  );
}
