import Link from "next/link";
import type { AnalyticsAlert, DataQualityFlag } from "@/lib/analytics/types";

export function AlertsList({ alerts }: { alerts: AnalyticsAlert[] }) {
  if (!alerts.length) {
    return <p className="text-sm text-muted-foreground">No open analytics alerts in this scope.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {alerts.map((alert) => (
        <li key={`${alert.sourceType}:${alert.sourceId}:${alert.alertType}`}>
          <Link href={alert.href} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/60">
            <div>
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-xs text-muted-foreground">
                {alert.sourceType} · {alert.alertType}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
              {alert.severity}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DataQualityList({ flags }: { flags: DataQualityFlag[] }) {
  if (!flags.length) {
    return <p className="text-sm text-muted-foreground">No data-quality gaps flagged for this scope.</p>;
  }
  return (
    <ul className="space-y-2">
      {flags.map((flag) => (
        <li key={flag.code} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{flag.severity}</p>
          <p className="mt-1">{flag.message}</p>
        </li>
      ))}
    </ul>
  );
}
