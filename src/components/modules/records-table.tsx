export function RecordsTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  empty: string;
}) {
  if (!rows.length) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/30">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-3 align-top text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded border border-border px-2 py-0.5 text-xs font-medium capitalize">
      {value.replaceAll("_", " ")}
    </span>
  );
}
