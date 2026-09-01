"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { canAccessOrganization, canAccessSite } from "@/lib/auth/access";
import {
  ORG_COOKIE,
  BUSINESS_UNIT_COOKIE,
  REGION_COOKIE,
  PROJECT_COOKIE,
  SITE_COOKIE,
  WORKSPACE_COOKIE_OPTIONS,
} from "@/lib/auth/workspace-cookies";

export async function switchOrganizationAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") || "");
  const { supabase, user } = await requireUser();
  if (!organizationId) return;
  const allowed = await canAccessOrganization(supabase, organizationId, user.id);
  if (!allowed) throw new Error("You cannot access that organization");

  const jar = await cookies();
  jar.set(ORG_COOKIE, organizationId, WORKSPACE_COOKIE_OPTIONS);
  jar.delete(BUSINESS_UNIT_COOKIE);
  jar.delete(REGION_COOKIE);
  jar.delete(SITE_COOKIE);
  jar.delete(PROJECT_COOKIE);
  revalidatePath("/", "layout");
}

export async function setBusinessUnitContextAction(formData: FormData) {
  const businessUnitId = String(formData.get("businessUnitId") || "");
  const organizationId = String(formData.get("organizationId") || "");
  const { supabase } = await requireUser();
  const jar = await cookies();
  if (!businessUnitId) {
    jar.delete(BUSINESS_UNIT_COOKIE);
    jar.delete(REGION_COOKIE);
    jar.delete(SITE_COOKIE);
    jar.delete(PROJECT_COOKIE);
    revalidatePath("/", "layout");
    return;
  }
  const { data: bu } = await supabase
    .from("business_units")
    .select("id")
    .eq("id", businessUnitId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!bu) throw new Error("Business unit not found in this organization");
  jar.set(BUSINESS_UNIT_COOKIE, businessUnitId, WORKSPACE_COOKIE_OPTIONS);
  jar.delete(REGION_COOKIE);
  jar.delete(SITE_COOKIE);
  jar.delete(PROJECT_COOKIE);
  revalidatePath("/", "layout");
}

export async function setRegionContextAction(formData: FormData) {
  const regionId = String(formData.get("regionId") || "");
  const organizationId = String(formData.get("organizationId") || "");
  const { supabase } = await requireUser();
  const jar = await cookies();
  if (!regionId) {
    jar.delete(REGION_COOKIE);
    jar.delete(SITE_COOKIE);
    jar.delete(PROJECT_COOKIE);
    revalidatePath("/", "layout");
    return;
  }
  const { data: region } = await supabase
    .from("regions")
    .select("id")
    .eq("id", regionId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!region) throw new Error("Region not found in this organization");
  jar.set(REGION_COOKIE, regionId, WORKSPACE_COOKIE_OPTIONS);
  jar.delete(SITE_COOKIE);
  jar.delete(PROJECT_COOKIE);
  revalidatePath("/", "layout");
}

export async function setSiteContextAction(formData: FormData) {
  const siteId = String(formData.get("siteId") || "");
  const organizationId = String(formData.get("organizationId") || "");
  const { supabase, user } = await requireUser();
  const jar = await cookies();
  if (!siteId) {
    jar.delete(SITE_COOKIE);
    revalidatePath("/", "layout");
    return;
  }
  const allowed = await canAccessSite(supabase, organizationId, user.id, siteId);
  if (!allowed) throw new Error("You cannot access that site");
  jar.set(SITE_COOKIE, siteId, WORKSPACE_COOKIE_OPTIONS);
  revalidatePath("/", "layout");
}

export async function setProjectContextAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const organizationId = String(formData.get("organizationId") || "");
  const { supabase } = await requireUser();
  const jar = await cookies();
  if (!projectId) {
    jar.delete(PROJECT_COOKIE);
    revalidatePath("/", "layout");
    return;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) throw new Error("Project not found in this organization");

  jar.set(PROJECT_COOKIE, projectId, WORKSPACE_COOKIE_OPTIONS);
  revalidatePath("/", "layout");
}
