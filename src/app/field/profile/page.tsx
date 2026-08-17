import { requireOrgContext } from "@/lib/auth/org-context";
import { signOutAction } from "@/app/actions/auth";
import { FieldPageHeader } from "@/components/field/field-ui";
import { Button } from "@/components/ui/button";

export default async function FieldProfilePage() {
  const { user, profile, organization } = await requireOrgContext();

  return (
    <div className="space-y-4">
      <FieldPageHeader title="Profile" subtitle="Field session for this organization only." />
      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">{profile?.full_name || user.email}</p>
        <p className="mt-1 text-muted-foreground">{user.email}</p>
        <p className="mt-3 text-muted-foreground">Organization</p>
        <p className="font-medium">{organization.name}</p>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="min-h-12 w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
