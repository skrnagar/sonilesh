import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/state-panels";
import { formatDate } from "@/lib/utils";

type EventRow = {
  id: string;
  event_number: string;
  title: string | null;
  status: string;
  occurred_at: string;
  description: string;
  sites?: { name?: string } | null;
  severity_levels?: { name?: string } | null;
};

export function EventList({
  title,
  createHref,
  baseHref,
  rows,
}: {
  title: string;
  createHref: string;
  baseHref: string;
  rows: EventRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <Button asChild>
          <Link href={createHref}>Report</Link>
        </Button>
      </div>

      {!rows.length ? (
        <EmptyState
          title={`No ${title.toLowerCase()} yet`}
          description="Create the first record to start the investigate → CAPA → close lifecycle."
          action={
            <Button asChild>
              <Link href={createHref}>Create report</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Number</th>
                <th className="px-3 py-2 font-semibold">Title</th>
                <th className="px-3 py-2 font-semibold">Site</th>
                <th className="px-3 py-2 font-semibold">Severity</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Occurred</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-3 py-2">
                    <Link href={`${baseHref}/${row.id}`} className="font-medium text-accent">
                      {row.event_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{row.title || row.description.slice(0, 48)}</td>
                  <td className="px-3 py-2">{row.sites?.name ?? "—"}</td>
                  <td className="px-3 py-2">{row.severity_levels?.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className="capitalize">
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{formatDate(row.occurred_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
