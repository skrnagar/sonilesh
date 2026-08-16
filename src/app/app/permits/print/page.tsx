import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function PermitPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.view",
  });
  if (!access.entitled || !access.permitted) {
    return <p className="p-6 text-sm">Not authorized</p>;
  }

  let query = access.supabase
    .from("permits")
    .select(
      "permit_number, title, work_description, status, valid_from, valid_to, isolation_loto_required, isolation_details, permit_types:permit_type_id(name)",
    )
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .limit(1);

  if (params.id) query = query.eq("id", params.id);
  else query = query.order("created_at", { ascending: false });

  const { data: permit } = await query.maybeSingle();

  return (
    <div className="mx-auto max-w-3xl space-y-4 bg-card p-8 text-foreground print:bg-white print:text-black">
      <header className="border-b-2 border-black pb-3">
        <h1 className="text-2xl font-bold tracking-tight">PERMIT TO WORK</h1>
        <p className="text-sm">{access.organization.name}</p>
      </header>
      {!permit ? (
        <p className="text-sm">No permit selected.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase">Permit No.</p>
              <p className="font-semibold">{permit.permit_number}</p>
            </div>
            <div>
              <p className="text-xs uppercase">Type</p>
              <p className="font-semibold">
                {(permit.permit_types as { name?: string } | null)?.name}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase">Valid From</p>
              <p>{permit.valid_from ? new Date(permit.valid_from).toLocaleString() : "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase">Valid To</p>
              <p>{permit.valid_to ? new Date(permit.valid_to).toLocaleString() : "—"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase">Work description</p>
            <p className="mt-1 whitespace-pre-wrap border border-neutral-300 p-3">
              {permit.work_description || permit.title}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase">Isolation / LOTO</p>
            <p>
              {permit.isolation_loto_required ? "Required" : "Not required"}
              {permit.isolation_details ? ` — ${permit.isolation_details}` : ""}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-8">
            {["Requester", "Issuer", "Area Owner"].map((label) => (
              <div key={label} className="border-t border-black pt-2">
                <p className="text-xs uppercase">{label} signature</p>
                <p className="mt-8 text-neutral-400">________________</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
