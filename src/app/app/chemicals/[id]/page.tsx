import Link from "next/link";
import { notFound } from "next/navigation";
import { uploadSdsAction, upsertChemicalInventoryAction } from "@/app/actions/chemicals";
import { ActionForm } from "@/components/shared/action-form";
import { PermitQrCode } from "@/components/permits/permit-qr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getChemicalBundle } from "@/lib/services/chemicals";
import { formatDate } from "@/lib/utils";

export default async function ChemicalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireModuleAccess({
    featureCode: "chemical_sds",
    permission: "chemicals.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Chemical / SDS" />;
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getChemicalBundle(access.supabase, access.organization.id, id);
  if (!bundle) notFound();
  const { chemical, sds, currentSds, inventory, fieldPath } = bundle;

  const { data: locations } = await access.supabase
    .from("locations")
    .select("id, name")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{chemical.name}</h1>
          <p className="text-sm text-muted-foreground">
            CAS {chemical.cas_number ?? "—"} · {chemical.hazard_classification ?? "unclassified"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/chemicals">Back</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Current SDS</h2>
          {currentSds?.signed_url ? (
            <a href={currentSds.signed_url} className="text-accent underline" target="_blank" rel="noreferrer">
              {currentSds.file_name || "Open current SDS"}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No current SDS uploaded. The uploaded file is the SDS.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Version {currentSds?.version ?? "—"} · expires {formatDate(currentSds?.expires_on)}
          </p>
          <ActionForm action={uploadSdsAction} className="grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="chemicalId" value={chemical.id} />
            <Input name="version" placeholder="Version" />
            <Input name="expiresOn" type="date" />
            <Input name="file" type="file" accept="application/pdf,image/*" className="sm:col-span-2" />
            <Button type="submit" size="sm" className="sm:col-span-2">
              Upload SDS
            </Button>
          </ActionForm>
          <ul className="text-xs text-muted-foreground">
            {sds.map((row) => (
              <li key={row.id}>
                {row.version} {row.is_current ? "(current)" : ""} {row.file_name ?? ""}
              </li>
            ))}
          </ul>
        </section>
        <PermitQrCode path={fieldPath} label="Field SDS (auth required)" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Inventory by location</h2>
        <ul className="text-sm">
          {inventory.map((row) => {
            const loc = row.locations as { name?: string } | null;
            return (
              <li key={row.id}>
                {loc?.name ?? "Location"} — {row.quantity} {row.unit}
              </li>
            );
          })}
        </ul>
        <ActionForm action={upsertChemicalInventoryAction} className="grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="chemicalId" value={chemical.id} />
          <Select name="locationId" required>
            <option value="">Location</option>
            {(locations ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
          <Input name="quantity" type="number" step="0.01" placeholder="Qty" />
          <Input name="unit" placeholder="Unit" defaultValue="L" />
          <Button type="submit" size="sm" className="sm:col-span-3">
            Update inventory
          </Button>
        </ActionForm>
      </section>
    </div>
  );
}
