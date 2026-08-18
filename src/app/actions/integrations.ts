"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { connectIntegration, runConnectionSync } from "@/lib/integrations/service";
import { generateApiKey } from "@/lib/api/public";
import { generateWebhookSecret, isOutboundEvent } from "@/lib/integrations/webhooks";
import { encryptSecret, credentialsKeyConfigured, secretRefFor } from "@/lib/integrations/credentials";
import { enqueueImportJob, processImportJob } from "@/lib/import/service";
import { marketplaceItemByCode } from "@/lib/marketplace/catalog";
import { hasFeature } from "@/lib/services/entitlements";
import { writeAuditLog } from "@/lib/services/audit";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";
import type { ImportEntityType } from "@/lib/import/pipeline";
import type { SyncMode } from "@/lib/integrations/types";

async function requireIntegrationsManage() {
  return requireModuleAccess({
    featureCode: "integrations",
    permission: "integrations.manage",
  });
}

export async function connectIntegrationAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireIntegrationsManage();
    if (!access.entitled) return { ok: false, error: "Integrations are not on this plan" };
    if (!access.permitted) return { ok: false, error: "Missing permission: integrations.manage" };
    await connectIntegration(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      integrationId: String(formData.get("integrationId") || ""),
      name: String(formData.get("name") || ""),
      syncMode: (String(formData.get("syncMode") || "manual") as SyncMode) || "manual",
    });
    revalidatePath("/app/integrations");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function runSyncAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireIntegrationsManage();
    if (!access.entitled) return { ok: false, error: "Integrations are not on this plan" };
    if (!access.permitted) return { ok: false, error: "Missing permission: integrations.manage" };
    const connectionId = String(formData.get("connectionId") || "");
    const mode = (String(formData.get("mode") || "manual") as SyncMode) || "manual";
    await runConnectionSync(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      connectionId,
      mode,
    });
    revalidatePath("/app/integrations");
    revalidatePath("/app/integrations/monitoring");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createApiKeyAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "public_api",
      permission: "api.manage",
    });
    if (!access.entitled) return { ok: false, error: "Public API is not on this plan" };
    if (!access.permitted) return { ok: false, error: "Missing permission: api.manage" };
    const generated = generateApiKey();
    const { error } = await access.supabase.from("organization_api_keys").insert({
      organization_id: access.organization.id,
      name: String(formData.get("name") || "API key").trim(),
      key_prefix: generated.prefix,
      key_hash: generated.hash,
      scopes: String(formData.get("scopes") || "*")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      created_by: access.user.id,
    });
    if (error) return { ok: false, error: error.message };
    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "api_key.created",
      entityType: "organization_api_key",
      newValues: { prefix: generated.prefix },
    });
    revalidatePath("/app/settings/api");
    return { ok: true, id: generated.plaintext };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function revokeApiKeyAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ permission: "api.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission: api.manage" };
    const id = String(formData.get("id") || "");
    const { error } = await access.supabase
      .from("organization_api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", access.organization.id);
    if (error) return { ok: false, error: error.message };
    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "api_key.revoked",
      entityType: "organization_api_key",
      entityId: id,
    });
    revalidatePath("/app/settings/api");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function createWebhookAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "integrations",
      permission: "webhooks.manage",
    });
    if (!access.entitled) return { ok: false, error: "Integrations are not on this plan" };
    if (!access.permitted) return { ok: false, error: "Missing permission: webhooks.manage" };
    const events = String(formData.get("eventTypes") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => isOutboundEvent(s));
    const secret = generateWebhookSecret();
    const encrypted = credentialsKeyConfigured() ? encryptSecret(secret) : null;
    const { data, error } = await access.supabase
      .from("integration_webhooks")
      .insert({
        organization_id: access.organization.id,
        name: String(formData.get("name") || "Webhook").trim(),
        target_url: String(formData.get("targetUrl") || "").trim(),
        secret_ref: secretRefFor(access.organization.id, "webhook"),
        encrypted_secret: encrypted,
        event_types: events,
        created_by: access.user.id,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "webhook.created",
      entityType: "integration_webhook",
      entityId: data.id,
    });
    revalidatePath("/app/integrations");
    return { ok: true, id: encrypted ? secret : secret };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function enqueueImportAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({ permission: "import.manage" });
    if (!access.permitted) return { ok: false, error: "Missing permission: import.manage" };
    const csvText = String(formData.get("csvText") || "");
    const entityType = String(formData.get("entityType") || "sites") as ImportEntityType;
    const jobId = await enqueueImportJob(access.supabase, {
      organizationId: access.organization.id,
      userId: access.user.id,
      entityType,
      filename: String(formData.get("filename") || "upload.csv"),
      csvText,
    });
    after(async () => {
      await processImportJob(access.supabase, {
        organizationId: access.organization.id,
        userId: access.user.id,
        jobId,
      });
    });
    revalidatePath("/app/import");
    return { ok: true, id: jobId };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}

export async function installMarketplaceItemAction(formData: FormData): Promise<ActionResult> {
  try {
    const access = await requireModuleAccess({
      featureCode: "marketplace",
      permission: "marketplace.install",
    });
    if (!access.entitled) return { ok: false, error: "Marketplace is not on this plan" };
    if (!access.permitted) return { ok: false, error: "Missing permission: marketplace.install" };
    const code = String(formData.get("code") || "");
    const item = marketplaceItemByCode(code);
    if (!item) return { ok: false, error: "Unknown catalog item" };
    if (item.featureCode) {
      const ok = await hasFeature(access.supabase, access.organization.id, item.featureCode);
      if (!ok && item.featureCode !== "integrations") {
        return { ok: false, error: `Requires entitlement: ${item.featureCode}` };
      }
    }
    const { data: catalog } = await access.supabase
      .from("marketplace_catalog_items")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!catalog) return { ok: false, error: "Catalog item is not seeded" };
    const { error } = await access.supabase.from("marketplace_installs").upsert(
      {
        organization_id: access.organization.id,
        catalog_item_id: catalog.id,
        status: "installed",
        installed_by: access.user.id,
      },
      { onConflict: "organization_id,catalog_item_id" },
    );
    if (error) return { ok: false, error: error.message };
    await writeAuditLog(access.supabase, {
      organizationId: access.organization.id,
      actorUserId: access.user.id,
      action: "marketplace.installed",
      entityType: "marketplace_install",
      entityId: catalog.id,
      newValues: { code, payment: false },
    });
    revalidatePath("/app/marketplace");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
