import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { canFieldAction, type FieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import {
  FieldCard,
  FieldForbidden,
  FieldPageHeader,
  fieldPrimaryBtnClass,
} from "@/components/field/field-ui";

export function FieldScaffoldPage({
  title,
  subtitle,
  action,
  body,
  webHref,
  webLabel = "Open on desktop",
}: {
  title: string;
  subtitle: string;
  action: FieldAction;
  body: string;
  webHref?: string;
  webLabel?: string;
}) {
  return (
    <ScaffoldGate action={action}>
      <div className="space-y-4">
        <FieldPageHeader title={title} subtitle={subtitle} />
        <FieldCard>
          <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
          {webHref ? (
            <Link
              href={webHref}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--raksha-blue-dark)] hover:underline"
            >
              {webLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </FieldCard>
        <Link href="/field" className={`${fieldPrimaryBtnClass} block text-center`}>
          Back to home
        </Link>
      </div>
    </ScaffoldGate>
  );
}

async function ScaffoldGate({
  action,
  children,
}: {
  action: FieldAction;
  children: React.ReactNode;
}) {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, action)) return <FieldForbidden />;
  return children;
}
