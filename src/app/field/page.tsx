import { Suspense } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  MapPin,
  ScanSearch,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";
import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction, greetingForNow, type FieldAction } from "@/lib/auth/field-roles";
import { permitCountdown } from "@/lib/field/permit-countdown";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { FIELD_LABELS, fieldEventLabel } from "@/lib/field/labels";
import {
  FieldActionLink,
  FieldEmpty,
  FieldRow,
  FieldSection,
  FieldSectionSkeleton,
} from "@/components/field/field-ui";

export default async function FieldHomePage() {
  const { supabase, profile, organization, membershipId, sites, projects, siteId, projectId } =
    await requireOrgContext();
  const orgId = organization.id;

  const role = await resolveFieldRole(supabase, membershipId);
  const siteName =
    sites.find((s) => s.id === siteId)?.name ?? sites[0]?.name ?? "Unassigned site";
  const projectName =
    projects.find((p) => p.id === projectId)?.name ??
    projects.find((p) => ("site_id" in p ? p.site_id === siteId : false))?.name ??
    projects[0]?.name ??
    "—";

  const quickAll: Array<{
    action: FieldAction;
    href: string;
    label: string;
    hint?: string;
    tone: "navy" | "green" | "amber" | "red";
    icon: typeof AlertTriangle;
    wide?: boolean;
    prefetch?: boolean;
  }> = [
    {
      action: "report_incident",
      href: "/field/incident",
      label: FIELD_LABELS.incident.short,
      hint: "Injury, damage, or loss",
      tone: "red",
      icon: AlertTriangle,
      wide: true,
      prefetch: true,
    },
    {
      action: "report_near_miss",
      href: "/field/near-miss",
      label: FIELD_LABELS.nearMiss.short,
      hint: "Close call",
      tone: "amber",
      icon: ShieldAlert,
    },
    {
      action: "report_hazard",
      href: "/field/hazard?type=unsafe_act",
      label: "UA / UC",
      hint: "Unsafe act or condition",
      tone: "amber",
      icon: ShieldAlert,
    },
    {
      action: "report_hazard",
      href: "/field/lmra",
      label: FIELD_LABELS.lmra.short,
      hint: "Last-minute risk",
      tone: "navy",
      icon: ScanSearch,
    },
    {
      action: "site_visit",
      href: "/field/site-visits",
      label: FIELD_LABELS.siteVisits.short,
      hint: "HSV / RSV / TSV",
      tone: "green",
      icon: MapPin,
    },
    {
      action: "inspection",
      href: "/field/inspection",
      label: FIELD_LABELS.inspection.short,
      tone: "navy",
      icon: ClipboardCheck,
    },
    {
      action: "my_actions",
      href: "/field/actions",
      label: FIELD_LABELS.actions.short,
      tone: "green",
      icon: ListChecks,
    },
    {
      action: "my_permits",
      href: "/field/permits",
      label: FIELD_LABELS.permits.short,
      tone: "navy",
      icon: Shield,
    },
    {
      action: "training",
      href: "/field/training",
      label: FIELD_LABELS.training.short,
      tone: "green",
      icon: GraduationCap,
    },
    {
      action: "toolbox",
      href: "/field/toolbox",
      label: FIELD_LABELS.toolbox.short,
      tone: "amber",
      icon: Users,
    },
  ];
  const quick = quickAll.filter((q) => canFieldAction(role, q.action));

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-sm)]">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--mkt-safety)]">
          {greetingForNow()}
        </p>
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground [font-family:var(--font-sans-face),ui-sans-serif,system-ui,sans-serif]">
          {profile?.full_name?.split(" ")[0] || "Field user"}
        </h1>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {siteName} · {projectName}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        {quick.map((q) => (
          <FieldActionLink
            key={q.href}
            href={q.href}
            label={q.label}
            hint={q.hint}
            icon={q.icon}
            tone={q.tone}
            wide={q.wide}
            prefetch={q.prefetch}
          />
        ))}
      </section>

      <Suspense fallback={<FieldSectionSkeleton title="Pending actions" />}>
        <HomeActions orgId={orgId} />
      </Suspense>
      <Suspense fallback={<FieldSectionSkeleton title="Permits" />}>
        <HomePermits orgId={orgId} />
      </Suspense>
      <Suspense fallback={<FieldSectionSkeleton title="Training" />}>
        <HomeTraining orgId={orgId} />
      </Suspense>
      <Suspense fallback={<FieldSectionSkeleton title="Recent items" />}>
        <HomeRecent orgId={orgId} />
      </Suspense>
    </div>
  );
}

async function HomeActions({ orgId }: { orgId: string }) {
  const { supabase, user } = await requireOrgContext();
  const { data: actions } = await supabase
    .from("action_items")
    .select("id, title, status, due_date")
    .eq("organization_id", orgId)
    .eq("owner_id", user.id)
    .in("status", ["open", "in_progress"])
    .is("deleted_at", null)
    .limit(5);

  return (
    <FieldSection title="Pending actions">
      {(actions ?? []).length ? (
        (actions ?? []).map((a) => (
          <FieldRow
            key={a.id}
            href="/field/actions"
            title={a.title}
            meta={`${a.status} · due ${a.due_date ?? "—"}`}
          />
        ))
      ) : (
        <FieldEmpty text="No pending actions" />
      )}
    </FieldSection>
  );
}

async function HomePermits({ orgId }: { orgId: string }) {
  const { supabase, user } = await requireOrgContext();
  const { data: permits } = await supabase
    .from("permits")
    .select("id, permit_number, title, status, valid_to")
    .eq("organization_id", orgId)
    .or(`requester_id.eq.${user.id},issuer_id.eq.${user.id}`)
    .in("status", ["active", "authorization", "requested"])
    .is("deleted_at", null)
    .limit(5);

  return (
    <FieldSection title="Permits">
      {(permits ?? []).length ? (
        (permits ?? []).map((p) => {
          const c = permitCountdown(p.valid_to);
          return (
            <FieldRow
              key={p.id}
              href="/field/permits"
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
        <FieldEmpty text="No active permits" />
      )}
    </FieldSection>
  );
}

async function HomeTraining({ orgId }: { orgId: string }) {
  const { supabase, user } = await requireOrgContext();
  const { data: training } = await supabase
    .from("training_assignments")
    .select("id, status, due_date, training_courses:course_id(title)")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .in("status", ["assigned", "in_progress"])
    .is("deleted_at", null)
    .limit(5);

  return (
    <FieldSection title="Training">
      {(training ?? []).length ? (
        (training ?? []).map((t) => {
          const course = t.training_courses as { title?: string } | null;
          return (
            <FieldRow
              key={t.id}
              href="/field/training"
              title={course?.title || "Training assignment"}
              meta={`${t.status} · due ${t.due_date ?? "—"}`}
            />
          );
        })
      ) : (
        <FieldEmpty text="No assigned training" />
      )}
    </FieldSection>
  );
}

async function HomeRecent({ orgId }: { orgId: string }) {
  const { supabase, user } = await requireOrgContext();
  const { data: recent } = await supabase
    .from("ehs_events")
    .select("id, event_number, title, status, occurred_at, event_types:event_type_id(code)")
    .eq("organization_id", orgId)
    .eq("reporter_id", user.id)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(5);

  return (
    <FieldSection title="Recent items">
      {(recent ?? []).length ? (
        (recent ?? []).map((e) => {
          const code = (e.event_types as { code?: string } | null)?.code;
          return (
            <FieldRow
              key={e.id}
              title={e.title || e.event_number}
              meta={`${fieldEventLabel(code)} · ${e.status} · ${new Date(e.occurred_at).toLocaleString()}`}
            />
          );
        })
      ) : (
        <FieldEmpty text="Nothing submitted yet" />
      )}
    </FieldSection>
  );
}
