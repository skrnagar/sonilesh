import Link from "next/link";
import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { isExpiringSoon, permitCountdown } from "@/lib/services/permits";
import { Button } from "@/components/ui/button";

export default async function PermitsPage() {
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.view",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="Permits"
        description="Permit to Work"
        featureCode="permit_to_work"
        permission="permits.view"
      />
    );
  }

  const { supabase, organization } = access;
  const [{ data: rows }, { data: types }, expiring] = await Promise.all([
    supabase
      .from("permits")
      .select("id, permit_number, title, status, valid_to, permit_types:permit_type_id(name)")
      .eq("organization_id", organization.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("permit_types")
      .select("code, name")
      .or(`organization_id.eq.${organization.id},organization_id.is.null`)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("permits")
      .select("permit_number, title, valid_to")
      .eq("organization_id", organization.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("valid_to", { ascending: true })
      .limit(10)
      .then((r) => r.data ?? []),
  ]);

  const expiringSoon = expiring.filter((p) => isExpiringSoon(p.valid_to, 24));

  return (
    <ModuleShell
      title="Permit to Work"
      description="Configurable permit types with expiry enforcement"
      featureCode="permit_to_work"
      permission="permits.view"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Seed types: {(types ?? []).map((t) => t.name).join(", ")}
        </div>
        <Link href="/app/permits/print">
          <Button variant="outline" size="sm">
            Printable permit layout
          </Button>
        </Link>
      </div>

      {expiringSoon.length ? (
        <div className="border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold text-foreground">Expiring within 24 hours</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {expiringSoon.map((p) => {
              const c = permitCountdown(p.valid_to);
              return (
                <li key={p.permit_number}>
                  {p.permit_number} — {p.title} ({c?.hours}h {c?.minutes}m left)
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <RecordsTable
        columns={["Number", "Type", "Title", "Status", "Countdown"]}
        empty="No permits yet."
        rows={(rows ?? []).map((r) => {
          const c = permitCountdown(r.valid_to);
          const typeName =
            (r.permit_types as { name?: string } | null)?.name ?? "—";
          return [
            r.permit_number,
            typeName,
            r.title,
            <StatusPill key="s" value={r.status} />,
            c
              ? c.expired
                ? "Expired"
                : `${c.hours}h ${c.minutes}m`
              : "—",
          ];
        })}
      />
    </ModuleShell>
  );
}
