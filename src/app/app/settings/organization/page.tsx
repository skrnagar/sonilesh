import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState } from "@/components/shared/state-panels";
import { updateOrganizationProfileAction } from "@/app/actions/hierarchy";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants/organization";

const TABS = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "regional", label: "Regional" },
  { id: "hierarchy", label: "Hierarchy" },
  { id: "ehs", label: "EHS Configuration" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
] as const;

export default async function OrganizationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = TABS.some((t) => t.id === params.tab) ? params.tab! : "general";
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const { data: org } = await access.supabase
    .from("organizations")
    .select("*")
    .eq("id", access.organization.id)
    .single();

  const { data: settings } = await access.supabase
    .from("organization_settings")
    .select("*")
    .eq("organization_id", access.organization.id)
    .maybeSingle();

  const branding = (settings?.branding ?? {}) as {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  const hierarchy = (settings?.hierarchy_config ?? {}) as Record<string, boolean>;
  const notifications = (settings?.notification_config ?? {}) as Record<string, boolean>;
  const security = (settings?.security_config ?? {}) as {
    require_mfa_admins?: boolean;
    session_timeout_minutes?: number;
  };
  const risk = (settings?.risk_matrix ?? {}) as { enabled?: boolean; notes?: string };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Organization settings</h1>
        <p className="text-sm text-muted-foreground">
          Tenant branding and configuration never affect EHS360 marketing or other customers.
        </p>
      </div>
      <SettingsNav current="/app/settings/organization" />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/app/settings/organization?tab=${t.id}`}
            className={
              tab === t.id
                ? "rounded-lg bg-card px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-border"
                : "rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <ActionForm
        action={updateOrganizationProfileAction}
        className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <input type="hidden" name="section" value={tab} />

        {tab === "general" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name" id="name">
              <Input id="name" name="name" defaultValue={org?.name ?? ""} required />
            </Field>
            <Field label="Legal name" id="legalName">
              <Input id="legalName" name="legalName" defaultValue={org?.legal_name ?? ""} />
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
        ) : null}

        {tab === "branding" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name" id="name">
              <Input id="name" name="name" defaultValue={org?.name ?? ""} />
            </Field>
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
            <p className="md:col-span-2 text-xs text-muted-foreground">
              Applied as CSS variables in the authenticated workspace only. Marketing remains
              EHS360-branded.
            </p>
          </div>
        ) : null}

        {tab === "regional" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Country" id="country">
              <Input id="country" name="country" defaultValue={org?.country ?? ""} />
            </Field>
            <Field label="Timezone" id="timezone">
              <Input id="timezone" name="timezone" defaultValue={org?.timezone ?? "Asia/Kolkata"} />
            </Field>
            <Field label="Currency" id="currency">
              <Input id="currency" name="currency" defaultValue={org?.currency ?? "INR"} />
            </Field>
            <Field label="Language" id="language">
              <Input id="language" name="language" defaultValue={settings?.language ?? "en"} />
            </Field>
            <Field label="Date format" id="dateFormat">
              <Input
                id="dateFormat"
                name="dateFormat"
                defaultValue={settings?.date_format ?? "dd/MM/yyyy"}
              />
            </Field>
            <Field label="Time format" id="timeFormat">
              <Select id="timeFormat" name="timeFormat" defaultValue={settings?.time_format ?? "24h"}>
                <option value="24h">24-hour</option>
                <option value="12h">12-hour</option>
              </Select>
            </Field>
          </div>
        ) : null}

        {tab === "hierarchy" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enable only the levels your organization uses. All levels are optional except the
              organization itself.
            </p>
            {(
              [
                ["useBusinessUnits", "Business units", hierarchy.use_business_units !== false],
                ["useProjects", "Projects", hierarchy.use_projects !== false],
                ["useDepartments", "Departments", hierarchy.use_departments !== false],
                ["useLocations", "Locations", hierarchy.use_locations !== false],
              ] as const
            ).map(([name, label, checked]) => (
              <label key={name} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={name} defaultChecked={checked} />
                {label}
              </label>
            ))}
            <p className="text-sm">
              <Link className="underline" href="/app/settings/organization/structure">
                Open visual structure
              </Link>
            </p>
          </div>
        ) : null}

        {tab === "ehs" ? (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="riskMatrixEnabled" defaultChecked={risk.enabled !== false} />
              Enable risk matrix defaults
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allowAnonymous"
                defaultChecked={Boolean(settings?.allow_anonymous_reporting)}
              />
              Allow anonymous reporting
            </label>
            <Field label="EHS notes" id="ehsNotes">
              <Input id="ehsNotes" name="ehsNotes" defaultValue={risk.notes ?? ""} />
            </Field>
          </div>
        ) : null}

        {tab === "notifications" ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="emailDigests"
                defaultChecked={Boolean(notifications.email_digests)}
              />
              Email digests
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="incidentAlerts"
                defaultChecked={notifications.incident_alerts !== false}
              />
              Incident / event alerts (when modules are enabled)
            </label>
          </div>
        ) : null}

        {tab === "security" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                name="requireMfaAdmins"
                defaultChecked={Boolean(security.require_mfa_admins)}
              />
              Require MFA for organization admins (policy flag)
            </label>
            <Field label="Session timeout (minutes)" id="sessionTimeout">
              <Input
                id="sessionTimeout"
                name="sessionTimeout"
                type="number"
                defaultValue={security.session_timeout_minutes ?? 480}
              />
            </Field>
          </div>
        ) : null}

        <Button type="submit">Save {TABS.find((t) => t.id === tab)?.label}</Button>
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
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
