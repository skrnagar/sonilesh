import { adminUpdatePlatformSettingAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requirePlatformPermission } from "@/lib/auth/session";

export default async function AdminSettingsPage() {
  const { supabase } = await requirePlatformPermission("saas.organizations.update");
  const { data: settings } = await supabase.from("platform_settings").select("*").order("key");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">Platform Settings</h1>
      {(settings ?? []).map((setting) => (
        <form key={setting.id} action={adminUpdatePlatformSettingAction} className="space-y-2 border border-border bg-card p-4">
          <input type="hidden" name="key" value={setting.key} />
          <Label>{setting.key}</Label>
          <Textarea name="value" defaultValue={JSON.stringify(setting.value, null, 2)} />
          <Button type="submit" size="sm">Save</Button>
        </form>
      ))}
    </div>
  );
}
