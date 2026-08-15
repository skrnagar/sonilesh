import { requireOrgContext } from "@/lib/auth/org-context";

export default async function FieldToolboxPage() {
  const { supabase, organization } = await requireOrgContext();
  const { data } = await supabase
    .from("toolbox_talks")
    .select("talk_number, topic, held_at")
    .eq("organization_id", organization.id)
    .is("deleted_at", null)
    .order("held_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Toolbox talks</h1>
      {(data ?? []).map((t) => (
        <div key={t.talk_number} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
          <p className="font-medium">{t.topic}</p>
          <p className="text-xs text-slate-400">
            {t.talk_number} · {new Date(t.held_at).toLocaleString()}
          </p>
        </div>
      ))}
      {!data?.length ? <p className="text-sm text-slate-500">No toolbox talks yet.</p> : null}
    </div>
  );
}
