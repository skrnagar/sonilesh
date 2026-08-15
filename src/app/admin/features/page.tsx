import { requirePlatformAdmin } from "@/lib/auth/session";

export default async function AdminFeaturesPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: features } = await supabase.from("features").select("*").order("code");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">Features & Entitlements</h1>
      <div className="overflow-x-auto border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Value type</th>
              <th className="px-3 py-2 text-left">Active</th>
            </tr>
          </thead>
          <tbody>
            {(features ?? []).map((feature) => (
              <tr key={feature.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{feature.code}</td>
                <td className="px-3 py-2">{feature.name}</td>
                <td className="px-3 py-2">{feature.category}</td>
                <td className="px-3 py-2">{feature.value_type}</td>
                <td className="px-3 py-2">{feature.is_active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

