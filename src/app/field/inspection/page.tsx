export default function FieldInspectionPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Field inspection</h1>
      <p className="text-sm text-slate-400">
        Pass / Fail / NA with photo, comment, and signature. Full checklist assignments sync from
        /app/inspections.
      </p>
      <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/70 p-4">
        <p className="text-sm font-medium">Sample control check</p>
        <div className="grid grid-cols-3 gap-2">
          {["Pass", "Fail", "NA"].map((label) => (
            <button
              key={label}
              className="rounded-xl border border-white/15 py-4 text-sm font-bold uppercase"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm"
        />
        <textarea
          placeholder="Comment"
          className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm"
          rows={3}
        />
        <input
          placeholder="Signature name"
          className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm"
        />
      </div>
    </div>
  );
}
