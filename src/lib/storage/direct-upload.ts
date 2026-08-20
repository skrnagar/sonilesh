import { createClient } from "@/lib/supabase/client";
import { createSignedUploadAction } from "@/app/actions/storage";

export async function uploadToSignedUrl(input: {
  path: string;
  token: string;
  file: File;
}) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("ehs-attachments")
    .uploadToSignedUrl(input.path, input.token, input.file);
  if (error) throw new Error(error.message);
  return input.path;
}

function firstNonEmptyFile(formData: FormData, ...keys: string[]) {
  for (const key of keys) {
    for (const value of formData.getAll(key)) {
      if (value instanceof File && value.size > 0) return value;
    }
  }
  return null;
}

/** Browser → signed PUT → metadata fields. Does not send file bytes through Next.js. */
export async function attachDirectUpload(formData: FormData, folder: string) {
  const file = firstNonEmptyFile(formData, "media", "media_camera", "media_gallery", "file");
  if (!file) return formData;
  const ticketData = new FormData();
  ticketData.set("fileName", file.name);
  ticketData.set("mimeType", file.type || "application/octet-stream");
  ticketData.set("fileSize", String(file.size));
  ticketData.set("folder", folder);
  const ticket = await createSignedUploadAction(ticketData);
  if (!ticket.ok) throw new Error(ticket.error);
  await uploadToSignedUrl({ path: ticket.path, token: ticket.token, file });
  formData.delete("media");
  formData.delete("media_camera");
  formData.delete("media_gallery");
  formData.delete("file");
  formData.set("storage_path", ticket.path);
  formData.set("file_name", file.name);
  formData.set("mime_type", file.type || "application/octet-stream");
  formData.set("file_size", String(file.size));
  return formData;
}

export async function attachDirectUploads(files: File[], folder: string) {
  const uploaded: Array<{ path: string; fileName: string; mimeType: string; fileSize: number }> = [];
  for (const file of files) {
    const ticketData = new FormData();
    ticketData.set("fileName", file.name);
    ticketData.set("mimeType", file.type || "application/octet-stream");
    ticketData.set("fileSize", String(file.size));
    ticketData.set("folder", folder);
    const ticket = await createSignedUploadAction(ticketData);
    if (!ticket.ok) throw new Error(ticket.error);
    await uploadToSignedUrl({ path: ticket.path, token: ticket.token, file });
    uploaded.push({
      path: ticket.path,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    });
  }
  return uploaded;
}
