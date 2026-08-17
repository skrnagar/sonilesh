import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import {
  assertPrivateAttachmentPath,
  createSignedAttachmentUrl,
  uploadEntityAttachment,
} from "@/lib/services/attachments";
import { requireFeature } from "@/lib/services/entitlements";
import { notifyUsers } from "@/lib/services/notifications";
import { requirePermission } from "@/lib/services/rbac";

export const DOCUMENT_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "published",
  "distributed",
  "expired",
  "obsolete",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ["in_review", "obsolete"],
  in_review: ["approved", "draft", "obsolete"],
  approved: ["published", "in_review", "obsolete"],
  published: ["distributed", "obsolete", "expired"],
  distributed: ["obsolete", "expired"],
  expired: ["obsolete", "in_review"],
  obsolete: [],
};

export const VERSION_STATUSES = ["draft", "in_review", "approved", "published", "superseded"] as const;
export type VersionStatus = (typeof VERSION_STATUSES)[number];

export const DOCUMENT_LINK_SOURCE_TYPES = [
  "moc",
  "chemical",
  "ppe",
  "contractor_document",
  "permit",
  "incident",
  "training",
  "capa",
  "checklist",
] as const;

const EXAMPLE_DOCUMENT_TYPES = [
  { code: "policy", name: "Policy", requires_acknowledgement: true, review_interval_days: 365 },
  { code: "procedure", name: "Procedure", requires_acknowledgement: true, review_interval_days: 365 },
  { code: "sop", name: "SOP", requires_acknowledgement: true, review_interval_days: 180 },
  { code: "work_instruction", name: "Work instruction", requires_acknowledgement: false, review_interval_days: 180 },
  { code: "form", name: "Form", requires_acknowledgement: false, review_interval_days: 365 },
  { code: "manual", name: "Manual", requires_acknowledgement: false, review_interval_days: 365 },
] as const;

const EXAMPLE_CLASSIFICATIONS = [
  { code: "unrestricted", name: "Unrestricted" },
  { code: "internal", name: "Internal" },
  { code: "confidential", name: "Confidential" },
  { code: "controlled", name: "Controlled" },
] as const;

export function canTransitionDocument(from: string, to: string) {
  return DOCUMENT_TRANSITIONS[from as DocumentStatus]?.includes(to as DocumentStatus) ?? false;
}

export function assertOrgMatch(rowOrgId: string | null | undefined, organizationId: string, label = "Record") {
  if (!rowOrgId || rowOrgId !== organizationId) {
    throw new Error(`${label} not found in this organization`);
  }
}

export function assertVersionMutable(status: string) {
  if (status === "published" || status === "superseded") {
    throw new Error("Cannot modify a historical published version");
  }
}

async function requireDocuments(supabase: SupabaseClient, organizationId: string, userId: string, permission: string) {
  await requireFeature(supabase, organizationId, "document_control");
  await requirePermission(supabase, organizationId, userId, permission);
}

export async function ensureDefaultDocumentConfig(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const [{ data: types }, { data: classes }] = await Promise.all([
    supabase.from("document_types").select("id").eq("organization_id", organizationId).limit(1),
    supabase.from("document_classifications").select("id").eq("organization_id", organizationId).limit(1),
  ]);
  if (!types?.length) {
    await supabase.from("document_types").insert(
      EXAMPLE_DOCUMENT_TYPES.map((t, i) => ({
        organization_id: organizationId,
        code: t.code,
        name: t.name,
        requires_acknowledgement: t.requires_acknowledgement,
        review_interval_days: t.review_interval_days,
        sort_order: i,
      })),
    );
  }
  if (!classes?.length) {
    await supabase.from("document_classifications").insert(
      EXAMPLE_CLASSIFICATIONS.map((c, i) => ({
        organization_id: organizationId,
        code: c.code,
        name: c.name,
        sort_order: i,
      })),
    );
  }
}

export async function listDocumentTypes(supabase: SupabaseClient, organizationId: string) {
  await ensureDefaultDocumentConfig(supabase, organizationId);
  const { data, error } = await supabase
    .from("document_types")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listDocumentClassifications(supabase: SupabaseClient, organizationId: string) {
  await ensureDefaultDocumentConfig(supabase, organizationId);
  const { data, error } = await supabase
    .from("document_classifications")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDocumentMetrics(supabase: SupabaseClient, organizationId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [all, draft, review, published, obsolete, pendingAck] = await Promise.all([
    supabase.from("controlled_documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("controlled_documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "draft").is("deleted_at", null),
    supabase.from("controlled_documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "in_review").is("deleted_at", null),
    supabase.from("controlled_documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["approved", "published", "distributed"]).is("deleted_at", null),
    supabase.from("controlled_documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["expired", "obsolete"]).is("deleted_at", null),
    supabase.from("document_acknowledgements").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
  ]);
  const { data: expiring } = await supabase
    .from("controlled_documents")
    .select("id, expires_on, review_due_on")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .or(`expires_on.gte.${today},review_due_on.gte.${today}`);
  void pendingAck;
  return {
    total: all.count ?? 0,
    draft: draft.count ?? 0,
    inReview: review.count ?? 0,
    published: published.count ?? 0,
    obsolete: obsolete.count ?? 0,
    expiring: (expiring ?? []).filter((d) => (d.expires_on && d.expires_on <= today) || (d.review_due_on && d.review_due_on <= today)).length,
  };
}

export async function listDocuments(
  supabase: SupabaseClient,
  organizationId: string,
  opts?: { status?: string; tag?: string; limit?: number },
) {
  let q = supabase
    .from("controlled_documents")
    .select(
      "id, doc_number, title, status, current_version, expires_on, review_due_on, tags, acknowledgement_required, document_types:document_type_id(code, name), document_classifications:classification_id(code, name)",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(opts?.limit ?? 80);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.tag) q = q.contains("tags", [opts.tag]);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDocumentBundle(
  supabase: SupabaseClient,
  organizationId: string,
  documentId: string,
) {
  const { data: doc, error } = await supabase
    .from("controlled_documents")
    .select(
      "*, document_types:document_type_id(code, name, requires_acknowledgement), document_classifications:classification_id(code, name)",
    )
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!doc) return null;

  const [versions, acks, links, distribution, approvals, reviews] = await Promise.all([
    supabase
      .from("document_versions")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("document_id", documentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("document_acknowledgements")
      .select("id, user_id, acknowledged_at, version_id, profiles:user_id(full_name, email)")
      .eq("organization_id", organizationId)
      .eq("document_id", documentId)
      .order("acknowledged_at", { ascending: false }),
    supabase
      .from("document_links")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("document_id", documentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("document_distribution")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("document_id", documentId),
    supabase
      .from("document_approvals")
      .select("*, profiles:approver_id(full_name, email)")
      .eq("organization_id", organizationId)
      .eq("document_id", documentId)
      .order("decided_at", { ascending: false }),
    supabase
      .from("document_reviews")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("document_id", documentId)
      .order("created_at", { ascending: false }),
  ]);

  const versionRows = versions.data ?? [];
  const versionsWithUrls = await Promise.all(
    versionRows.map(async (row) => {
      const path = row.storage_path || row.file_url;
      let url: string | null = null;
      if (path && !/^https?:\/\//i.test(path)) {
        try {
          url = await createSignedAttachmentUrl(supabase, path);
        } catch {
          url = null;
        }
      }
      return { ...row, signed_url: url };
    }),
  );

  return {
    document: doc,
    versions: versionsWithUrls,
    acknowledgements: acks.data ?? [],
    links: links.data ?? [],
    distribution: distribution.data ?? [],
    approvals: approvals.data ?? [],
    reviews: reviews.data ?? [],
  };
}

export async function createControlledDocument(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    title: string;
    docNumber?: string;
    documentTypeId?: string;
    classificationId?: string;
    tags?: string[];
    ownerId?: string;
    siteId?: string;
    expiresOn?: string;
    reviewDueOn?: string;
    acknowledgementRequired?: boolean;
    notes?: string;
  },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.manage");
  const title = input.title.trim();
  if (title.length < 2) throw new Error("Title is required");

  let docNumber = input.docNumber?.trim();
  if (!docNumber) {
    const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
      p_organization_id: input.organizationId,
      p_sequence_key: "document",
      p_prefix: "DOC-",
    });
    if (numErr) throw new Error(numErr.message);
    docNumber = number as string;
  }

  const { data, error } = await supabase
    .from("controlled_documents")
    .insert({
      organization_id: input.organizationId,
      doc_number: docNumber,
      title,
      status: "draft",
      document_type_id: input.documentTypeId || null,
      classification_id: input.classificationId || null,
      tags: input.tags ?? [],
      owner_id: input.ownerId || input.userId,
      site_id: input.siteId || null,
      expires_on: input.expiresOn || null,
      review_due_on: input.reviewDueOn || null,
      acknowledgement_required: Boolean(input.acknowledgementRequired),
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "document.created",
    entityType: "controlled_document",
    entityId: data.id,
    newValues: { doc_number: data.doc_number, title },
  });
  return data;
}

export async function updateControlledDocument(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    documentId: string;
    title?: string;
    tags?: string[];
    ownerId?: string;
    expiresOn?: string | null;
    reviewDueOn?: string | null;
    acknowledgementRequired?: boolean;
    notes?: string;
    documentTypeId?: string | null;
    classificationId?: string | null;
  },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.manage");
  const { data: existing } = await supabase
    .from("controlled_documents")
    .select("id, organization_id, status")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) throw new Error("Document not found in this organization");
  if (existing.status === "obsolete") throw new Error("Obsolete documents cannot be edited");

  const { data, error } = await supabase
    .from("controlled_documents")
    .update({
      title: input.title?.trim() || undefined,
      tags: input.tags,
      owner_id: input.ownerId,
      expires_on: input.expiresOn,
      review_due_on: input.reviewDueOn,
      acknowledgement_required: input.acknowledgementRequired,
      notes: input.notes,
      document_type_id: input.documentTypeId,
      classification_id: input.classificationId,
    })
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addDocumentVersion(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    documentId: string;
    version?: string;
    changeSummary?: string;
    file?: File;
  },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.manage");
  const { data: doc } = await supabase
    .from("controlled_documents")
    .select("id, organization_id, status")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) throw new Error("Document not found in this organization");

  const { data: existingVersions } = await supabase
    .from("document_versions")
    .select("version")
    .eq("document_id", input.documentId)
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .limit(20);
  const next = input.version?.trim() || suggestNextVersion(existingVersions?.map((v) => v.version) ?? []);

  const { data: version, error } = await supabase
    .from("document_versions")
    .insert({
      organization_id: input.organizationId,
      document_id: input.documentId,
      version: next,
      status: "draft",
      change_summary: input.changeSummary ?? null,
      created_by: input.userId,
      is_current: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (input.file) {
    const attachment = await uploadEntityAttachment(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      entityType: "document_version",
      entityId: version.id,
      file: input.file,
    });
    assertPrivateAttachmentPath(attachment.storage_path);
    const { error: updErr } = await supabase
      .from("document_versions")
      .update({
        storage_path: attachment.storage_path,
        file_url: attachment.storage_path,
        file_name: attachment.file_name,
        mime_type: attachment.mime_type,
        file_size: attachment.file_size,
        attachment_id: attachment.id,
      })
      .eq("id", version.id)
      .eq("organization_id", input.organizationId);
    if (updErr) throw new Error(updErr.message);
  }

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "document.version_added",
    entityType: "document_version",
    entityId: version.id,
    newValues: { document_id: input.documentId, version: next },
  });
  return version;
}

export function suggestNextVersion(existing: string[]) {
  const nums = existing
    .map((v) => Number(String(v).replace(/^v/i, "").split(".")[0]))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1);
}

export async function submitDocumentVersion(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; versionId: string },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.manage");
  const version = await getVersionOrThrow(supabase, input.organizationId, input.versionId);
  assertVersionMutable(version.status);
  const { data, error } = await supabase
    .from("document_versions")
    .update({ status: "in_review" })
    .eq("id", version.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabase
    .from("controlled_documents")
    .update({ status: "in_review" })
    .eq("id", version.document_id)
    .eq("organization_id", input.organizationId);
  return data;
}

export async function decideDocumentVersion(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    versionId: string;
    decision: "approved" | "rejected";
    comments?: string;
  },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.approve");
  const version = await getVersionOrThrow(supabase, input.organizationId, input.versionId);
  assertVersionMutable(version.status);
  if (version.created_by === input.userId) {
    throw new Error("Cannot approve your own document version");
  }

  const nextStatus = input.decision === "approved" ? "approved" : "draft";
  const { data, error } = await supabase
    .from("document_versions")
    .update({
      status: nextStatus,
      approved_by: input.decision === "approved" ? input.userId : null,
      approved_at: input.decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", version.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("document_approvals").insert({
    organization_id: input.organizationId,
    document_id: version.document_id,
    version_id: version.id,
    approver_id: input.userId,
    decision: input.decision,
    comments: input.comments ?? null,
  });

  await supabase
    .from("controlled_documents")
    .update({ status: input.decision === "approved" ? "approved" : "draft" })
    .eq("id", version.document_id)
    .eq("organization_id", input.organizationId);

  return data;
}

export async function publishDocumentVersion(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; versionId: string },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.manage");
  const version = await getVersionOrThrow(supabase, input.organizationId, input.versionId);
  if (version.status !== "approved") {
    throw new Error("Only an approved version can be published");
  }

  await supabase
    .from("document_versions")
    .update({ status: "superseded", is_current: false })
    .eq("document_id", version.document_id)
    .eq("organization_id", input.organizationId)
    .eq("status", "published");

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("document_versions")
    .update({
      status: "published",
      is_current: true,
      published_at: now,
    })
    .eq("id", version.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("controlled_documents")
    .update({
      status: "published",
      current_version: version.version,
      current_version_id: version.id,
      published_at: now,
    })
    .eq("id", version.document_id)
    .eq("organization_id", input.organizationId);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "document.published",
    entityType: "document_version",
    entityId: version.id,
  });
  return data;
}

export async function distributeDocument(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    documentId: string;
    audienceType: "org" | "role" | "site" | "user";
    audienceKey: string;
    notifyUserIds?: string[];
  },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.manage");
  const { data: doc } = await supabase
    .from("controlled_documents")
    .select("id, title, current_version_id, status")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) throw new Error("Document not found in this organization");

  const { data, error } = await supabase
    .from("document_distribution")
    .insert({
      organization_id: input.organizationId,
      document_id: input.documentId,
      version_id: doc.current_version_id,
      audience_type: input.audienceType,
      audience_key: input.audienceKey,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (doc.status === "published") {
    await supabase
      .from("controlled_documents")
      .update({ status: "distributed" })
      .eq("id", input.documentId)
      .eq("organization_id", input.organizationId);
  }

  if (input.notifyUserIds?.length) {
    await notifyUsers(supabase, {
      organizationId: input.organizationId,
      userIds: input.notifyUserIds,
      title: `Document distributed: ${doc.title}`,
      body: "A controlled document requires your attention.",
      link: `/app/documents/${input.documentId}`,
      actorUserId: input.userId,
      eventKey: "document.distributed",
    });
  }
  return data;
}

export async function acknowledgeDocument(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; documentId: string; versionId?: string },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.acknowledge");
  const { data: doc } = await supabase
    .from("controlled_documents")
    .select("id, current_version_id")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) throw new Error("Document not found in this organization");

  const { data, error } = await supabase
    .from("document_acknowledgements")
    .insert({
      organization_id: input.organizationId,
      document_id: input.documentId,
      user_id: input.userId,
      version_id: input.versionId || doc.current_version_id,
      acknowledged_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function scheduleDocumentReview(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    documentId: string;
    dueOn: string;
    reviewerId?: string;
  },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.manage");
  const { data: doc } = await supabase
    .from("controlled_documents")
    .select("id, current_version_id")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) throw new Error("Document not found in this organization");

  const { data, error } = await supabase
    .from("document_reviews")
    .insert({
      organization_id: input.organizationId,
      document_id: input.documentId,
      version_id: doc.current_version_id,
      reviewer_id: input.reviewerId || input.userId,
      due_on: input.dueOn,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("controlled_documents")
    .update({ review_due_on: input.dueOn })
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId);

  if (input.reviewerId && input.reviewerId !== input.userId) {
    await notifyUsers(supabase, {
      organizationId: input.organizationId,
      userIds: [input.reviewerId],
      title: "Document review assigned",
      link: `/app/documents/${input.documentId}`,
      actorUserId: input.userId,
      eventKey: "document.review",
    });
  }
  return data;
}

export async function linkDocument(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    documentId: string;
    sourceType: string;
    sourceId: string;
  },
) {
  await requireDocuments(supabase, input.organizationId, input.userId, "documents.manage");
  if (!(DOCUMENT_LINK_SOURCE_TYPES as readonly string[]).includes(input.sourceType)) {
    throw new Error("Unsupported document link source");
  }
  const { data: doc } = await supabase
    .from("controlled_documents")
    .select("id")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) throw new Error("Document not found in this organization");

  const { data, error } = await supabase
    .from("document_links")
    .insert({
      organization_id: input.organizationId,
      document_id: input.documentId,
      source_type: input.sourceType,
      source_id: input.sourceId,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listLinkedDocuments(
  supabase: SupabaseClient,
  organizationId: string,
  sourceType: string,
  sourceId: string,
) {
  const { data, error } = await supabase
    .from("document_links")
    .select("id, document_id, source_type, source_id, controlled_documents:document_id(id, doc_number, title, status, current_version)")
    .eq("organization_id", organizationId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getVersionOrThrow(
  supabase: SupabaseClient,
  organizationId: string,
  versionId: string,
) {
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("id", versionId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Version not found in this organization");
  return data;
}
