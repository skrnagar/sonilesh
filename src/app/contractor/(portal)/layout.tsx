import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import { isContractorPortalOnly } from "@/lib/auth/personas";
import { signOutAction } from "@/app/actions/auth";

export default async function ContractorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, organization, supabase } = await requireOrgContext();
  const { roleCodes } = await getRoleCodesForUser(supabase, user.id, organization.id);

  if (organization.status === "suspended") redirect("/contractor/login");

  const { data: member } = await supabase
    .from("organization_members")
    .select("contractor_company_id")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member?.contractor_company_id) {
    if (!isContractorPortalOnly(roleCodes) && !profile?.is_platform_admin) {
      redirect("/app/contractors");
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <BrandLockup chrome size="sm" />
            <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
              Contractor portal · {organization.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/contractor">Home</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/contractor/documents">Documents</Link>
            </Button>
            <ThemeToggle compact />
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
