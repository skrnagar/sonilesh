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

  const [
    { data: sites },
    { data: projects },
    { data: departments },
    { data: locations },
    { data: severities },
    { data: categories },
  ] = await Promise.all([
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
    access.supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
    access.supabase
      .from("departments")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
    access.supabase
      .from("locations")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .order("name"),
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
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

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
      .order("name");
    return {
      sites: sites ?? [],
      projects: projects ?? [],
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
    sites: sites ?? [],
    projects: projects ?? [],
    departments: departments ?? [],
    locations: locations ?? [],
    severities: severities ?? [],
    categories: categories ?? [],
    customFields,
  };
}
