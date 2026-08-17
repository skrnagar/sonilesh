import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import type { CustomFieldType } from "@/lib/reporting/types";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

/** Private bucket path only — never a public HTTP object URL. */
export function assertPrivateAttachmentPath(storagePath: string) {
  const path = storagePath.trim();
  if (!path) throw new Error("Storage path required");
  if (path.includes("/object/public/")) {
    throw new Error("Public storage paths are not allowed");
  }
  if (/^https?:\/\//i.test(path)) {
    throw new Error("Use a private storage path, not a public URL");
  }
  return path;
}

export function isSignedUrl(url: string | null | undefined) {
  if (!url) return false;
  return /\/storage\/v1\/object\/sign\//i.test(url) || /[?&]token=/.test(url);
}

export function sanitizeAttachmentName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "upload.bin";
}

export async function uploadEntityAttachment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    entityType: string;
    entityId: string;
    file: File;
  },
) {
  const mime = validateAttachmentFile(input.file);
  const safeName = sanitizeAttachmentName(input.file.name);
  const storagePath = `${input.organizationId}/${input.entityType}/${input.entityId}/${Date.now()}-${safeName}`;
  assertPrivateAttachmentPath(storagePath);

  const { error: uploadError } = await supabase.storage
    .from("ehs-attachments")
    .upload(storagePath, input.file, {
      contentType: mime,
      upsert: false,
    });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      organization_id: input.organizationId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      storage_path: storagePath,
      file_name: safeName,
      mime_type: mime,
      file_size: input.file.size,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listEntityAttachmentsWithUrls(
  supabase: SupabaseClient,
  organizationId: string,
  entityType: string,
  entityId: string,
): Promise<AttachmentView[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("id, file_name, mime_type, file_size, storage_path, created_at")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (row) => {
      const path = assertPrivateAttachmentPath(row.storage_path);
      let url: string | null = null;
      try {
        url = await createSignedAttachmentUrl(supabase, path);
      } catch {
        url = null;
      }
      const mime = row.mime_type || "";
      return {
        id: row.id,
        file_name: row.file_name,
        content_type: row.mime_type,
        file_size: row.file_size,
        storage_path: path,
        kind: mime.startsWith("image/") ? ("photo" as const) : ("document" as const),
        created_at: row.created_at,
        url,
      };
    }),
  );
}

export function validateAttachmentFile(file: {
  size: number;
  type: string;
  name: string;
}) {
  if (file.size <= 0) throw new Error("Empty file");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds 15 MB limit");
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime) && !mime.startsWith("image/")) {
    throw new Error(`File type not allowed: ${mime}`);
  }
  return mime;
}

export async function uploadReportAttachment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    file: File;
  },
) {
  // Verify tenant ownership before upload
  const { data: event } = await supabase
    .from("ehs_events")
    .select("id")
    .eq("id", input.eventId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!event) throw new Error("Report not found in this organization");

  const mime = validateAttachmentFile(input.file);
  const safeName =
    input.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "upload.bin";
  const storagePath = `${input.organizationId}/events/${input.eventId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("ehs-attachments")
    .upload(storagePath, input.file, {
      contentType: mime,
      upsert: false,
    });
  if (uploadError) throw new Error(uploadError.message);

  const kind = mime.startsWith("image/") ? "photo" : "document";
  const { data, error } = await supabase
    .from("ehs_event_attachments")
    .insert({
      organization_id: input.organizationId,
      event_id: input.eventId,
      storage_path: storagePath,
      file_name: safeName,
      mime_type: mime,
      file_size: input.file.size,
      kind,
      uploaded_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("ehs_event_activity").insert({
    organization_id: input.organizationId,
    event_id: input.eventId,
    actor_user_id: input.userId,
    activity_type: "attachment_added",
    message: `Attachment added: ${safeName}`,
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "report.attachment_added",
    entityType: "ehs_event_attachment",
    entityId: data.id,
    newValues: { event_id: input.eventId, file_name: safeName },
  });

  return data;
}

export async function createSignedAttachmentUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = 3600,
) {
  const path = assertPrivateAttachmentPath(storagePath);
  const { data, error } = await supabase.storage
    .from("ehs-attachments")
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export type AttachmentView = {
  id: string;
  file_name: string;
  content_type: string | null;
  file_size: number | null;
  storage_path: string;
  kind: "photo" | "document";
  created_at?: string;
  url: string | null;
};

function collectFiles(formData: FormData, keys: string[] = ["files", "file"]) {
  const out: File[] = [];
  for (const key of keys) {
    for (const entry of formData.getAll(key)) {
      if (entry instanceof File && entry.size > 0) out.push(entry);
    }
  }
  return out;
}

export { collectFiles };

export async function uploadPermitAttachment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    file: File;
  },
) {
  const { requirePermission } = await import("@/lib/services/rbac");
  await requirePermission(supabase, input.organizationId, input.userId, "permits.update");

  const { data: permit } = await supabase
    .from("permits")
    .select("id")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!permit) throw new Error("Permit not found in this organization");

  const mime = validateAttachmentFile(input.file);
  const safeName =
    input.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "upload.bin";
  const storagePath = `${input.organizationId}/permits/${input.permitId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("ehs-attachments")
    .upload(storagePath, input.file, {
      contentType: mime,
      upsert: false,
    });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("permit_attachments")
    .insert({
      organization_id: input.organizationId,
      permit_id: input.permitId,
      file_name: safeName,
      // Legacy NOT NULL column — store path; display uses storage_path + signed URL
      file_url: storagePath,
      storage_path: storagePath,
      content_type: mime,
      file_size: input.file.size,
      uploaded_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "permit.attachment_added",
    entityType: "permit_attachment",
    entityId: data.id,
    newValues: { permit_id: input.permitId, file_name: safeName },
  });

  await supabase.from("permit_history").insert({
    organization_id: input.organizationId,
    permit_id: input.permitId,
    actor_user_id: input.userId,
    event_type: "attachment_added",
    message: `Attachment added: ${safeName}`,
  });

  return data;
}

export async function uploadPermitAttachments(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    permitId: string;
    files: File[];
  },
) {
  if (!input.files.length) throw new Error("Select at least one file");
  if (input.files.length > 12) throw new Error("Maximum 12 files per upload");
  const rows = [];
  for (const file of input.files) {
    rows.push(
      await uploadPermitAttachment(supabase, {
        organizationId: input.organizationId,
        userId: input.userId,
        permitId: input.permitId,
        file,
      }),
    );
  }
  return rows;
}

export async function listPermitAttachmentsWithUrls(
  supabase: SupabaseClient,
  organizationId: string,
  permitId: string,
): Promise<AttachmentView[]> {
  const { data, error } = await supabase
    .from("permit_attachments")
    .select("id, file_name, content_type, file_size, storage_path, file_url, created_at")
    .eq("organization_id", organizationId)
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (row) => {
      const path = row.storage_path || row.file_url;
      const mime = row.content_type || "";
      let url: string | null = null;
      if (path && !path.startsWith("http")) {
        try {
          url = await createSignedAttachmentUrl(supabase, path);
        } catch {
          url = null;
        }
      } else if (path?.startsWith("http")) {
        url = path;
      }
      return {
        id: row.id,
        file_name: row.file_name,
        content_type: row.content_type,
        file_size: row.file_size,
        storage_path: path,
        kind: mime.startsWith("image/") ? ("photo" as const) : ("document" as const),
        created_at: row.created_at,
        url,
      };
    }),
  );
}

export async function uploadReportAttachments(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    files: File[];
  },
) {
  if (!input.files.length) throw new Error("Select at least one file");
  if (input.files.length > 12) throw new Error("Maximum 12 files per upload");
  const rows = [];
  for (const file of input.files) {
    rows.push(
      await uploadReportAttachment(supabase, {
        organizationId: input.organizationId,
        userId: input.userId,
        eventId: input.eventId,
        file,
      }),
    );
  }
  return rows;
}

export async function listReportAttachmentsWithUrls(
  supabase: SupabaseClient,
  organizationId: string,
  eventId: string,
): Promise<AttachmentView[]> {
  const { data, error } = await supabase
    .from("ehs_event_attachments")
    .select("id, file_name, mime_type, file_size, storage_path, kind, created_at")
    .eq("organization_id", organizationId)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (row) => {
      let url: string | null = null;
      try {
        url = await createSignedAttachmentUrl(supabase, row.storage_path);
      } catch {
        url = null;
      }
      const mime = row.mime_type || "";
      return {
        id: row.id,
        file_name: row.file_name,
        content_type: row.mime_type,
        file_size: row.file_size,
        storage_path: row.storage_path,
        kind:
          row.kind === "photo" || mime.startsWith("image/")
            ? ("photo" as const)
            : ("document" as const),
        created_at: row.created_at,
        url,
      };
    }),
  );
}

export async function listCustomFieldDefinitions(
  supabase: SupabaseClient,
  organizationId: string,
  eventTypeId: string,
) {
  const { data, error } = await supabase
    .from("report_custom_field_definitions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("event_type_id", eventTypeId)
    .is("archived_at", null)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertCustomFieldDefinition(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventTypeId: string;
    code: string;
    label: string;
    fieldType: CustomFieldType;
    options?: unknown[];
    required?: boolean;
    helpText?: string;
    sortOrder?: number;
  },
) {
  const { data, error } = await supabase
    .from("report_custom_field_definitions")
    .upsert(
      {
        organization_id: input.organizationId,
        event_type_id: input.eventTypeId,
        code: input.code.trim().toLowerCase().replace(/\s+/g, "_"),
        label: input.label.trim(),
        field_type: input.fieldType,
        options: input.options ?? [],
        is_required: Boolean(input.required),
        help_text: input.helpText ?? null,
        sort_order: input.sortOrder ?? 0,
        is_active: true,
        archived_at: null,
      },
      { onConflict: "organization_id,event_type_id,code" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "report.custom_field_defined",
    entityType: "report_custom_field_definition",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function archiveCustomFieldDefinition(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; id: string },
) {
  const { data, error } = await supabase
    .from("report_custom_field_definitions")
    .update({
      is_active: false,
      archived_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "report.custom_field_archived",
    entityType: "report_custom_field_definition",
    entityId: input.id,
  });
  return data;
}

export async function saveCustomFieldValues(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    eventId: string;
    values: Array<{
      fieldDefinitionId: string;
      valueText?: string | null;
      valueNumber?: number | null;
      valueBoolean?: boolean | null;
      valueDate?: string | null;
      valueJson?: unknown;
    }>;
  },
) {
  for (const row of input.values) {
    const { error } = await supabase.from("report_custom_field_values").upsert(
      {
        organization_id: input.organizationId,
        event_id: input.eventId,
        field_definition_id: row.fieldDefinitionId,
        value_text: row.valueText ?? null,
        value_number: row.valueNumber ?? null,
        value_boolean: row.valueBoolean ?? null,
        value_date: row.valueDate ?? null,
        value_json: row.valueJson ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,field_definition_id" },
    );
    if (error) throw new Error(error.message);
  }
}
