import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  ScanSearch,
  Shield,
  ShieldAlert,
  ThumbsUp,
} from "lucide-react";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { FieldActionLink, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";

export default async function FieldReportHubPage() {
  const role = await resolveFieldRole();

  const items = [
    {
      action: "report_incident" as const,
      href: "/field/incident",
      label: "Incident",
      hint: "Injury, damage, environmental",
      icon: AlertTriangle,
      tone: "red" as const,
      prefetch: true,
    },
    {
      action: "report_near_miss" as const,
      href: "/field/near-miss",
      label: "Near Miss",
      hint: "Almost happened",
      icon: ShieldAlert,
      tone: "amber" as const,
    },
    {
      action: "report_hazard" as const,
      href: "/field/hazard?type=hazard",
      label: "Hazard",
      hint: "Hazard to control",
      icon: ScanSearch,
      tone: "navy" as const,
    },
    {
      action: "report_hazard" as const,
      href: "/field/hazard?type=unsafe_act",
      label: "Unsafe Act",
      hint: "Behaviour observation",
      icon: Eye,
      tone: "navy" as const,
    },
    {
      action: "report_hazard" as const,
      href: "/field/hazard?type=unsafe_condition",
      label: "Unsafe Condition",
      hint: "Condition observation",
      icon: Shield,
      tone: "navy" as const,
    },
    {
      action: "report_hazard" as const,
      href: "/field/hazard?type=safety_observation",
      label: "Safety Observation",
      hint: "Positive or improvement",
      icon: ThumbsUp,
      tone: "amber" as const,
    },
  ].filter((i) => canFieldAction(role, i.action));

  if (!items.length) return <FieldForbidden />;

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="What happened?"
        subtitle="Photo → location → short description → submit. Same backend as desktop."
      />
      <div className="grid grid-cols-1 gap-2.5">
        {items.map((i) => (
          <FieldActionLink
            key={i.href}
            href={i.href}
            label={i.label}
            hint={i.hint}
            icon={i.icon}
            tone={i.tone}
            prefetch={i.prefetch}
          />
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
