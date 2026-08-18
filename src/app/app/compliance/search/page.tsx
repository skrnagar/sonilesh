import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { searchCompliance } from "@/lib/services/compliance-search";

export default async function ComplianceSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const { q } = await searchParams;
  const hits = q
    ? await searchCompliance(access.supabase, access.organization.id, q)
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Compliance search</h1>
        <p className="text-sm text-muted-foreground">
          Tenant-scoped search across regulations, register entries, assessments, findings, CAPA,
          licenses, and evidence. Not legal advice.
        </p>
      </div>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search obligations, licenses, findings…"
          className="w-full max-w-lg rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button className="rounded-md border border-border px-3 py-2 text-sm" type="submit">
          Search
        </button>
      </form>
      <ul className="divide-y rounded-2xl border border-border bg-card">
        {hits.map((hit) => (
          <li key={`${hit.kind}-${hit.id}`} className="px-4 py-3 text-sm">
            <Link href={hit.href} className="font-medium underline-offset-2 hover:underline">
              {hit.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              {hit.kind}
              {hit.subtitle ? ` · ${hit.subtitle}` : ""}
            </p>
          </li>
        ))}
        {q && !hits.length ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No matches in this organization.</li>
        ) : null}
        {!q ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">Enter at least two characters.</li>
        ) : null}
      </ul>
    </div>
  );
}
