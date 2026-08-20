/** Same-origin relative paths only. Blocks `//host`, `@`, and backslash open redirects. */
export function safeRelativePath(raw: string | null | undefined, fallback = "/app/dashboard") {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("@")) {
    return fallback;
  }
  try {
    const resolved = new URL(raw, "https://local.invalid");
    if (resolved.origin !== "https://local.invalid") return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
