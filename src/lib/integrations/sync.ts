import { createHash } from "crypto";
import { transformRecord, validateExternalRecord } from "@/lib/integrations/mapping";
import type {
  ExternalRecord,
  MappingRule,
  SyncCursor,
  SyncMode,
  TransformedRecord,
} from "@/lib/integrations/types";

export type DedupeIndex = Set<string>;

export function dedupeKey(externalSystem: string, externalId: string) {
  return `${externalSystem}::${externalId}`;
}

export function payloadHash(fields: Record<string, string>) {
  const canonical = JSON.stringify(
    Object.keys(fields)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = fields[key];
        return acc;
      }, {}),
  );
  return createHash("sha256").update(canonical).digest("hex");
}

export function filterIncremental(records: ExternalRecord[], cursor: SyncCursor) {
  if (!cursor.updatedAt) return records;
  const cursorTime = Date.parse(cursor.updatedAt);
  if (Number.isNaN(cursorTime)) return records;
  return records.filter((row) => {
    if (!row.updatedAt) return true;
    const t = Date.parse(row.updatedAt);
    if (Number.isNaN(t)) return true;
    if (t > cursorTime) return true;
    if (t === cursorTime && cursor.externalId && row.externalId > cursor.externalId) return true;
    return t > cursorTime;
  });
}

export function nextCursorFrom(records: ExternalRecord[], previous: SyncCursor): SyncCursor {
  let latest = previous;
  for (const row of records) {
    if (!row.updatedAt) continue;
    const t = Date.parse(row.updatedAt);
    const prev = latest.updatedAt ? Date.parse(latest.updatedAt) : 0;
    if (Number.isNaN(t)) continue;
    if (t > prev || (t === prev && row.externalId > (latest.externalId ?? ""))) {
      latest = { updatedAt: row.updatedAt, externalId: row.externalId };
    }
  }
  return latest;
}

export type SyncAuthorize = {
  organizationId: string;
  allowedOrganizationId: string;
  canWrite: boolean;
};

export function authorizeSyncWrite(auth: SyncAuthorize) {
  if (!auth.canWrite) return "not authorized to write sync records";
  if (auth.organizationId !== auth.allowedOrganizationId) {
    return "organization_id from the client is ignored; tenant mismatch";
  }
  return null;
}

export type SyncPipelineResult = {
  written: TransformedRecord[];
  deduped: TransformedRecord[];
  failed: Array<{ record: ExternalRecord; error: string }>;
  nextCursor: SyncCursor;
};

/**
 * validate → transform → dedupe → authorize → write (caller) → audit (caller)
 */
export function runSyncPipeline(input: {
  mode: SyncMode;
  records: ExternalRecord[];
  cursor: SyncCursor;
  rules: MappingRule[];
  seen: DedupeIndex;
  auth: SyncAuthorize;
}): SyncPipelineResult {
  const authError = authorizeSyncWrite(input.auth);
  if (authError) {
    return {
      written: [],
      deduped: [],
      failed: input.records.map((record) => ({ record, error: authError })),
      nextCursor: input.cursor,
    };
  }

  const incoming =
    input.mode === "incremental" ? filterIncremental(input.records, input.cursor) : input.records;

  const written: TransformedRecord[] = [];
  const deduped: TransformedRecord[] = [];
  const failed: Array<{ record: ExternalRecord; error: string }> = [];

  for (const record of incoming) {
    const invalid = validateExternalRecord(record);
    if (invalid) {
      failed.push({ record, error: invalid });
      continue;
    }
    const transformed = transformRecord(record, input.rules);
    const key = dedupeKey(record.externalSystem, record.externalId);
    if (input.seen.has(key)) {
      deduped.push(transformed);
      continue;
    }
    input.seen.add(key);
    written.push(transformed);
  }

  return {
    written,
    deduped,
    failed,
    nextCursor: nextCursorFrom(incoming, input.cursor),
  };
}

export function hubStatusForConnection(input: {
  status: string;
  lastError?: string | null;
  errorCount?: number;
}) {
  if (input.status === "failed" || ((input.errorCount ?? 0) > 0 && Boolean(input.lastError))) {
    return "Failed";
  }
  if (input.status === "needs_attention") return "Needs Attention";
  if (input.status === "connected") return "Connected";
  if (input.status === "disabled") return "Needs Attention";
  return "Available";
}
