import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/org-context";
import { FieldCard, FieldEmpty, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { PermitQrCode } from "@/components/permits/permit-qr";
import { hasFeature } from "@/lib/services/entitlements";
import { getChemicalBundle } from "@/lib/services/chemicals";

export default async function FieldChemicalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, organization } = await requireOrgContext();
  const entitled = await hasFeature(supabase, organization.id, "chemical_sds");
  if (!entitled) return <FieldForbidden />;

  const bundle = await getChemicalBundle(supabase, organization.id, id);
  if (!bundle) notFound();
  const loc = bundle.chemical.locations as { name?: string } | null;

  return (
    <div className="space-y-4">
      <FieldPageHeader title={bundle.chemical.name} subtitle={bundle.chemical.cas_number ?? undefined} />
      <FieldCard className="space-y-2">
        <p className="text-sm">{bundle.chemical.hazard_classification ?? "No classification recorded"}</p>
        <p className="text-xs text-muted-foreground">Location: {loc?.name ?? "—"}</p>
        {bundle.currentSds?.signed_url ? (
          <a
            href={bundle.currentSds.signed_url}
            className="text-sm text-accent underline"
            target="_blank"
            rel="noreferrer"
          >
            Open current SDS
          </a>
        ) : (
          <FieldEmpty text="No current SDS uploaded for this chemical." />
        )}
      </FieldCard>
      <PermitQrCode path={bundle.fieldPath} label="Authenticated SDS link" />
      <Link href="/field/chemicals" className="text-sm text-accent underline">
        Back to search
      </Link>
    </div>
  );
}
