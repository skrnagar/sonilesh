import type { requireModuleAccess } from "@/lib/auth/org-context";
import { listCustomFieldDefinitions } from "@/lib/services/attachments";
import type { ReportTypeCode } from "@/lib/reporting/types";

type Access = Awaited<ReturnType<typeof requireModuleAccess>>;

export async function loadReportFormContext(
  access: Access,
  eventTypeCode: ReportTypeCode,
) {
  const { data: eventType } = await access.supabase
    .from("event_types")
    .select("id")
    .eq("code", eventTypeCode)
    .is("organization_id", null)
    .maybeSingle();

  // Prefer workspace lists already loaded in org context (avoids duplicate unbounded queries).
  const useCachedSites = access.sites.length > 0;
  const useCachedProjects = access.projects.length > 0;

  const [
    sitesRes,
    projectsRes,
    { data: departments },
    { data: locations },
    { data: severities },
    { data: categories },
  ] = await Promise.all([
    useCachedSites
      ? Promise.resolve({ data: access.sites })
      : access.supabase
          .from("sites")
          .select("id, name")
          .eq("organization_id", access.organization.id)
          .is("deleted_at", null)
          .order("name")
          .limit(100),
    useCachedProjects
      ? Promise.resolve({ data: access.projects.map((p) => ({ id: p.id, name: p.name })) })
      : access.supabase
          .from("projects")
          .select("id, name")
          .eq("organization_id", access.organization.id)
          .is("deleted_at", null)
          .order("name")
          .limit(100),
    access.supabase
      .from("departments")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name")
      .limit(80),
    access.supabase
      .from("locations")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name")
      .limit(100),
    access.supabase
      .from("severity_levels")
      .select("id, name")
      .is("organization_id", null)
      .eq("is_active", true)
      .order("rank"),
    eventType
      ? access.supabase
          .from("event_categories")
          .select("id, name")
          .eq("organization_id", access.organization.id)
          .eq("event_type_id", eventType.id)
          .eq("is_active", true)
          .order("name")
          .limit(80)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const sites = sitesRes.data ?? [];
  const projects = projectsRes.data ?? [];

  if (eventType && !(categories ?? []).length) {
    await access.supabase.rpc("seed_org_report_categories", {
      p_organization_id: access.organization.id,
    });
    const refreshed = await access.supabase
      .from("event_categories")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .eq("event_type_id", eventType.id)
      .eq("is_active", true)
      .order("name")
      .limit(80);
    return {
      sites,
      projects,
      departments: departments ?? [],
      locations: locations ?? [],
      severities: severities ?? [],
      categories: refreshed.data ?? [],
      customFields: await listCustomFieldDefinitions(
        access.supabase,
        access.organization.id,
        eventType.id,
      ).catch(() => []),
    };
  }

  const customFields = eventType
    ? await listCustomFieldDefinitions(
        access.supabase,
        access.organization.id,
        eventType.id,
      ).catch(() => [])
    : [];

  return {
    sites,
    projects,
    departments: departments ?? [],
    locations: locations ?? [],
    severities: severities ?? [],
    categories: categories ?? [],
    customFields,
  };
}
