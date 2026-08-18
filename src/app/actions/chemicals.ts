"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/auth/org-context";
import {
  createChemical,
  uploadSds,
  upsertChemicalInventory,
} from "@/lib/services/chemicals";
import { collectFiles } from "@/lib/services/attachments";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import type { ActionResult } from "@/app/actions/events";

function failed(err: unknown): ActionResult {
  return { ok: false, error: formatSupabaseUserError(err) };
}

export async function createChemicalAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "chemical_sds",
      permission: "chemicals.manage",
    });
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "Chemical name is required" };
    const row = await createChemical(supabase, {
      organizationId: organization.id,
      userId: user.id,
      name,
      casNumber: String(formData.get("casNumber") || "") || undefined,
      hazardClassification: String(formData.get("hazardClassification") || "") || undefined,
      locationId: String(formData.get("locationId") || "") || undefined,
      siteId: String(formData.get("siteId") || "") || undefined,
      unNumber: String(formData.get("unNumber") || "") || undefined,
      manufacturer: String(formData.get("manufacturer") || "") || undefined,
      usageNotes: String(formData.get("usageNotes") || "") || undefined,
      inventoryQty: Number(formData.get("inventoryQty") || 0) || 0,
      inventoryUnit: String(formData.get("inventoryUnit") || "") || undefined,
    });
    revalidatePath("/app/chemicals");
    return { ok: true, id: row.id, href: `/app/chemicals/${row.id}` };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function uploadSdsAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "chemical_sds",
      permission: "chemicals.manage",
    });
    const chemicalId = String(formData.get("chemicalId") || "");
    const files = collectFiles(formData);
    if (!files[0]) return { ok: false, error: "Upload the SDS file. The file is the authoritative SDS." };
    await uploadSds(supabase, {
      organizationId: organization.id,
      userId: user.id,
      chemicalId,
      version: String(formData.get("version") || "") || new Date().toISOString().slice(0, 10),
      file: files[0],
      effectiveFrom: String(formData.get("effectiveFrom") || "") || undefined,
      expiresOn: String(formData.get("expiresOn") || "") || undefined,
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidatePath("/app/chemicals");
    revalidatePath("/app/chemicals/sds");
    revalidatePath(`/app/chemicals/${chemicalId}`);
    revalidatePath("/field/chemicals");
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}

export async function upsertChemicalInventoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user, organization, supabase } = await requireWriteAccess({
      featureCode: "chemical_sds",
      permission: "chemicals.manage",
    });
    const chemicalId = String(formData.get("chemicalId") || "");
    await upsertChemicalInventory(supabase, {
      organizationId: organization.id,
      userId: user.id,
      chemicalId,
      locationId: String(formData.get("locationId") || ""),
      quantity: Number(formData.get("quantity") || 0),
      unit: String(formData.get("unit") || "") || undefined,
    });
    revalidatePath(`/app/chemicals/${chemicalId}`);
    return { ok: true };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return failed(err);
  }
}
