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

/** Mobile cameras often omit MIME; sniff from extension so uploads are not rejected. */
export function resolveUploadMimeType(file: { type?: string; name: string }) {
  const raw = (file.type || "").trim().toLowerCase();
  if (raw && raw !== "application/octet-stream") return raw;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    gif: "image/gif",
    pdf: "application/pdf",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };
  return byExt[ext] || (folderLooksLikeImage(file.name) ? "image/jpeg" : "application/octet-stream");
}

function folderLooksLikeImage(name: string) {
  // Android sometimes sends "image.jpg" or "IMG_…" with empty type and odd names
  return /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(name) || /^IMG_/i.test(name) || /^image$/i.test(name);
}

/** Browser → signed PUT → metadata fields. Does not send file bytes through Next.js. */
export async function attachDirectUpload(formData: FormData, folder: string) {
  const file = firstNonEmptyFile(formData, "media", "media_camera", "media_gallery", "file");
  if (!file) return formData;
  const mimeType = resolveUploadMimeType(file);
  const ticketData = new FormData();
  ticketData.set("fileName", file.name || `photo-${Date.now()}.jpg`);
  ticketData.set("mimeType", mimeType);
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
  formData.set("file_name", file.name || `photo-${Date.now()}.jpg`);
  formData.set("mime_type", mimeType);
  formData.set("file_size", String(file.size));
  return formData;
}

export async function attachDirectUploads(files: File[], folder: string) {
  const uploaded: Array<{ path: string; fileName: string; mimeType: string; fileSize: number }> = [];
  for (const file of files) {
    const mimeType = resolveUploadMimeType(file);
    const ticketData = new FormData();
    ticketData.set("fileName", file.name || `photo-${Date.now()}.jpg`);
    ticketData.set("mimeType", mimeType);
    ticketData.set("fileSize", String(file.size));
    ticketData.set("folder", folder);
    const ticket = await createSignedUploadAction(ticketData);
    if (!ticket.ok) throw new Error(ticket.error);
    await uploadToSignedUrl({ path: ticket.path, token: ticket.token, file });
    uploaded.push({
      path: ticket.path,
      fileName: file.name || `photo-${Date.now()}.jpg`,
      mimeType,
      fileSize: file.size,
    });
  }
  return uploaded;
}
