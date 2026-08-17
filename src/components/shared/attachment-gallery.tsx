"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/app/actions/events";
import type { AttachmentView } from "@/lib/services/attachments";
import { Button } from "@/components/ui/button";

export function AttachmentGallery({ items }: { items: AttachmentView[] }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No photos or files yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <figure
          key={item.id}
          className="overflow-hidden rounded-xl border border-border bg-muted/20"
        >
          {item.kind === "photo" && item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer">
              {/* Signed URLs from Supabase Storage — next/image remote patterns vary by project */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.file_name}
                className="aspect-video w-full object-cover"
              />
            </a>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-muted/40 p-4 text-center text-sm text-muted-foreground">
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="text-accent underline">
                  {item.file_name}
                </a>
              ) : (
                item.file_name
              )}
            </div>
          )}
          <figcaption className="truncate px-3 py-2 text-xs text-muted-foreground">
            {item.file_name}
            {item.file_size != null ? ` · ${Math.round(item.file_size / 1024)} KB` : ""}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function MultiFileUploadForm({
  action,
  organizationId,
  entityFieldName,
  entityId,
  label = "Photos / files",
  accept = "image/jpeg,image/png,image/webp,image/gif,application/pdf",
  extraFields,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  organizationId: string;
  entityFieldName: "permitId" | "eventId" | "assignmentId";
  entityId: string;
  label?: string;
  accept?: string;
  extraFields?: Record<string, string>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      })),
    [files],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!files.length) {
      setError("Select at least one file");
      return;
    }
    const formData = new FormData();
    formData.set("organizationId", organizationId);
    formData.set(entityFieldName, entityId);
    if (extraFields) {
      for (const [k, v] of Object.entries(extraFields)) formData.set(k, v);
    }
    for (const file of files) formData.append("files", file);

    setPending(true);
    setError(null);
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFiles([]);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">{label}</span>
        <input
          type="file"
          multiple
          accept={accept}
          disabled={pending}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      {previews.length ? (
        <ul className="flex flex-wrap gap-2">
          {previews.map((p) => (
            <li
              key={p.name}
              className="flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-xs"
            >
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : null}
              <span className="max-w-[10rem] truncate">{p.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <Button type="submit" disabled={pending || !files.length}>
        {pending ? "Uploading…" : `Upload ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
      </Button>
      {error ? (
        <p className="rounded-md border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger-ink)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
