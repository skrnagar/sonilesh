"use server";

import { requireOrgContext } from "@/lib/auth/org-context";
import {
  createSignedUploadTicket,
  validateAttachmentFile,
} from "@/lib/services/attachments";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";

export type SignedUploadResult =
  | { ok: true; path: string; token: string; signedUrl: string }
  | { ok: false; error: string };

export async function createSignedUploadAction(formData: FormData): Promise<SignedUploadResult> {
  try {
    const { supabase, organization } = await requireOrgContext();
    const fileName = String(formData.get("fileName") || "upload.bin");
    const mime = String(formData.get("mimeType") || "application/octet-stream");
    const size = Number(formData.get("fileSize") || 0);
    const folder = String(formData.get("folder") || "uploads");
    validateAttachmentFile({ name: fileName, type: mime, size });
    const ticket = await createSignedUploadTicket(supabase, {
      organizationId: organization.id,
      folder,
      fileName,
    });
    return { ok: true, ...ticket };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, error: formatSupabaseUserError(err) };
  }
}
