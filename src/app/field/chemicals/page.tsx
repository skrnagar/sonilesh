import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/org-context";
import { FieldCard, FieldEmpty, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { hasFeature } from "@/lib/services/entitlements";
import { searchFieldChemicals } from "@/lib/services/chemicals";

export default async function FieldChemicalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { supabase, organization } = await requireOrgContext();
  const entitled = await hasFeature(supabase, organization.id, "chemical_sds");
  if (!entitled) return <FieldForbidden />;

  const rows = await searchFieldChemicals(supabase, organization.id, q);

  return (
    <div className="space-y-4">
      <FieldPageHeader title="Chemicals / SDS" subtitle="Search the register. Current SDS requires sign-in." />
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Name, CAS, UN"
          className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm"
        />
        <button type="submit" className="h-10 rounded-md bg-primary px-3 text-sm text-white">
          Search
        </button>
      </form>
      {rows.length === 0 ? (
        <FieldEmpty text="No chemicals match." />
      ) : (
        rows.map((c) => (
          <FieldCard key={c.id}>
            <Link href={`/field/chemicals/${c.id}`} className="block">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.cas_number ?? "No CAS"} · {c.hazard_classification ?? "unclassified"}
              </p>
            </Link>
          </FieldCard>
        ))
      )}
    </div>
  );
}
