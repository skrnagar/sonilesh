import { ActionForm } from "@/components/shared/action-form";
import { SettingsNav } from "@/components/organization/settings-nav";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { CreateApiKeyForm } from "@/components/integrations/create-api-key-form";
import { revokeApiKeyAction } from "@/app/actions/integrations";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { formatDate } from "@/lib/utils";

export default async function ApiKeysPage() {
  const access = await requireModuleAccess({
    featureCode: "public_api",
    permission: "api.manage",
  });
  if (!access.entitled) return <UpgradeState featureName="Public API" />;
  if (!access.permitted) return <ForbiddenState />;

  const { data: keys } = await access.supabase
    .from("organization_api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at")
    .eq("organization_id", access.organization.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">API keys</h1>
        <p className="text-sm text-muted-foreground">
          Hashed keys only. The plaintext token is shown once at creation and is never stored.
          OpenAPI: /api/v1/openapi
        </p>
      </div>
      <SettingsNav current="/app/settings/api" />

      <CreateApiKeyForm />

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Prefix</th>
              <th className="px-3 py-2">Scopes</th>
              <th className="px-3 py-2">Last used</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(keys ?? []).map((key) => (
              <tr key={key.id} className="border-t border-border">
                <td className="px-3 py-2">{key.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{key.key_prefix}…</td>
                <td className="px-3 py-2 text-xs">{(key.scopes ?? []).join(", ")}</td>
                <td className="px-3 py-2">{formatDate(key.last_used_at)}</td>
                <td className="px-3 py-2">{key.revoked_at ? "revoked" : "active"}</td>
                <td className="px-3 py-2">
                  {!key.revoked_at ? (
                    <ActionForm action={revokeApiKeyAction}>
                      <input type="hidden" name="id" value={key.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Revoke
                      </Button>
                    </ActionForm>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
