import { requireOrgContext } from "@/lib/auth/org-context";

export default async function FieldTrainingPage() {
  const { supabase, user, organization } = await requireOrgContext();
  const { data } = await supabase
    .from("training_assignments")
    .select("id, status, due_date, expires_at")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .limit(20);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">My training</h1>
      {(data ?? []).map((t) => (
        <div key={t.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
          <p className="font-medium">Assignment {t.id.slice(0, 8)}</p>
          <p className="text-xs capitalize text-slate-400">
            {t.status} · due {t.due_date ?? "—"} · expires {t.expires_at ?? "—"}
          </p>
        </div>
      ))}
      {!data?.length ? <p className="text-sm text-slate-500">No training assigned.</p> : null}
    </div>
  );
}
