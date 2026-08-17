"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { requireOrgContext } from "@/lib/auth/org-context";
import {
  createPpeItem,
  issuePpe,
  returnPpe,
  schedulePpeInspection,
} from "@/lib/services/ppe";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

export async function createPpeItemAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "PPE name is required" };
    await createPpeItem(supabase, {
      organizationId: organization.id,
      userId: user.id,
      name,
      categoryId: String(formData.get("categoryId") || "") || undefined,
      sku: String(formData.get("sku") || "") || undefined,
      inventoryQty: Number(formData.get("inventoryQty") || 0) || 0,
      minStock: Number(formData.get("minStock") || 0) || 0,
      siteId: String(formData.get("siteId") || "") || undefined,
      sizeLabel: String(formData.get("sizeLabel") || "") || undefined,
    });
    revalidatePath("/app/ppe");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function issuePpeAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await issuePpe(supabase, {
      organizationId: organization.id,
      userId: user.id,
      itemId: String(formData.get("itemId") || ""),
      recipientUserId: String(formData.get("recipientUserId") || ""),
      siteId: String(formData.get("siteId") || "") || undefined,
      expiresOn: String(formData.get("expiresOn") || "") || undefined,
      quantity: Number(formData.get("quantity") || 1) || 1,
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidatePath("/app/ppe");
    revalidatePath("/field/ppe");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function returnPpeAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    await returnPpe(supabase, {
      organizationId: organization.id,
      userId: user.id,
      issuanceId: String(formData.get("issuanceId") || ""),
      notes: String(formData.get("notes") || "") || undefined,
      replace: formData.get("replace") === "on",
    });
    revalidatePath("/app/ppe");
    revalidatePath("/field/ppe");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function schedulePpeInspectionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await requireUser();
    const { organization, supabase } = await requireOrgContext();
    const { assignment } = await schedulePpeInspection(supabase, {
      organizationId: organization.id,
      userId: user.id,
      itemId: String(formData.get("itemId") || ""),
      templateId: String(formData.get("templateId") || ""),
      issuanceId: String(formData.get("issuanceId") || "") || undefined,
      dueDate: String(formData.get("dueDate") || "") || undefined,
    });
    revalidatePath("/app/ppe");
    revalidatePath("/app/inspections");
    return { ok: true, href: `/app/inspections/${assignment.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
