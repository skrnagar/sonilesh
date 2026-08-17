import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_EXPIRY_WARNING_DAYS = 30;

export function resolveExpiryWarningDays(settings: {
  expiry_warning_days?: number | null;
  settings?: unknown;
} | null | undefined) {
  const fromColumn = Number(settings?.expiry_warning_days);
  if (Number.isFinite(fromColumn) && fromColumn >= 1 && fromColumn <= 365) {
    return Math.floor(fromColumn);
  }
  const blob = settings?.settings;
  if (blob && typeof blob === "object") {
    const nested = Number((blob as Record<string, unknown>).expiry_warning_days);
    if (Number.isFinite(nested) && nested >= 1 && nested <= 365) {
      return Math.floor(nested);
    }
  }
  return DEFAULT_EXPIRY_WARNING_DAYS;
}

export function isExpiringWithin(dateValue: string | null | undefined, warningDays: number, now = new Date()) {
  if (!dateValue) return false;
  const due = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(due.getTime())) return false;
  const horizon = new Date(now);
  horizon.setUTCDate(horizon.getUTCDate() + warningDays);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return due.getTime() <= horizon.getTime() && due.getTime() >= today.getTime() - 86400000;
}

export function isExpired(dateValue: string | null | undefined, now = new Date()) {
  if (!dateValue) return false;
  const today = now.toISOString().slice(0, 10);
  return dateValue < today;
}

export type ExpiryItem = {
  id: string;
  kind: "document" | "sds" | "ppe" | "contractor_document" | "training";
  title: string;
  subtitle: string | null;
  expiresOn: string;
  href: string;
  status: "expired" | "expiring";
};

export async function loadExpiryWarningDays(supabase: SupabaseClient, organizationId: string) {
  const { data } = await supabase
    .from("organization_settings")
    .select("expiry_warning_days, settings")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return resolveExpiryWarningDays(data);
}

export async function listExpiringItems(
  supabase: SupabaseClient,
  organizationId: string,
  warningDays?: number,
): Promise<ExpiryItem[]> {
  const days = warningDays ?? (await loadExpiryWarningDays(supabase, organizationId));
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + days);
  const until = horizon.toISOString().slice(0, 10);

  const [docs, sds, ppe, contractor, training] = await Promise.all([
    supabase
      .from("controlled_documents")
      .select("id, doc_number, title, expires_on, review_due_on")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .or(`expires_on.lte.${until},review_due_on.lte.${until}`),
    supabase
      .from("chemical_sds")
      .select("id, version, expires_on, chemicals:chemical_id(id, name)")
      .eq("organization_id", organizationId)
      .eq("is_current", true)
      .lte("expires_on", until),
    supabase
      .from("ppe_issuances")
      .select("id, expires_on, ppe_items:item_id(name), profiles:user_id(full_name)")
      .eq("organization_id", organizationId)
      .eq("status", "issued")
      .lte("expires_on", until),
    supabase
      .from("contractor_documents")
      .select("id, title, doc_type, expires_on")
      .eq("organization_id", organizationId)
      .lte("expires_on", until),
    supabase
      .from("training_assignments")
      .select("id, expires_at, status, training_courses:course_id(title)")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .lte("expires_at", until),
  ]);

  const items: ExpiryItem[] = [];

  for (const row of docs.data ?? []) {
    const date = row.expires_on || row.review_due_on;
    if (!date || date > until) continue;
    items.push({
      id: row.id,
      kind: "document",
      title: `${row.doc_number} ${row.title}`,
      subtitle: row.expires_on ? "Document expiry" : "Review due",
      expiresOn: date,
      href: `/app/documents/${row.id}`,
      status: isExpired(date) ? "expired" : "expiring",
    });
  }

  for (const row of sds.data ?? []) {
    if (!row.expires_on) continue;
    const chem = row.chemicals as { id?: string; name?: string } | null;
    items.push({
      id: row.id,
      kind: "sds",
      title: `${chem?.name ?? "Chemical"} SDS ${row.version}`,
      subtitle: "Safety data sheet",
      expiresOn: row.expires_on,
      href: chem?.id ? `/app/chemicals/${chem.id}` : "/app/chemicals/sds",
      status: isExpired(row.expires_on) ? "expired" : "expiring",
    });
  }

  for (const row of ppe.data ?? []) {
    if (!row.expires_on) continue;
    const item = row.ppe_items as { name?: string } | null;
    const person = row.profiles as { full_name?: string } | null;
    items.push({
      id: row.id,
      kind: "ppe",
      title: item?.name ?? "PPE",
      subtitle: person?.full_name ?? null,
      expiresOn: row.expires_on,
      href: "/app/ppe",
      status: isExpired(row.expires_on) ? "expired" : "expiring",
    });
  }

  for (const row of contractor.data ?? []) {
    if (!row.expires_on) continue;
    items.push({
      id: row.id,
      kind: "contractor_document",
      title: row.title,
      subtitle: row.doc_type,
      expiresOn: row.expires_on,
      href: "/app/contractors",
      status: isExpired(row.expires_on) ? "expired" : "expiring",
    });
  }

  for (const row of training.data ?? []) {
    if (!row.expires_at) continue;
    const course = row.training_courses as { title?: string } | null;
    items.push({
      id: row.id,
      kind: "training",
      title: course?.title ?? "Training",
      subtitle: row.status,
      expiresOn: row.expires_at,
      href: "/app/training",
      status: isExpired(row.expires_at) ? "expired" : "expiring",
    });
  }

  void today;
  return items.sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
}
