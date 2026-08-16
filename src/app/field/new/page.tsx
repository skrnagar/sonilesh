import Link from "next/link";
import { AlertTriangle, ScanSearch, ShieldAlert } from "lucide-react";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { FIELD_LABELS } from "@/lib/field/labels";
import { FieldActionLink, FieldPageHeader } from "@/components/field/field-ui";
import { ForbiddenState } from "@/components/shared/state-panels";

export default async function FieldNewPage() {
  const { supabase, membershipId } = await requireOrgContext();
  const role = await resolveFieldRole(supabase, membershipId);
  const items = [
    {
      action: "report_incident" as const,
      href: "/field/incident",
      label: FIELD_LABELS.incident.short,
      hint: FIELD_LABELS.incident.subtitle,
      icon: AlertTriangle,
      tone: "red" as const,
    },
    {
      action: "report_near_miss" as const,
      href: "/field/near-miss",
      label: FIELD_LABELS.nearMiss.short,
      hint: FIELD_LABELS.nearMiss.subtitle,
      icon: ShieldAlert,
      tone: "amber" as const,
    },
    {
      action: "report_hazard" as const,
      href: "/field/lmra",
      label: FIELD_LABELS.lmra.short,
      hint: FIELD_LABELS.lmra.subtitle,
      icon: ScanSearch,
      tone: "navy" as const,
    },
  ].filter((i) => canFieldAction(role, i.action));

  if (!items.length) return <ForbiddenState />;

  return (
    <div className="space-y-4">
      <FieldPageHeader title="New" subtitle="Incident, near miss, or LMRA — camera and GPS first." />
      <div className="grid grid-cols-1 gap-2.5">
        {items.map((i) => (
          <FieldActionLink key={i.href} href={i.href} label={i.label} hint={i.hint} icon={i.icon} tone={i.tone} />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        <Link href="/field" className="underline-offset-2 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
