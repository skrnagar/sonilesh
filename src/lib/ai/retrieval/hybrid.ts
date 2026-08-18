import type { AIAuthContext } from "@/lib/ai/permissions";
import type { AICitation } from "@/lib/ai/core/types";
import { wrapUntrustedDocument } from "@/lib/ai/guardrails/injection";
import { redactForModel } from "@/lib/ai/guardrails/redaction";
import { AI_LOOP_LIMITS } from "@/lib/ai/core/config";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hybrid retrieval plan:
 * 1. Structured module queries (incidents, CAPA, …) — preferred for operational facts.
 * 2. Keyword search on current document chunks (tsvector / ilike).
 * 3. Vector search on ai_document_embeddings when pgvector + embeddings exist.
 * Never embed every operational row. Never return superseded versions as current.
 */
export async function searchKnowledge(input: {
  supabase: SupabaseClient;
  ctx: AIAuthContext;
  query: string;
}): Promise<{ citations: AICitation[]; passages: string[] }> {
  const q = input.query.replace(/[%*,]/g, "").trim().slice(0, 200);
  if (!q) return { citations: [], passages: [] };

  const { data: currentDocs } = await input.supabase
    .from("ai_documents")
    .select("id, title, source_type, source_id, is_current, status")
    .eq("organization_id", input.ctx.organizationId)
    .eq("is_current", true)
    .is("deleted_at", null)
    .limit(20);

  const currentIds = (currentDocs ?? []).map((d) => d.id);
  if (!currentIds.length) {
    const fallback = await keywordControlledDocuments(input.supabase, input.ctx.organizationId, q);
    return fallback;
  }

  const { data: chunks } = await input.supabase
    .from("ai_document_chunks")
    .select("id, document_id, content, chunk_index")
    .eq("organization_id", input.ctx.organizationId)
    .in("document_id", currentIds)
    .ilike("content", `%${q}%`)
    .limit(AI_LOOP_LIMITS.maxRetrievedChunks);

  const byId = new Map((currentDocs ?? []).map((d) => [d.id, d]));
  const citations: AICitation[] = [];
  const passages: string[] = [];
  for (const chunk of chunks ?? []) {
    const doc = byId.get(chunk.document_id);
    if (!doc || !doc.is_current) continue;
    citations.push({
      sourceType: doc.source_type,
      sourceId: doc.source_id,
      title: doc.title,
      excerpt: chunk.content.slice(0, 240),
      isCurrent: true,
      confidence: 0.5,
    });
    passages.push(wrapUntrustedDocument(redactForModel(chunk.content), doc.title));
  }
  return { citations, passages };
}

async function keywordControlledDocuments(
  supabase: SupabaseClient,
  organizationId: string,
  q: string,
): Promise<{ citations: AICitation[]; passages: string[] }> {
  const { data } = await supabase
    .from("controlled_documents")
    .select("id, doc_number, title, status, current_version")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .in("status", ["published", "distributed", "approved"])
    .ilike("title", `%${q}%`)
    .limit(8);

  const citations: AICitation[] = (data ?? []).map((row) => ({
    sourceType: "controlled_document",
    sourceId: row.id,
    title: `${row.doc_number ?? ""} ${row.title}`.trim(),
    excerpt: `Current version ${row.current_version ?? "?"} (${row.status})`,
    href: `/app/documents/${row.id}`,
    isCurrent: row.status === "published" || row.status === "distributed",
    confidence: 0.4,
  }));
  return { citations, passages: citations.map((c) => wrapUntrustedDocument(c.excerpt ?? "", c.title)) };
}

export async function vectorSearchAvailable(supabase: SupabaseClient) {
  const { error } = await supabase.from("ai_document_embeddings").select("id").limit(1);
  return !error;
}
