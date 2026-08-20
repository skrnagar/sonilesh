import { requirePlatformPermission } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export default async function AdminAuditPage() {
  const { supabase } = await requirePlatformPermission("saas.audit.view");
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">System Audit Logs</h1>
      <ul className="space-y-2 text-sm">
        {(logs ?? []).map((log) => (
          <li key={log.id} className="border border-border bg-card px-3 py-2">
            <p className="font-medium">{log.action}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(log.created_at)} · {log.entity_type} · org {log.organization_id ?? "platform"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
