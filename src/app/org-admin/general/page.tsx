import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateOrgGeneralAction } from "@/app/actions/org-admin";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants/organization";

export default async function OrgAdminGeneralPage() {
  const access = await requireOrgAdminAccess();
  const { data: org } = await access.supabase
    .from("organizations")
    .select("*")
    .eq("id", access.organization.id)
    .single();

  const appHost =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "app.ehs360.com";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">General</h1>
        <p className="text-sm text-muted-foreground">
          Company profile, slug, and custom domain for your tenant.
        </p>
      </div>

      <ActionForm
        action={updateOrgGeneralAction}
        className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company name" id="name">
            <Input id="name" name="name" defaultValue={org?.name ?? ""} required />
          </Field>
          <Field label="Legal name" id="legalName">
            <Input id="legalName" name="legalName" defaultValue={org?.legal_name ?? ""} />
          </Field>
          <Field label="Slug" id="slug">
            <Input id="slug" name="slug" defaultValue={org?.slug ?? ""} />
          </Field>
          <Field label="Custom domain" id="customDomain">
            <Input id="customDomain" name="customDomain" defaultValue={org?.custom_domain ?? ""} />
          </Field>
          <Field label="Industry" id="industry">
            <Select id="industry" name="industry" defaultValue={org?.industry ?? ""}>
              <option value="">Select</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Company size" id="companySize">
            <Select id="companySize" name="companySize" defaultValue={org?.company_size ?? ""}>
              <option value="">Select</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Website" id="website">
            <Input id="website" name="website" defaultValue={org?.website ?? ""} />
          </Field>
          <Field label="Country" id="country">
            <Input id="country" name="country" defaultValue={org?.country ?? ""} />
          </Field>
          <Field label="State" id="state">
            <Input id="state" name="state" defaultValue={org?.state ?? ""} />
          </Field>
          <Field label="City" id="city">
            <Input id="city" name="city" defaultValue={org?.city ?? ""} />
          </Field>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">DNS setup</p>
          <p className="mt-1">
            Point a <code className="text-xs">CNAME</code> for your custom domain to{" "}
            <code className="text-xs">{appHost}</code>. SSL is provisioned once DNS propagates.
          </p>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Save changes
        </button>
      </ActionForm>

      <p className="text-sm text-muted-foreground">
        Advanced regional, hierarchy, and security settings:{" "}
        <Link className="underline" href="/app/settings/organization/configure">
          configuration
        </Link>
        . Structure:{" "}
        <Link className="underline" href="/app/settings/organization/structure">
          visual tree
        </Link>
        .
      </p>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
