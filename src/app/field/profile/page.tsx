import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/org-context";
import { signOutAction } from "@/app/actions/auth";
import { FieldPageHeader, FieldCard, fieldSecondaryBtnClass } from "@/components/field/field-ui";
import { FieldThemeSettings } from "@/components/field/field-theme-settings";

export default async function FieldProfilePage() {
  const { user, profile, organization } = await requireOrgContext();

  return (
    <div className="space-y-4">
      <FieldPageHeader title="Profile" subtitle="Field session for this organization only." />
      <FieldCard className="space-y-1 text-sm">
        <p className="font-medium text-foreground">{profile?.full_name || user.email}</p>
        <p className="text-muted-foreground">{user.email}</p>
        <p className="pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Organization
        </p>
        <p className="font-medium text-foreground">{organization.name}</p>
      </FieldCard>
      <Link href="/field/ai" className={fieldSecondaryBtnClass}>
        Field Copilot (my records)
      </Link>
      <FieldCard>
        <FieldThemeSettings />
      </FieldCard>
      <form action={signOutAction}>
        <button type="submit" className={fieldSecondaryBtnClass}>
          Sign out
        </button>
      </form>
    </div>
  );
}
