import Link from "next/link";
import { createFieldPermitAction } from "@/app/actions/field";
import {
  FieldCard,
  FieldForbidden,
  FieldPageHeader,
  fieldControlClass,
  fieldPrimaryBtnClass,
} from "@/components/field/field-ui";
import { FieldSubmitForm } from "@/components/field/field-submit-form";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { hasFeature } from "@/lib/services/entitlements";
import { getUserPermissions } from "@/lib/services/rbac";

export default async function FieldNewPermitPage() {
  const { supabase, user, organization, membershipId, sites } = await requireOrgContext();

  const [entitled, role, permissions, typesRes] = await Promise.all([
    hasFeature(supabase, organization.id, "permit_to_work"),
    resolveFieldRole(supabase, membershipId),
    getUserPermissions(supabase, organization.id, user.id),
    supabase
      .from("permit_types")
      .select("id, code, name")
      .or(`organization_id.eq.${organization.id},organization_id.is.null`)
      .eq("is_active", true)
      .order("sort_order")
      .limit(20),
  ]);

  if (!entitled || !canFieldAction(role, "my_permits")) return <FieldForbidden />;
  if (!permissions.includes("permits.create")) {
    return (
      <div className="space-y-4">
        <FieldPageHeader title="Request permit" subtitle="Permit to work" />
        <FieldForbidden />
        <Link href="/field/permits" className="block text-center text-sm text-accent underline">
          Back to permits
        </Link>
      </div>
    );
  }

  const types = typesRes.data ?? [];

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="Request permit"
        subtitle="Quick PTW request from the field — full checklist on desktop."
      />
      <FieldCard>
        <FieldSubmitForm action={createFieldPermitAction} submitLabel="Submit request">
          <input type="hidden" name="organizationId" value={organization.id} />
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Permit type
            </span>
            <select name="permitTypeCode" required defaultValue="general_work" className={fieldControlClass}>
              {types.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Work title
            </span>
            <input name="title" required placeholder="Describe the work" className={fieldControlClass} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Work description
            </span>
            <textarea name="workDescription" rows={3} className={fieldControlClass} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Site
            </span>
            <select name="siteId" className={fieldControlClass}>
              <option value="">Select site</option>
              {(sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </FieldSubmitForm>
      </FieldCard>
      <Link href="/field/permits" className={`${fieldPrimaryBtnClass} block text-center`}>
        Back to permits
      </Link>
    </div>
  );
}
