import { requirePlatformAdmin } from "@/lib/auth/session";

export default async function AdminUsersPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_platform_admin, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">Platform Users</h1>
      <div className="overflow-x-auto border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Platform admin</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.full_name ?? "—"}</td>
                <td className="px-3 py-2">{user.is_platform_admin ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
