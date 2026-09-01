const KEY = "sonil-field-offline-queue";

export type QueuedFieldUpdate = {
  id: string;
  createdAt: string;
  label: string;
  entries: Array<[string, string]>;
};

export function readFieldQueue(): QueuedFieldUpdate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as QueuedFieldUpdate[];
  } catch {
    return [];
  }
}

export function enqueueFieldUpdate(label: string, formData: FormData) {
  const entries: Array<[string, string]> = [];
  formData.forEach((value, key) => {
    // LIMITATION (P2): File/Blob inputs are skipped — offline queue preserves text fields only.
    // Photos must be submitted online or re-attached after sync.
    if (typeof value === "string") entries.push([key, value]);
  });
  const item: QueuedFieldUpdate = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    label,
    entries,
  };
  const next = [...readFieldQueue(), item];
  localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function removeFieldQueueItem(id: string) {
  localStorage.setItem(KEY, JSON.stringify(readFieldQueue().filter((row) => row.id !== id)));
}

export function queueToFormData(item: QueuedFieldUpdate) {
  const formData = new FormData();
  for (const [key, value] of item.entries) formData.append(key, value);
  return formData;
}
