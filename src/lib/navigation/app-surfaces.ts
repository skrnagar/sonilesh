/** URL prefixes that render the Files & Data app shell (lighter than EHS workspace). */
export const FILES_APP_PREFIXES = ["/app/files", "/app/documents", "/app/import"] as const;

export function isFilesAppPath(pathname: string) {
  return FILES_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Top-level apps and their base paths (for middleware + docs). */
export const APP_SURFACES = {
  marketing: { prefix: "/", protected: false },
  platformAdmin: { prefix: "/admin", protected: true },
  orgAdmin: { prefix: "/org-admin", protected: true },
  workspace: { prefix: "/app", protected: true },
  field: { prefix: "/field", protected: true },
  contractor: { prefix: "/contractor", protected: true },
} as const;
