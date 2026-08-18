const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\d{10}|\d{3}[-.\s]\d{3}[-.\s]\d{4})\b/g;

export function redactForModel(text: string, opts?: { emails?: boolean; phones?: boolean }) {
  let next = text;
  if (opts?.emails !== false) next = next.replace(EMAIL, "[redacted-email]");
  if (opts?.phones !== false) next = next.replace(PHONE, "[redacted-phone]");
  return next;
}

export function minimizeRows<T extends Record<string, unknown>>(rows: T[], keep: string[]) {
  return rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const key of keep) {
      if (key in row) next[key] = row[key];
    }
    return next as Partial<T>;
  });
}
