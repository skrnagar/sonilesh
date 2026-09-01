import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import {
  FieldCard,
  FieldForbidden,
  FieldPageHeader,
  fieldPrimaryBtnClass,
} from "@/components/field/field-ui";

export default async function FieldBbsPage() {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "bbs")) return <FieldForbidden />;

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="BBS"
        subtitle="Behaviour-based safety observations — positive and improvement."
      />
      <FieldCard>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Record a safety observation from the field. Attach a photo, note polarity (positive or
          needs improvement), and submit for Safety Officer review.
        </p>
        <Link
          href="/field/hazard?type=safety_observation"
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--mkt-safety)] px-4 py-3 text-sm font-semibold text-[var(--mkt-safety-ink)] shadow-[var(--shadow-md)]"
        >
          <ThumbsUp className="h-4 w-4" />
          New BBS observation
        </Link>
      </FieldCard>
      <Link href="/field" className={`${fieldPrimaryBtnClass} block text-center`}>
        Back to home
      </Link>
    </div>
  );
}
