import type { SupabaseClient } from "@supabase/supabase-js";
import {
  filterHitsBySessionOrg,
  sanitizeSearchQuery,
  type SearchHit,
} from "@/lib/compliance/calendar";

type NamedRow = { id: string; organization_id?: string | null; title?: string | null; name?: string | null; code?: string | null };

function hit(
  organizationId: string,
  kind: string,
  row: NamedRow,
  href: string,
  subtitle?: string,
): SearchHit {
  return {
    organization_id: organizationId,
    kind,
    id: row.id,
    title: row.title || row.name || row.code || kind,
    href,
    subtitle,
  };
}

export async function searchCompliance(
  supabase: SupabaseClient,
  sessionOrgId: string,
  rawQuery: string,
  urlOrgId?: string,
): Promise<SearchHit[]> {
  const q = sanitizeSearchQuery(rawQuery);
  if (q.length < 2) return [];
  const like = `%${q}%`;
  const orTitleCode = `title.ilike."${like}",code.ilike."${like}"`;

  const [regulations, obligations, register, requirements, assessments, licenses, evidence, findings, capa] =
    await Promise.all([
      supabase
        .from("regulations")
        .select("id, organization_id, code, title")
        .or(`organization_id.is.null,organization_id.eq.${sessionOrgId}`)
        .or(orTitleCode)
        .limit(15),
      supabase
        .from("compliance_obligations")
        .select("id, code, title")
        .or(orTitleCode)
        .limit(15),
      supabase
        .from("legal_register_entries")
        .select("id, organization_id, title")
        .eq("organization_id", sessionOrgId)
        .ilike("title", like)
        .limit(15),
      supabase
        .from("compliance_requirements")
        .select("id, organization_id, title")
        .eq("organization_id", sessionOrgId)
        .ilike("title", like)
        .limit(15),
      supabase
        .from("compliance_assessments")
        .select("id, organization_id, period_label, notes")
        .eq("organization_id", sessionOrgId)
        .or(`period_label.ilike."${like}",notes.ilike."${like}"`)
        .limit(15),
      supabase
        .from("regulatory_permits")
        .select("id, organization_id, name, license_number")
        .eq("organization_id", sessionOrgId)
        .or(`name.ilike."${like}",license_number.ilike."${like}"`)
        .limit(15),
      supabase
        .from("compliance_evidence")
        .select("id, organization_id, file_name")
        .eq("organization_id", sessionOrgId)
        .ilike("file_name", like)
        .limit(15),
      supabase
        .from("checklist_findings")
        .select("id, organization_id, title")
        .eq("organization_id", sessionOrgId)
        .is("deleted_at", null)
        .ilike("title", like)
        .limit(15),
      supabase
        .from("capa_items")
        .select("id, organization_id, title")
        .eq("organization_id", sessionOrgId)
        .is("deleted_at", null)
        .ilike("title", like)
        .limit(15),
    ]);

  const hits: SearchHit[] = [
    ...(regulations.data ?? []).map((row) =>
      hit(sessionOrgId, "regulation", row, "/app/compliance/regulations", row.code ?? undefined),
    ),
    ...(obligations.data ?? []).map((row) =>
      hit(sessionOrgId, "obligation", row, "/app/settings/compliance-profile", row.code ?? undefined),
    ),
    ...(register.data ?? []).map((row) =>
      hit(sessionOrgId, "legal_register", row, `/app/compliance/legal-register/${row.id}`),
    ),
    ...(requirements.data ?? []).map((row) =>
      hit(sessionOrgId, "requirement", row, "/app/compliance/requirements"),
    ),
    ...(assessments.data ?? []).map((row) =>
      hit(
        sessionOrgId,
        "assessment",
        { id: row.id, title: row.period_label },
        "/app/compliance/assessments",
      ),
    ),
    ...(licenses.data ?? []).map((row) =>
      hit(
        sessionOrgId,
        "license",
        { id: row.id, title: row.name },
        "/app/compliance/licenses",
        row.license_number ?? undefined,
      ),
    ),
    ...(evidence.data ?? []).map((row) =>
      hit(sessionOrgId, "evidence", { id: row.id, title: row.file_name }, "/app/compliance/expiry"),
    ),
    ...(findings.data ?? []).map((row) =>
      hit(sessionOrgId, "finding", row, "/app/findings"),
    ),
    ...(capa.data ?? []).map((row) => hit(sessionOrgId, "capa", row, "/app/capa")),
  ];

  return filterHitsBySessionOrg(hits, sessionOrgId, urlOrgId);
}
