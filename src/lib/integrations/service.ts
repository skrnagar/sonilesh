import type { SupabaseClient } from "@supabase/supabase-js";
import { CONNECTOR_CATALOG } from "@/lib/integrations/catalog";
import { secretRefFor } from "@/lib/integrations/credentials";
import { DEFAULT_MAPPINGS } from "@/lib/integrations/mapping";
import { providerFor } from "@/lib/integrations/providers";
import { runSyncPipeline, type DedupeIndex } from "@/lib/integrations/sync";
import type { MappingRule, SyncMode } from "@/lib/integrations/types";
import { writeAuditLog } from "@/lib/services/audit";

export async function listHub(supabase: SupabaseClient, organizationId: string) {
  const [{ data: catalog }, { data: connections }, { data: errors }] = await Promise.all([
    supabase
      .from("integrations")
      .select("id, code, name, category, maturity, description, is_active")
      .is("organization_id", null)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("integration_connections")
      .select(
        "id, name, status, sync_mode, last_sync_at, last_error, records_synced, error_count, integration_id, integrations:integration_id(code, name, maturity)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("integration_errors")
      .select("id, code, message, created_at, connection_id")
      .eq("organization_id", organizationId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const connectedCodes = new Set(
    (connections ?? []).map((row) => (row.integrations as { code?: string } | null)?.code).filter(Boolean),
  );

  return {
    catalog: catalog?.length ? catalog : CONNECTOR_CATALOG,
    connections: connections ?? [],
    errors: errors ?? [],
    available: (catalog ?? CONNECTOR_CATALOG).filter((row) => !connectedCodes.has(row.code)),
  };
}

export async function connectIntegration(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    integrationId: string;
    name: string;
    syncMode: SyncMode;
  },
) {
  const { data: integration, error: intError } = await supabase
    .from("integrations")
    .select("id, code, name, maturity")
    .eq("id", input.integrationId)
    .maybeSingle();
  if (intError) throw new Error(intError.message);
  if (!integration) throw new Error("Unknown connector");

  const { data, error } = await supabase
    .from("integration_connections")
    .insert({
      organization_id: input.organizationId,
      integration_id: integration.id,
      name: input.name.trim() || integration.name,
      status: integration.maturity === "real" ? "connected" : "needs_attention",
      sync_mode: input.syncMode,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("integration_credentials").insert({
    organization_id: input.organizationId,
    connection_id: data.id,
    kind: "secret_ref",
    secret_ref: secretRefFor(input.organizationId, data.id),
    created_by: input.userId,
  });

  await supabase.from("integration_mappings").insert(
    DEFAULT_MAPPINGS.map((rule) => ({
      organization_id: input.organizationId,
      connection_id: data.id,
      entity_type: rule.entityType,
      external_field: rule.externalField,
      internal_entity: rule.internalEntity,
      internal_field: rule.internalField,
    })),
  );

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "integration.connected",
    entityType: "integration_connection",
    entityId: data.id,
    newValues: { code: integration.code, maturity: integration.maturity },
  });

  return data;
}

export async function runConnectionSync(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    connectionId: string;
    mode: SyncMode;
  },
) {
  const { data: connection, error } = await supabase
    .from("integration_connections")
    .select(
      "id, cursor, organization_id, integrations:integration_id(code, maturity)",
    )
    .eq("id", input.connectionId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!connection) throw new Error("Connection not found");

  const code = (connection.integrations as { code?: string } | null)?.code ?? "csv_manual";
  const provider = providerFor(code);

  const { data: job, error: jobError } = await supabase
    .from("integration_sync_jobs")
    .insert({
      organization_id: input.organizationId,
      connection_id: input.connectionId,
      mode: input.mode,
      status: "running",
      cursor_start: connection.cursor ?? {},
      started_at: new Date().toISOString(),
      created_by: input.userId,
    })
    .select("id")
    .single();
  if (jobError) throw new Error(jobError.message);

  const fetched = await provider.fetch({
    mode: input.mode,
    cursor: (connection.cursor ?? {}) as { updatedAt?: string | null; externalId?: string | null },
    config: {},
  });

  const { data: mappingRows } = await supabase
    .from("integration_mappings")
    .select("entity_type, external_field, internal_entity, internal_field")
    .eq("connection_id", input.connectionId)
    .eq("organization_id", input.organizationId);

  const rules: MappingRule[] = (mappingRows ?? []).map((row) => ({
    entityType: row.entity_type as MappingRule["entityType"],
    externalField: row.external_field,
    internalEntity: row.internal_entity as MappingRule["internalEntity"],
    internalField: row.internal_field,
  }));

  const { data: existing } = await supabase
    .from("integration_sync_records")
    .select("external_system, external_id")
    .eq("organization_id", input.organizationId);

  const seen: DedupeIndex = new Set(
    (existing ?? []).map((row) => `${row.external_system}::${row.external_id}`),
  );

  const result = runSyncPipeline({
    mode: input.mode,
    records: fetched.records,
    cursor: (connection.cursor ?? {}) as { updatedAt?: string | null; externalId?: string | null },
    rules: rules.length ? rules : [],
    seen,
    auth: {
      organizationId: input.organizationId,
      allowedOrganizationId: input.organizationId,
      canWrite: true,
    },
  });

  if (result.written.length) {
    const { error: writeError } = await supabase.from("integration_sync_records").insert(
      result.written.map((row) => ({
        organization_id: input.organizationId,
        connection_id: input.connectionId,
        job_id: job.id,
        external_system: row.externalSystem,
        external_id: row.externalId,
        entity_type: row.internalEntity,
        status: "written",
      })),
    );
    if (writeError && writeError.code === "23505") {
      // Unique (org, external_system, external_id) — treat as dedupe
    } else if (writeError) {
      throw new Error(writeError.message);
    }
  }

  for (const fail of result.failed) {
    await supabase.from("integration_errors").insert({
      organization_id: input.organizationId,
      connection_id: input.connectionId,
      job_id: job.id,
      code: "sync_record_failed",
      message: fail.error,
      payload: { externalId: fail.record.externalId },
    });
  }

  const finished = new Date().toISOString();
  await supabase
    .from("integration_sync_jobs")
    .update({
      status: result.failed.length && !result.written.length ? "failed" : "completed",
      records_in: fetched.records.length,
      records_written: result.written.length,
      records_deduped: result.deduped.length,
      records_failed: result.failed.length,
      cursor_end: result.nextCursor,
      finished_at: finished,
      error: fetched.note ?? null,
    })
    .eq("id", job.id)
    .eq("organization_id", input.organizationId);

  await supabase
    .from("integration_connections")
    .update({
      last_sync_at: finished,
      records_synced: result.written.length,
      error_count: result.failed.length,
      last_error: result.failed[0]?.error ?? fetched.note ?? null,
      cursor: result.nextCursor,
      status: result.failed.length && !result.written.length ? "failed" : "connected",
      updated_by: input.userId,
    })
    .eq("id", input.connectionId)
    .eq("organization_id", input.organizationId);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "integration.sync_ran",
    entityType: "integration_sync_job",
    entityId: job.id,
    newValues: {
      written: result.written.length,
      deduped: result.deduped.length,
      failed: result.failed.length,
      maturity: provider.maturity,
    },
  });

  return { jobId: job.id, ...result, note: fetched.note };
}
