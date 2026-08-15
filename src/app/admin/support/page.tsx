import { requirePlatformAdmin } from "@/lib/auth/session";

export default async function AdminSupportPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">Support</h1>
      <ul className="space-y-2 text-sm">
        {(tickets ?? []).map((ticket) => (
          <li key={ticket.id} className="border border-border bg-card px-3 py-2">
            <p className="font-medium">{ticket.subject}</p>
            <p className="text-xs text-muted-foreground capitalize">{ticket.status} · {ticket.priority}</p>
          </li>
        ))}
        {!tickets?.length ? <li className="text-muted-foreground">No support tickets yet.</li> : null}
      </ul>
    </div>
  );
}
