import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { filterSearchHits, type SearchSourceRow } from "@/lib/search/enterprise";

export default async function EnterpriseSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const access = await requireModuleAccess({
    featureCode: "enterprise_search",
    permission: "search.use",
  });
  if (!access.entitled) return <UpgradeState featureName="Enterprise search" />;
  if (!access.permitted) return <ForbiddenState />;

  const orgId = access.organization.id;
  const siteId = access.siteId;

  let hits: ReturnType<typeof filterSearchHits> = [];
  if (q) {
    const pattern = `%${q.replace(/[%*,]/g, "")}%`;
    const [events, capa, sites, docs] = await Promise.all([
      access.supabase
        .from("ehs_events")
        .select("id, organization_id, event_number, title, status, site_id")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .or(`title.ilike.${pattern},event_number.ilike.${pattern}`)
        .limit(25),
      access.supabase
        .from("capa_items")
        .select("id, organization_id, title, status, site_id")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .ilike("title", pattern)
        .limit(25),
      access.supabase
        .from("sites")
        .select("id, organization_id, name, code, status")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .or(`name.ilike.${pattern},code.ilike.${pattern}`)
        .limit(25),
      access.supabase
        .from("controlled_documents")
        .select("id, organization_id, title, status")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .ilike("title", pattern)
        .limit(25),
    ]);

    hits = [
      ...filterSearchHits({
        scope: { organizationId: orgId, siteId },
        rows: (events.data ?? []) as SearchSourceRow[],
        query: q,
        module: "incidents",
        hrefFor: (row) => `/app/incidents/${row.id}`,
        titleFor: (row) => row.event_number || row.title || row.id,
      }),
      ...filterSearchHits({
        scope: { organizationId: orgId, siteId },
        rows: (capa.data ?? []) as SearchSourceRow[],
        query: q,
        module: "capa",
        hrefFor: () => `/app/capa`,
      }),
      ...filterSearchHits({
        scope: { organizationId: orgId, siteId },
        rows: (sites.data ?? []) as SearchSourceRow[],
        query: q,
        module: "sites",
        hrefFor: () => `/app/settings/sites`,
      }),
      ...filterSearchHits({
        scope: { organizationId: orgId, siteId },
        rows: (docs.data ?? []) as SearchSourceRow[],
        query: q,
        module: "documents",
        hrefFor: () => `/app/documents`,
      }),
    ].slice(0, 50);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Enterprise search</h1>
        <p className="text-sm text-muted-foreground">
          Keyword search runs inside this organization (and site context when selected) before any
          results are returned. Semantic search is optional when embeddings exist.
        </p>
      </div>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search incidents, CAPA, sites, documents"
          className="w-full max-w-xl rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Search
        </button>
      </form>
      {q ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {hits.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">No matches in this tenant.</li>
          ) : (
            hits.map((hit) => (
              <li key={`${hit.module}-${hit.id}`}>
                <a href={hit.href} className="block px-4 py-3 hover:bg-muted/40">
                  <p className="text-xs uppercase text-muted-foreground">{hit.module}</p>
                  <p className="font-medium">{hit.title}</p>
                  {hit.status ? (
                    <p className="text-xs text-muted-foreground">{hit.status}</p>
                  ) : null}
                </a>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
