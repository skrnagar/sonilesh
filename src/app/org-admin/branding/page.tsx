import { ActionForm } from "@/components/shared/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrgBrandingAction } from "@/app/actions/org-admin";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";

export default async function OrgAdminBrandingPage() {
  const access = await requireOrgAdminAccess();
  const [{ data: org }, { data: settings }] = await Promise.all([
    access.supabase.from("organizations").select("name, logo_url").eq("id", access.organization.id).single(),
    access.supabase
      .from("organization_settings")
      .select("branding")
      .eq("organization_id", access.organization.id)
      .maybeSingle(),
  ]);

  const branding = (settings?.branding ?? {}) as {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    terminology?: Record<string, string>;
  };
  const terminology = branding.terminology ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--text-app-title)] font-semibold tracking-tight">Branding</h1>
        <p className="text-sm text-muted-foreground">
          Tenant colors and terminology — scoped to your organization only.
        </p>
      </div>

      <ActionForm
        action={updateOrgBrandingAction}
        className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Logo URL" id="logoUrl">
            <Input
              id="logoUrl"
              name="logoUrl"
              defaultValue={branding.logoUrl ?? org?.logo_url ?? ""}
            />
          </Field>
          <Field label="Primary color" id="primaryColor">
            <Input
              id="primaryColor"
              name="primaryColor"
              placeholder="#0b3a53"
              defaultValue={branding.primaryColor ?? ""}
            />
          </Field>
          <Field label="Secondary color" id="secondaryColor">
            <Input
              id="secondaryColor"
              name="secondaryColor"
              defaultValue={branding.secondaryColor ?? ""}
            />
          </Field>
          <Field label="CAPA label" id="capaLabel">
            <Input id="capaLabel" name="capaLabel" defaultValue={terminology.capaLabel ?? "CAPA"} />
          </Field>
          <Field label="Incident label" id="incidentLabel">
            <Input
              id="incidentLabel"
              name="incidentLabel"
              defaultValue={terminology.incidentLabel ?? "Incident"}
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Colors must be hex (#RGB or #RRGGBB). Labels are plain text only.
        </p>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Save branding
        </button>
      </ActionForm>
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
