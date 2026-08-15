import { requireOrgContext } from "@/lib/auth/org-context";
import { completeFieldCapaAction } from "@/app/actions/field";

async function submitCapaForm(formData: FormData) {
  "use server";
  await completeFieldCapaAction(formData);
}

export default async function FieldActionsPage() {
  const { supabase, user, organization } = await requireOrgContext();
  const [{ data: actions }, { data: capas }] = await Promise.all([
    supabase
      .from("action_items")
      .select("id, title, status, due_date")
      .eq("organization_id", organization.id)
      .eq("owner_id", user.id)
      .in("status", ["open", "in_progress"])
      .is("deleted_at", null),
    supabase
      .from("capa_items")
      .select("id, title, status, due_date")
      .eq("organization_id", organization.id)
      .eq("owner_id", user.id)
      .in("status", ["open", "in_progress"])
      .is("deleted_at", null),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My actions</h1>
      {(actions ?? []).map((a) => (
        <div key={a.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
          <p className="font-medium">{a.title}</p>
          <p className="text-xs text-slate-400">
            {a.status} · due {a.due_date ?? "—"}
          </p>
        </div>
      ))}
      <h2 className="pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        CAPA completion
      </h2>
      {(capas ?? []).map((c) => (
        <form
          key={c.id}
          action={submitCapaForm}
          className="space-y-2 rounded-xl border border-white/10 bg-slate-900/70 p-3"
        >
          <input type="hidden" name="capaId" value={c.id} />
          <p className="font-medium">{c.title}</p>
          <input
            name="evidence"
            placeholder="Photo evidence URL / note"
            className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-sm"
          />
          <textarea
            name="comment"
            placeholder="Comment"
            rows={2}
            className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-sm"
          />
          <button className="w-full rounded-xl bg-teal-500 py-3 text-sm font-bold text-slate-950">
            Submit completion
          </button>
        </form>
      ))}
      {!actions?.length && !capas?.length ? (
        <p className="text-sm text-slate-500">No open actions or CAPA.</p>
      ) : null}
    </div>
  );
}
