"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { canAccessOrganization, canAccessSite } from "@/lib/auth/access";
import {
  ORG_COOKIE,
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
